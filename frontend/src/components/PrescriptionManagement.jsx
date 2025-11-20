import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://13.127.5.209:3001/api";

const PrescriptionManagement = () => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    patientId: "",
    medicationName: "",
    dosage: "",
    instructions: "",
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        console.error("Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Prescription created!");
        setShowForm(false);
        setFormData({
          patientId: "",
          medicationName: "",
          dosage: "",
          instructions: "",
        });
        fetchPrescriptions();
      } else {
        alert(data.error || "Failed to create prescription");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prescription-management">
      <div className="page-header">
        <h1>Prescription Management</h1>
        <p>Create and track patient prescriptions.</p>
      </div>

      <button
        className="primary-button"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "✖ Close Form" : "➕ Create Prescription"}
      </button>

      {showForm && (
        <div className="prescription-form card">
          <h3>New Prescription</h3>

          <form onSubmit={handleCreatePrescription}>
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
              <label>Medication Name *</label>
              <input
                type="text"
                required
                value={formData.medicationName}
                onChange={(e) =>
                  setFormData({ ...formData, medicationName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Dosage *</label>
              <input
                type="text"
                required
                placeholder="Example: 500mg twice daily"
                value={formData.dosage}
                onChange={(e) =>
                  setFormData({ ...formData, dosage: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Instructions</label>
              <textarea
                rows="3"
                placeholder="Meal timing, duration, etc..."
                value={formData.instructions}
                onChange={(e) =>
                  setFormData({ ...formData, instructions: e.target.value })
                }
              />
            </div>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Saving..." : "Save Prescription"}
            </button>
          </form>
        </div>
      )}

      <div className="prescriptions-list">
        <div className="section-header">
          <h2>All Prescriptions</h2>
          <span className="record-count">({prescriptions.length} entries)</span>
        </div>

        {loading ? (
          <p className="loading">Loading prescriptions...</p>
        ) : prescriptions.length === 0 ? (
          <p className="no-data">No prescriptions found.</p>
        ) : (
          prescriptions.map((p) => (
            <div key={p.id} className="appointment-item list-item">
              <strong>
                Patient #{p.patientId} — {p.medicationName}
              </strong>

              <p>Dosage: {p.dosage}</p>
              <p>Instructions: {p.instructions || "None"}</p>

              <span className="status-badge scheduled">Active</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrescriptionManagement;
