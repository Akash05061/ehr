import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { patientsAPI } from "../services/api";

const PatientProfile = () => {
  const { id: patientId } = useParams();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // ⭐ NEW SQL-based endpoint (returns full patient)
      const res = await patientsAPI.getById(patientId);

      setPatient(res.data);
    } catch (err) {
      console.error("Error loading patient:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading patient profile...</div>;
  if (!patient) return <div className="loading">Patient not found</div>;

  const { appointments, prescriptions, medicalRecords } = patient;

  return (
    <div className="patient-profile">

      <div className="page-header">
        <h1>{patient.firstName} {patient.lastName}</h1>
        <p>Patient ID: {patient.id}</p>

        <Link to="/patients" className="secondary-button">
          ← Back to Patients
        </Link>
      </div>

      {/* ---------------- TABS ---------------- */}
      <div className="tabs">
        {["profile", "medical", "appointments", "prescriptions"].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "profile" && "Profile"}
            {tab === "medical" && "Medical Records"}
            {tab === "appointments" && "Appointments"}
            {tab === "prescriptions" && "Prescriptions"}
          </button>
        ))}
      </div>

      <div className="content-area">

        {/* ---------------- PROFILE TAB ---------------- */}
        {activeTab === "profile" && (
          <div className="card">
            <h2>Basic Information</h2>

            <div className="list-item"><strong>Name:</strong> {patient.firstName} {patient.lastName}</div>
            <div className="list-item"><strong>DOB:</strong> {patient.dateOfBirth}</div>
            <div className="list-item"><strong>Gender:</strong> {patient.gender}</div>
            <div className="list-item"><strong>Phone:</strong> {patient.phone}</div>
            <div className="list-item"><strong>Email:</strong> {patient.email || "N/A"}</div>

            {patient.address && (
              <div className="list-item">
                <strong>Address:</strong> {patient.address.city || "N/A"}
              </div>
            )}
          </div>
        )}

        {/* ---------------- MEDICAL RECORDS TAB ---------------- */}
        {activeTab === "medical" && (
          <div className="card">
            <h2>Medical Records</h2>

            <Link to={`/patients/${patientId}/records`} className="primary-button">
              ➕ Add Medical Record
            </Link>

            {(!medicalRecords || medicalRecords.length === 0) ? (
              <p className="no-data mt-3">No records available.</p>
            ) : (
              medicalRecords.map((rec) => (
                <div key={rec.id} className="list-item mt-3">
                  <strong>Visit:</strong> {new Date(rec.visitDate).toLocaleDateString()}<br />
                  <strong>Symptoms:</strong> {rec.symptoms?.join(", ")}
                  {rec.diagnosis && <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>}
                  {rec.treatment && <p><strong>Treatment:</strong> {rec.treatment}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* ---------------- APPOINTMENTS TAB ---------------- */}
        {activeTab === "appointments" && (
          <div className="card">
            <h2>Appointments</h2>

            {(!appointments || appointments.length === 0) ? (
              <p className="no-data">No appointments found.</p>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="list-item">
                  <strong>{new Date(apt.appointmentDate).toLocaleString()}</strong><br />
                  Reason: {apt.reason}<br />
                  <span className={`status-badge ${apt.status}`}>{apt.status}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ---------------- PRESCRIPTIONS TAB ---------------- */}
        {activeTab === "prescriptions" && (
          <div className="card">
            <h2>Prescriptions</h2>

            {(!prescriptions || prescriptions.length === 0) ? (
              <p className="no-data">No prescriptions found.</p>
            ) : (
              prescriptions.map((p) => (
                <div key={p.id} className="list-item">
                  <strong>{p.medicationName}</strong> — {p.dosage}<br />
                  Instructions: {p.instructions || "None"}<br />
                  <span className="status-badge scheduled">Active</span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientProfile;
