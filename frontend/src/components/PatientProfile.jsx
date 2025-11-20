import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { patientsAPI, appointmentsAPI, prescriptionsAPI, filesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PatientProfile() {
  const { id } = useParams();
  const { token } = useAuth();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAllData();
  }, [id]);

  const loadAllData = async () => {
    try {
      const [p, a, r, f] = await Promise.all([
        patientsAPI.getById(id),
        appointmentsAPI.getAll({ patientId: id }),
        prescriptionsAPI.getByPatient(id),
        filesAPI.getByPatient(id)
      ]);

      setPatient(p.data);
      setAppointments(a.data.appointments || []);
      setPrescriptions(r.data.prescriptions || []);
      setFiles(f.data.files || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !patient) {
    return <div className="loading">Loading patient profile…</div>;
  }

  const calcAge = (dob) => {
    const y = new Date().getFullYear() - new Date(dob).getFullYear();
    return y;
  };

  return (
    <div className="patient-profile">
      <div className="page-header">
        <h1>{patient.firstName} {patient.lastName}</h1>
        <p>Patient ID: {id}</p>

        <Link to="/patients" className="secondary-button">← Back</Link>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>Appointments</button>
        <button className={activeTab === "prescriptions" ? "active" : ""} onClick={() => setActiveTab("prescriptions")}>Prescriptions</button>
    <button className={activeTab === "files" ? "active" : ""} onClick={() => setActiveTab("files")}>Files</button>
        <button className={activeTab === "records" ? "active" : ""} onClick={() => setActiveTab("records")}>Medical Records</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="card">
          <h2>Patient Overview</h2>
          <p><strong>Age:</strong> {calcAge(patient.dateOfBirth)}</p>
          <p><strong>Gender:</strong> {patient.gender}</p>
          <p><strong>Phone:</strong> {patient.phone}</p>
          <p><strong>Email:</strong> {patient.email || "N/A"}</p>
          <p><strong>Blood Type:</strong> {patient.bloodType || "N/A"}</p>
          <p><strong>Address:</strong> {patient.address || "N/A"}</p>

          <Link to={`/patients/${id}/records`} className="primary-button">
            View Medical History
          </Link>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="card">
          <h2>Appointments</h2>

          {appointments.length === 0 ? (
            <p className="no-data">No appointments found.</p>
          ) : (
            appointments.map((apt) => (
              <div key={apt.id} className="list-item">
                <strong>{new Date(apt.appointmentDate).toLocaleString()}</strong>
                <p>{apt.reason}</p>
                <span className={`status-badge ${apt.status}`}>{apt.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "prescriptions" && (
        <div className="card">
          <h2>Prescriptions</h2>

          {prescriptions.length === 0 ? (
            <p className="no-data">No prescriptions.</p>
          ) : (
            prescriptions.map((p) => (
              <div key={p.id} className="list-item">
                <strong>{p.medicationName}</strong>
                <p>{p.dosage}</p>
                <p>{p.instructions}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "files" && (
        <div className="card">
          <h2>Files</h2>

          {files.length === 0 ? (
            <p className="no-data">No uploaded files.</p>
          ) : (
            files.map((f) => (
              <div key={f.id} className="list-item">
                <p><strong>{f.fileType}</strong></p>
                <a href={f.downloadUrl} target="_blank" rel="noreferrer">Download</a>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "records" && (
        <div>
          <MedicalRecords embedded patientId={id} />
        </div>
      )}
    </div>
  );
}
