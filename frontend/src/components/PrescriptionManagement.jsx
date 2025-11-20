import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const PrescriptionManagement = () => {
  const { token } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    medicationName: "",
    dosage: "",
    instructions: "",
  });

  const API_BASE_URL = "http://13.127.5.209:3001/api";

  // ===================================================
  // LOAD PRESCRIPTIONS FOR A PATIENT
  // ===================================================
  const loadPrescriptions = async () => {
    if (!selectedPatientId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/patients/${selectedPatientId}/prescriptions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPrescriptions(data.prescriptions || []);
      } else {
        alert(data.error || "Failed to load prescriptions");
      }
    } catch (error) {
      console.log(error);
      alert("Unable to fetch prescriptions. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [selectedPatientId]);

  // ===================================================
  // CREATE PRESCRIPTION
  // ===================================================
  const createPrescription = async () => {
    if (
      !formData.patientId ||
      !formData.medicationName ||
      !formData.dosage ||
      !formData.instructions
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

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
        alert("Prescription added successfully!");
        setShowForm(false);

        // Reset after submit
        setFormData({
          patientId: "",
          medicationName: "",
          dosage: "",
          instructions: "",
        });

        // Reload prescriptions for that patient
        if (selectedPatientId === formData.patientId) {
          loadPrescriptions();
        }
      } else {
        alert(data.error || "Failed to add prescription");
      }
    } catch (error) {
      console.log(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prescription-management">
      <div className="page-header">
        <h1>Prescription Management</h1>
        <p>View, create, and manage patient prescriptions</p>
      </div>

      {/* ============================= */}
      {/*  Patient Selection for Records */}
      {/* ============================= */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <h3>Load Prescriptions</h3>
        <input
          type="number"
          placeholder="Enter Patient ID"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        />

        <button
          className="primary-button"
          style={{ marginTop: "10px" }}
          onClick={loadPrescriptions}
        >
          Load Records
        </button>
      </div>

      {/* ============================= */}
      {/*  Add New Prescription Button   */}
      {/* ============================= */}
      <button
        className="primary-button"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Cancel" : "Create New Prescription"}
      </button>

      {/* ============================= */}
      {/*  Prescription Form            */}
      {/* ============================= */}
      {showForm && (
        <div className="prescription-form card">
          <h3>Create Prescription</h3>

          <input
            type="number"
            placeholder="Patient ID *"
            value={formData.patientId}
            onChange={(e) =>
              setFormData({ ...formData, patientId: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Medication Name *"
            value={formData.medicationName}
            onChange={(e) =>
              setFormData({ ...formData, medicationName: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Dosage (e.g. 500mg - 1/Day) *"
            value={formData.dosage}
            onChange={(e) =>
              setFormData({ ...formData, dosage: e.target.value })
            }
          />

          <textarea
            placeholder="Instructions *"
            rows="3"
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
          />

          <button className="primary-button" type="button" onClick={createPrescription}>
            Save Prescription
          </button>
        </div>
      )}

      {/* ============================= */}
      {/*  Prescription List            */}
      {/* ============================= */}
      <div className="prescriptions-list" style={{ marginTop: "30px" }}>
        <h2>Prescriptions</h2>

        {loading ? (
          <p>Loading...</p>
        ) : prescriptions.length === 0 ? (
          <p>No prescriptions found.</p>
        ) : (
          prescriptions.map((p) => (
            <div key={p.id} className="card list-item">
              <h4>Prescription #{p.id}</h4>
              <p>
                <strong>Medication:</strong> {p.medicationName}
              </p>
              <p>
                <strong>Dosage:</strong> {p.dosage}
              </p>
              <p>
                <strong>Instructions:</strong> {p.instructions}
              </p>
              <p>
                <strong>Issued On:</strong>{" "}
                {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrescriptionManagement;
