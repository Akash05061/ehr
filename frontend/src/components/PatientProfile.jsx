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

      const res = await patientsAPI.getById(patientId);

      if (!res.data.success) {
        setPatient(null);
        return;
      }

      const p = res.data.patient;

      // 🔥 Normalize SQL → Frontend format
      const normalized = {
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.dob,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        city: p.city,

        appointments: p.appointments?.map(a => ({
          id: a.id,
          appointmentDate: a.appointment_date,
          reason: a.reason,
          status: a.status
        })) || [],

        prescriptions: p.prescriptions?.map(pr => ({
          id: pr.id,
          medicationName: pr.medication_name,
          dosage: pr.dosage,
          duration: pr.duration,
          instructions: pr.instructions
        })) || [],

        medicalRecords: p.medicalRecords?.map(m => ({
          id: m.id,
          visitDate: m.visit_date,
          symptoms: Array.isArray(m.symptoms) ? m.symptoms : [],
          diagnosis: m.diagnosis,
          treatment: m.treatment
        })) || []
      };

      setPatient(normalized);

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

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="card">
            <h2>Basic Information</h2>

            <div className="list-item"><strong>Name:</strong> {patient.firstName} {patient.lastName}</div>
            <div className="list-item"><strong>DOB:</strong> {patient.dateOfBirth}</div>
            <div className="list-item"><strong>Gender:</strong> {patient.gender}</div>
            <div className="list-item"><strong>Phone:</strong> {patient.phone}</div>
            <div className="list-item"><strong>Email:</strong> {patient.email || "N/A"}</div>
            <div className="list-item"><strong>City:</strong> {patient.city || "N/A"}</div>
          </div>
        )}

        {/* MEDICAL RECORDS */}
        {activeTab === "medical" && (
          <div className="card">
            <h2>Medical Records</h2>

            <Link to={`/patients/${patientId}/records`} className="primary-button">
              ➕ Add Medical Record
            </Link>

            {medicalRecords.length === 0 ? (
              <p className="no-data mt-3">No records available.</p>
            ) : (
              medicalRecords.map((rec) => (
                <div key={rec.id} className="list-item mt-3">
                  <strong>Visit:</strong> {new Date(rec.visitDate).toLocaleDateString()}<br />
                  <strong>Symptoms:</strong> {rec.symptoms.join(", ")}
                  {rec.diagnosis && <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>}
                  {rec.treatment && <p><strong>Treatment:</strong> {rec.treatment}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="card">
            <h2>Appointments</h2>

            {appointments.length === 0 ? (
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

        {/* PRESCRIPTIONS */}
        {activeTab === "prescriptions" && (
          <div className="card">
            <h2>Prescriptions</h2>

            {prescriptions.length === 0 ? (
              <p className="no-data">No prescriptions found.</p>
            ) : (
              prescriptions.map((p) => (
                <div key={p.id} className="list-item">
                  <strong>{p.medicationName}</strong> — {p.dosage}<br />
                  Instructions: {p.instructions || "None"}<br />
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
