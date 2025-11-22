import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api"; // axios instance

const MedicalRecords = ({ patientId: embeddedPatientId = null }) => {
  const routeParams = useParams();
  const patientId = embeddedPatientId || routeParams.id;

  const { token } = useAuth();

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    symptoms: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    vitals: {
      bloodPressure: "",
      temperature: "",
      heartRate: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      height: "",
      weight: "",
      bmi: ""
    },
    notes: "",
    followUpDate: ""
  });

  useEffect(() => {
    if (patientId) fetchMedicalRecords();
  }, [patientId]);

  // ---------------------- FETCH RECORDS ----------------------
  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);

      const res = await api.get("/medical-records", {
        params: { patientId }
      });

      setMedicalRecords(res.data.medicalRecords || []);
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- SUBMIT RECORD ----------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPayload = {
        patientId,
        visitDate: formData.visitDate,
        symptoms: formData.symptoms
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        medications: formData.medications
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        vitals: formData.vitals,
        notes: formData.notes,
        followUpDate: formData.followUpDate
      };

      const res = await api.post("/medical-records", cleanPayload);

      if (res.status === 201) {
        alert("Medical record added!");
        setShowForm(false);

        // Reset form
        setFormData({
          visitDate: new Date().toISOString().split("T")[0],
          symptoms: "",
          diagnosis: "",
          treatment: "",
          medications: "",
          vitals: {
            bloodPressure: "",
            temperature: "",
            heartRate: "",
            respiratoryRate: "",
            oxygenSaturation: "",
            height: "",
            weight: "",
            bmi: ""
          },
          notes: "",
          followUpDate: ""
        });

        fetchMedicalRecords();
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.error || "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- INPUT CHANGE ----------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("vitals.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, [key]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ---------------------- BMI CALC ----------------------
  const calculateBMI = () => {
    const h = parseFloat(formData.vitals.height);
    const w = parseFloat(formData.vitals.weight);

    if (h > 0 && w > 0) {
      const bmi = (w / ((h / 100) ** 2)).toFixed(1);
      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, bmi }
      }));
    }
  };

  if (loading && medicalRecords.length === 0) {
    return <div className="loading">Loading medical records...</div>;
  }

  return (
    <div className="medical-records">
      {!embeddedPatientId && (
        <div className="page-header">
          <h1>Medical Records</h1>
          <p>Patient ID: {patientId}</p>

          <Link to="/patients" className="secondary-button">
            ← Back
          </Link>
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <button className="primary-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✖ Cancel" : "➕ Add Medical Record"}
        </button>
      </div>

      {showForm && (
        <div className="card medical-record-form">
          <h3>Add Medical Record</h3>

          <form onSubmit={handleSubmit}>
            {/* General */}
            <div className="form-row">
              <div className="form-group">
                <label>Visit Date *</label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Symptoms *</label>
                <input
                  type="text"
                  name="symptoms"
                  placeholder="Fever, cough..."
                  value={formData.symptoms}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Diagnosis + Treatment */}
            <div className="form-row">
              <div className="form-group">
                <label>Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Treatment Plan</label>
                <input
                  type="text"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Medications */}
            <div className="form-group">
              <label>Medications</label>
              <input
                type="text"
                name="medications"
                placeholder="Paracetamol, Ibuprofen..."
                value={formData.medications}
                onChange={handleChange}
              />
            </div>

            {/* Vitals */}
            <div className="vitals-section">
              <h4>Vitals</h4>

              <div className="form-row">
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <input
                    type="text"
                    name="vitals.bloodPressure"
                    value={formData.vitals.bloodPressure}
                    onChange={handleChange}
                    placeholder="120/80"
                  />
                </div>

                <div className="form-group">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    name="vitals.temperature"
                    value={formData.vitals.temperature}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Heart Rate</label>
                  <input
                    type="number"
                    name="vitals.heartRate"
                    value={formData.vitals.heartRate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Respiratory Rate</label>
                  <input
                    type="number"
                    name="vitals.respiratoryRate"
                    value={formData.vitals.respiratoryRate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    name="vitals.oxygenSaturation"
                    value={formData.vitals.oxygenSaturation}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="vitals.height"
                    value={formData.vitals.height}
                    onChange={handleChange}
                    onBlur={calculateBMI}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="vitals.weight"
                    value={formData.vitals.weight}
                    onChange={handleChange}
                    onBlur={calculateBMI}
                  />
                </div>

                <div className="form-group">
                  <label>BMI</label>
                  <input
                    type="text"
                    name="vitals.bmi"
                    value={formData.vitals.bmi}
                    readOnly
                    className="readonly"
                  />
                </div>
              </div>
            </div>

            {/* Notes + Follow-up */}
            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                ➕ Add Record
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --------- LIST -------- */}
      <div className="medical-records-list mt-4">
        <h2 className="mb-3">
          Medical History ({medicalRecords.length} records)
        </h2>

        {medicalRecords.length === 0 ? (
          <p className="no-data">No medical records.</p>
        ) : (
          <div className="records-grid">
            {medicalRecords.map((r) => (
              <div key={r.id} className="card medical-record-card">
                <h3>Visit: {new Date(r.visitDate).toLocaleDateString()}</h3>

                <p><strong>Symptoms:</strong> {r.symptoms.join(", ")}</p>
                {r.diagnosis && <p><strong>Diagnosis:</strong> {r.diagnosis}</p>}
                {r.treatment && <p><strong>Treatment:</strong> {r.treatment}</p>}
                {r.medications?.length > 0 && (
                  <p><strong>Medications:</strong> {r.medications.join(", ")}</p>
                )}
                {r.notes && <p><strong>Notes:</strong> {r.notes}</p>}
                {r.followUpDate && (
                  <p><strong>Follow-up:</strong> {new Date(r.followUpDate).toLocaleDateString()}</p>
                )}

                <small className="text-muted">
                  Added by User #{r.createdBy} on{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
