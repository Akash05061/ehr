import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { appointmentsAPI } from "../services/api";

const AppointmentManagement = () => {
  const { token, user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "", // 🔥 required by SQL backend
    appointmentDate: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ---------------- FETCH APPOINTMENTS ----------------
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsAPI.getAll();

      // 🔥 Normalize SQL → frontend format
      const normalized = (res.data.appointments || []).map((apt) => ({
        id: apt.id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        appointmentDate: apt.appointment_date,
        reason: apt.reason,
        status: apt.status,
        notes: apt.notes,
      }));

      setAppointments(normalized);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CREATE APPOINTMENT ----------------
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        patient_id: formData.patientId,
        doctor_id: formData.doctorId || 1, // 🔥 default admin doctor
        appointment_date: formData.appointmentDate,
        reason: formData.reason,
        notes: formData.notes || "",
      };

      const res = await appointmentsAPI.create(payload);

      alert("Appointment scheduled successfully!");
      setShowForm(false);

      setFormData({
        patientId: "",
        doctorId: "",
        appointmentDate: "",
        reason: "",
        notes: "",
      });

      fetchAppointments();
    } catch (err) {
      console.error("Create appointment error:", err);
      alert(err.response?.data?.error || "Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FILTERS ----------------
  const now = new Date();
  const upcoming = appointments.filter((apt) => new Date(apt.appointmentDate) >= now);
  const past = appointments.filter((apt) => new Date(apt.appointmentDate) < now);

  // ---------------- RENDER ----------------
  return (
    <div className="appointment-management">
      <div className="page-header">
        <h1>Appointment Management</h1>
        <p>Manage, schedule, and review patient appointments.</p>
      </div>

      <button className="primary-button" onClick={() => setShowForm(!showForm)}>
        {showForm ? "✖ Close Form" : "➕ Schedule New Appointment"}
      </button>

      {/* ---------------- FORM ---------------- */}
      {showForm && (
        <div className="appointment-form card">
          <h3>Schedule Appointment</h3>

          <form onSubmit={handleCreateAppointment}>
            <div className="form-group">
              <label>Patient ID *</label>
              <input
                type="number"
                required
                value={formData.patientId}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Doctor ID *</label>
              <input
                type="number"
                required
                value={formData.doctorId}
                onChange={(e) =>
                  setFormData({ ...formData, doctorId: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Appointment Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <input
                type="text"
                required
                placeholder="Consultation / Follow-up / Checkup"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows="3"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <button disabled={loading} className="primary-button" type="submit">
              {loading ? "Scheduling..." : "Schedule"}
            </button>
          </form>
        </div>
      )}

      {/* ---------------- LIST ---------------- */}
      <div className="appointments-list">
        <div className="section-header">
          <h2>Upcoming Appointments</h2>
        </div>

        {upcoming.length === 0 ? (
          <p className="no-data">No upcoming appointments.</p>
        ) : (
          upcoming.map((apt) => (
            <div key={apt.id} className="appointment-item list-item">
              <strong>{new Date(apt.appointmentDate).toLocaleString()}</strong>
              <p>Patient ID: {apt.patientId}</p>
              <p>Doctor ID: {apt.doctorId}</p>
              <p>Reason: {apt.reason}</p>
              <span className="status-badge scheduled">Scheduled</span>
            </div>
          ))
        )}

        <div className="section-header" style={{ marginTop: "30px" }}>
          <h2>Past Appointments</h2>
        </div>

        {past.length === 0 ? (
          <p className="no-data">No past appointments.</p>
        ) : (
          past.map((apt) => (
            <div key={apt.id} className="appointment-item list-item">
              <strong>{new Date(apt.appointmentDate).toLocaleString()}</strong>
              <p>Patient ID: {apt.patientId}</p>
              <p>Reason: {apt.reason}</p>
              <span className="status-badge completed">Completed</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
