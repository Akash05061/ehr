import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MedicalRecords = () => {
  const { id: patientId } = useParams();
  const { token } = useAuth();

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
      bmi: "",
    },
    notes: "",
    followUpDate: "",
  });

  const API_BASE_URL = "http://13.127.5.209:3001/api";

  useEffect(() => {
    if (patientId) fetchMedicalRecords();
  }, [patientId]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/patients/${patientId}/medical-records`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch medical records");
        return;
      }

      const data = await response.json();
      setMedicalRecords(data.medicalRecords || []);
    } catch (err) {
      console.error("Error fetching medical records:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.vitals.height);
    const weight = parseFloat(formData.vitals.weight);

    if (height > 0 && weight > 0) {
      const heightM = height / 100;
      const bmi = (weight / (heightM * heightM)).toFixed(1);

      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, bmi },
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("vitals.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
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
        bmi: "",
      },
      notes: "",
      followUpDate: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        symptoms: formData.symptoms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        medications: formData.medications
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
      };

      const response = await fetch(
        `${API_BASE_URL}/patients/${patientId}/medical-records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        alert("Medical record added successfully!");
        resetForm();
        setShowForm(false);
        fetchMedicalRecords();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add medical record");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Network error while adding record");
    } finally {
      setLoading(false);
    }
  };

  if (loading && medicalRecords.length === 0) {
    return (
      <div className="medical-records">
        <div className="loading">Loading medical records...</div>
      </div>
    );
  }

  return (
    <div className="medical-records">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-content">
          <h1>Medical Records</h1>
          <p>Patient ID: {patientId}</p>
        </div>

        <div className="header-actions">
          {/* YOU CHOSE YES → KEEP BACK BUTTON */}
          <Link to="/patients" className="secondary-button">
            ← Back to Patients
          </Link>

          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "➕ Add Medical Record"}
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="medical-record-form card">
          <h3>Add Medical Record</h3>

          <form onSubmit={handleSubmit}>
            {/* Basic Fields */}
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
                  placeholder="Fever, cough (comma separated)"
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
                  placeholder="Enter diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Treatment Plan</label>
                <input
                  type="text"
                  name="treatment"
                  placeholder="Enter treatment"
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
                placeholder="Paracetamol, Amoxicillin..."
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
                    placeholder="120/80 mmHg"
                    value={formData.vitals.bloodPressure}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    name="vitals.temperature"
                    step="0.1"
                    placeholder="37.0"
                    value={formData.vitals.temperature}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Heart Rate (bpm)</label>
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
                    step="0.1"
                  />
                </div>

                <div className="form-group">
                  <label>BMI</label>
                  <input
                    type="text"
                    name="vitals.bmi"
                    readOnly
                    className="readonly"
                    value={formData.vitals.bmi}
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Additional details..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            {/* Follow Up */}
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Save Record
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

      {/* LIST OF RECORDS */}
      <div className="medical-records-list">
        <div className="section-header">
          <h2>Medical History</h2>
          <span className="record-count">({medicalRecords.length})</span>
        </div>

        {medicalRecords.length === 0 ? (
          <div className="no-data">
            <p>No medical records found.</p>
            <p>Click "Add Medical Record" to create the first entry.</p>
          </div>
        ) : (
          <div className="records-grid">
            {medicalRecords.map((record) => (
              <div key={record.id} className="medical-record-card card">
                <div className="record-header">
                  <h3>
                    Visit on {new Date(record.visitDate).toLocaleDateString()}
                  </h3>
                  <span className="record-id">Record #{record.id}</span>
                </div>

                <div className="record-content">
                  {/* Symptoms */}
                  <div className="record-section">
                    <strong>🩺 Symptoms:</strong>
                    <div className="symptoms-list">
                      {record.symptoms.map((sym, i) => (
                        <span key={i} className="symptom-tag">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {record.diagnosis && (
                    <div className="record-section">
                      <strong>📋 Diagnosis:</strong> {record.diagnosis}
                    </div>
                  )}

                  {/* Treatment */}
                  {record.treatment && (
                    <div className="record-section">
                      <strong>💊 Treatment:</strong> {record.treatment}
                    </div>
                  )}

                  {/* Medications */}
                  {record.medications.length > 0 && (
                    <div className="record-section">
                      <strong>💊 Medications:</strong>
                      <div className="medications-list">
                        {record.medications.map((m, i) => (
                          <span key={i} className="medication-tag">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vitals */}
                  {Object.values(record.vitals).some((v) => v) && (
                    <div className="record-section">
                      <strong>📊 Vitals:</strong>
                      <div className="vitals-grid">
                        {Object.entries(record.vitals).map(([k, v]) =>
                          v ? (
                            <div key={k} className="vital-item">
                              <span className="vital-label">
                                {k.toUpperCase()}:
                              </span>
                              <span className="vital-value">{v}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="record-section">
                      <strong>📝 Notes:</strong>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  {/* Follow up */}
                  {record.followUpDate && (
                    <div className="record-section">
                      <strong>📅 Follow-up:</strong>{" "}
                      {new Date(record.followUpDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="record-footer">
                  <small>
                    Added by User #{record.createdBy} on{" "}
                    {new Date(record.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
