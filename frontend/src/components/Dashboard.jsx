import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI, patientsAPI, appointmentsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalPrescriptions: 0
  });

  const [recentPatients, setRecentPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ---------- Fetch Stats (only admin has this route) ----------
      if (user?.role === "admin") {
        try {
          const statsResponse = await analyticsAPI.getOverview();
          setStats(statsResponse.data || stats);
        } catch (e) {
          console.warn("Analytics not implemented yet.");
        }
      }

      // ---------- Recent Patients ----------
      const patientsResponse = await patientsAPI.getAll();
      const allPatients = patientsResponse.data.patients || [];

      // Show last 5 patients only
      setRecentPatients(allPatients.slice(-5));

      // ---------- Today’s Appointments (manual filter, backend has no date filter) ----------
      const appointmentsResponse = await appointmentsAPI.getAll();
      const allAppointments = appointmentsResponse.data.appointments || [];

      const today = new Date().toISOString().split("T")[0];

      const filteredToday = allAppointments.filter(a => 
        a.appointmentDate && a.appointmentDate.startsWith(today)
      );

      setTodayAppointments(filteredToday);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
      <div className="stat-icon">{icon}</div>
      {link && <Link to={link} className="stat-link">View All</Link>}
    </div>
  );

  if (loading) {
    return <div className="dashboard"><div className="loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
      </div>

      {/* ---------- Stats Section ---------- */}
      <div className="stats-grid">
        <StatCard title="Total Patients" value={stats.totalPatients} icon="👥" color="blue" link="/patients" />
        <StatCard title="Today's Appointments" value={todayAppointments.length} icon="📅" color="green" link="/appointments" />
        <StatCard title="Upcoming Appointments" value={stats.upcomingAppointments} icon="⏰" color="orange" link="/appointments" />
        <StatCard title="Total Prescriptions" value={stats.totalPrescriptions} icon="💊" color="purple" link="/prescriptions" />
      </div>

      <div className="dashboard-content">

        {/* ---------- Today's Appointments ---------- */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Today's Appointments</h2>
            <Link to="/appointments" className="view-all">View All</Link>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="appointments-list">
              {todayAppointments.map(a => (
                <div className="appointment-item" key={a.id}>
                  <div className="appointment-time">
                    {new Date(a.appointmentDate).toLocaleTimeString()}
                  </div>
                  <div className="appointment-details">
                    <strong>Appointment #{a.id}</strong>
                    <span>Reason: {a.reason}</span>
                    <span className={`status-badge ${a.status}`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No appointments today.</p>
          )}
        </div>

        {/* ---------- Recent Patients ---------- */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Patients</h2>
            <Link to="/patients" className="view-all">View All</Link>
          </div>

          {recentPatients.length > 0 ? (
            <div className="patients-list">
              {recentPatients.map(p => (
                <div className="patient-item" key={p.id}>
                  <div className="patient-avatar">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="patient-info">
                    <strong>{p.firstName} {p.lastName}</strong>
                    <span>Phone: {p.phone}</span>
                    <span>DOB: {p.dateOfBirth}</span>
                  </div>
                  <Link to={`/patients/${p.id}`} className="view-patient">View</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent patients.</p>
          )}
        </div>

        {/* ---------- Quick Actions ---------- */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/patients" className="action-card"><div className="action-icon">➕</div><span>Add Patient</span></Link>
            <Link to="/appointments" className="action-card"><div className="action-icon">📅</div><span>Schedule Appointment</span></Link>
            <Link to="/prescriptions" className="action-card"><div className="action-icon">💊</div><span>Create Prescription</span></Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="action-card">
                <div className="action-icon">⚙️</div>
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
