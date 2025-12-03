import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { patientsAPI } from "../services/api";

const PatientProfile = () => {
  const { id: patientId } = useParams();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

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

      // Normalize patient
      setPatient({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        dateOfBirth: p.dob,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        city: p.city
      });

      // Normalize appointments
      setAppointments(
        res.data.appointments.map(a => ({
          id: a.id,
          appointmentDate: a.appointment_date,
          reason: a.reason,
          status: a.status
        }))
      );

      // Normalize prescriptions
      setPrescriptions(
        res.data.prescriptions.map(pr => ({
          id: pr.id,
          medicationName: pr.medication_name,
          dosage: pr.dosage,
          instructions: pr.instructions
        }))
      );

      // Normalize medical records
      setMedicalRecords(
        res.data.medical_records.map(m => ({
          id: m.id,
          visitDate: m.visit_date,
          symptoms: m.symptoms ? JSON.parse(m.symptoms) : [],
          diagnosis: m.diagnosis,
          treatment: m.treatment
        }))
      );

    } catch (err) {
      console.error("Error loading patient:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading patient profile...</div>;
  if (!patient) return <div className="loading">Patient not found</div>;

  return (
    <div className="patient-profile">
      
      <div className="page-header">
        <h1>{patient.firstName} {patient.lastName}</h1>
        <p>Patient ID: {patient.id}</p>

        <Link to="/patients" className="secondary-button">
          ← Back
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

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="card">
            <h2>Basic Information</h2>
            <p><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
            <p><strong>DOB:</strong> {patient.dateOfBirth}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Phone:</strong> {patient.phone}</p>
            <p><strong>Email:</strong> {patient.email || "N/A"}</p>
            <p><strong>City:</strong> {patient.city || "N/A"}</p>
          </div>
        )}

        {/* MEDICAL RECORDS TAB */}
        {activeTab === "medical" && (
          <div className="card">
            <h2>Medical Records</h2>

            {medicalRecords.length === 0 ? (
              <p>No records available.</p>
            ) : (
              medicalRecords.map(rec => (
                <div key={rec.id} className="list-item">
                  <strong>Visit:</strong> {rec.visitDate}<br />
                  <strong>Symptoms:</strong> {rec.symptoms.join(", ")}<br />
                  <strong>Diagnosis:</strong> {rec.diagnosis}<br />
                  <strong>Treatment:</strong> {rec.treatment}<br />
                </div>
              ))
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="card">
            <h2>Appointments</h2>
            {appointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              appointments.map(a => (
                <div key={a.id} className="list-item">
                  <strong>{a.appointmentDate}</strong><br />
                  Reason: {a.reason}<br />
                  Status: {a.status}
                </div>
              ))
            )}
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === "prescriptions" && (
          <div className="card">
            <h2>Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p>No prescriptions found.</p>
            ) : (
              prescriptions.map(pr => (
                <div key={pr.id} className="list-item">
                  <strong>{pr.medicationName}</strong><br />
                  Dosage: {pr.dosage}<br />
                  Instructions: {pr.instructions}
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
