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
    totalPrescriptions: 0,
    recentLabResults: 0
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
      
      // Fetch stats (admin only or show limited for other roles)
      if (user?.role === 'admin') {
        const statsResponse = await analyticsAPI.getOverview();
        setStats(statsResponse.data);
      }

      // Fetch recent patients
      const patientsResponse = await patientsAPI.getAll({ page: 1, limit: 5 });
      setRecentPatients(patientsResponse.data.patients || []);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await appointmentsAPI.getAll({ date: today });
      setTodayAppointments(appointmentsResponse.data.appointments || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <div className="stat-icon">
        {icon}
      </div>
      {link && <Link to={link} className="stat-link">View All</Link>}
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.firstName}! Here's what's happening today.</p>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon="👥"
          color="blue"
          link="/patients"
        />
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          icon="📅"
          color="green"
          link="/appointments"
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          icon="⏰"
          color="orange"
          link="/appointments"
        />
        <StatCard
          title="Total Prescriptions"
          value={stats.totalPrescriptions}
          icon="💊"
          color="purple"
          link="/prescriptions"
        />
      </div>

      <div className="dashboard-content">
        {/* Today's Appointments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Today's Appointments</h2>
            <Link to="/appointments" className="view-all">View All</Link>
          </div>
          {todayAppointments.length > 0 ? (
            <div className="appointments-list">
              {todayAppointments.map(appointment => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    {new Date(appointment.appointmentDate).toLocaleTimeString()}
                  </div>
                  <div className="appointment-details">
                    <strong>Appointment #{appointment.id}</strong>
                    <span>Reason: {appointment.reason}</span>
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No appointments scheduled for today.</p>
          )}
        </div>

        {/* Recent Patients */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Patients</h2>
            <Link to="/patients" className="view-all">View All</Link>
          </div>
          {recentPatients.length > 0 ? (
            <div className="patients-list">
              {recentPatients.map(patient => (
                <div key={patient.id} className="patient-item">
                  <div className="patient-avatar">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div className="patient-info">
                    <strong>{patient.firstName} {patient.lastName}</strong>
                    <span>Phone: {patient.phone}</span>
                    <span>DOB: {patient.dateOfBirth}</span>
                  </div>
                  <Link to={`/patients`} className="view-patient">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No patients found.</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/patients" className="action-card">
              <div className="action-icon">➕</div>
              <span>Add New Patient</span>
            </Link>
            <Link to="/appointments" className="action-card">
              <div className="action-icon">📅</div>
              <span>Schedule Appointment</span>
            </Link>
            <Link to="/prescriptions" className="action-card">
              <div className="action-icon">💊</div>
              <span>Create Prescription</span>
            </Link>
            {user?.role === 'admin' && (
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
