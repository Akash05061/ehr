import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const AppointmentManagement = () => {
  const { token } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    appointmentDate: "",
    reason: "",
    notes: "",
  });

  const API_BASE_URL = "http://13.127.5.209:3001/api";

  // ================================
  // LOAD APPOINTMENTS
  // ================================
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else {
        console.log("Failed to fetch appointments");
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ================================
  // CREATE AN APPOINTMENT
  // ================================
  const createAppointment = async () => {
    if (!formData.patientId || !formData.appointmentDate || !formData.reason) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Appointment created!");
        setShowForm(false);
        setFormData({
          patientId: "",
          appointmentDate: "",
          reason: "",
          notes: "",
        });
        fetchAppointments();
      } else {
        alert(data.error || "Failed to create appointment");
      }
    } catch (error) {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // UPDATE STATUS
  // ================================
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchAppointments();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================================
  // UI
  // ================================
  return (
    <div className="appointment-management">
      <div className="page-header">
        <h1>Appointment Management</h1>
        <p>Manage upcoming and completed appointments</p>
      </div>

      <button
        className="primary-button"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Schedule New Appointment"}
      </button>

      {showForm && (
        <div className="appointment-form card">
          <h3>New Appointment</h3>

          <div className="form-row">
            <input
              type="number"
              placeholder="Patient ID *"
              value={formData.patientId}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
            />

            <input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) =>
                setFormData({ ...formData, appointmentDate: e.target.value })
              }
            />
          </div>

          <input
            type="text"
            placeholder="Reason *"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />

          <button className="primary-button" type="button" onClick={createAppointment}>
            Save Appointment
          </button>
        </div>
      )}

      {/* Appointment List */}
      <h2 style={{ marginTop: "30px" }}>All Appointments</h2>

      {loading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments found</p>
      ) : (
        <div className="appointments-list">
          {appointments.map((apt) => (
            <div key={apt.id} className="appointment-item">
              <div className="appointment-time">
                {new Date(apt.appointmentDate).toLocaleString()}
              </div>

              <div className="appointment-details">
                <strong>Appointment #{apt.id}</strong>
                <span>Patient ID: {apt.patientId}</span>
                <span>Reason: {apt.reason}</span>

                <span className={`status-badge ${apt.status}`}>
                  {apt.status}
                </span>
              </div>

              {/* Status Controls */}
              <div>
                <button
                  className="secondary-button"
                  onClick={() => updateStatus(apt.id, "completed")}
                >
                  Mark Completed
                </button>

                <button
                  className="secondary-button"
                  style={{ marginLeft: "10px" }}
                  onClick={() => updateStatus(apt.id, "cancelled")}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
