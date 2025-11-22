import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  patientsAPI,
  appointmentsAPI,
  prescriptionsAPI,
  analyticsAPI
} from "../services/api";

const PatientProfile = () => {
  const { id: patientId } = useParams();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadAllData();
  }, [patientId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Patient Info
      const pRes = await patientsAPI.getById(patientId);

      // Medical Records
      const rRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/patients/${patientId}/medical-records`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Prescriptions
      const prRes = await prescriptionsAPI.getByPatient(patientId);

      // Appointments
      const aRes = await appointmentsAPI.getAll({ patientId });

      setPatient(pRes.data);
      setRecords(rRes.data.medicalRecords || []);
      setPrescriptions(prRes.data.prescriptions || []);
      setAppointments(aRes.data.appointments || []);
    } catch (err) {
      console.error("Error loading patient data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !patient) {
    return <div className="loading">Loading patient profile...</div>;
  }

  return (
    <div className="patient-profile">

      {/* Header */}
      <div className="page-header">
        <h1>
          {patient.firstName} {patient.lastName}
        </h1>
        <p>Patient ID: {patient.id}</p>

        <Link to="/patients" className="secondary-button">
          ← Back to Patients
        </Link>
      </div>

      {/* TABS */}
      <div className="tabs">
        {["profile", "medical", "appointments", "prescriptions"].map((tab) => (
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

      {/* CONTENT */}
      <div className="content-area mt-3">

        {/* PROFILE TAB */}
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
                <strong>Address:</strong> {JSON.stringify(patient.address)}
              </div>
            )}
          </div>
        )}

        {/* MEDICAL TAB */}
        {activeTab === "medical" && (
          <div className="card">
            <h2>Medical Records</h2>

            <Link
              to={`/patients/${patientId}/records`}
              className="primary-button"
            >
              ➕ Add Medical Record
            </Link>

            {records.length === 0 ? (
              <p className="no-data mt-3">No records available.</p>
            ) : (
              records.map((rec) => (
                <div key={rec.id} className="list-item mt-3">
                  <strong>Visit:</strong>{" "}
                  {new Date(rec.visitDate).toLocaleDateString()}
                  <br />
                  <strong>Symptoms:</strong> {rec.symptoms.join(", ")}
                  {rec.diagnosis && <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>}
                  {rec.treatment && <p><strong>Treatment:</strong> {rec.treatment}</p>}
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
              <p className="no-data">No appointments found.</p>
            ) : (
              appointments.map((apt) => (
                <div className="list-item" key={apt.id}>
                  <strong>{new Date(apt.appointmentDate).toLocaleString()}</strong>
                  <br />
                  Reason: {apt.reason}
                  <br />
                  <span className={`status-badge ${apt.status}`}>
                    {apt.status}
                  </span>
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
              <p className="no-data">No prescriptions found.</p>
            ) : (
              prescriptions.map((p) => (
                <div className="list-item" key={p.id}>
                  <strong>{p.medicationName}</strong> — {p.dosage}
                  <br />
                  Instructions: {p.instructions || "None"}
                  <br />
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
