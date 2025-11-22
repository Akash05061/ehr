import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { patientsAPI } from "../services/api";

export default function PatientSearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // 🔥 Auto-load all patients on page load
  useEffect(() => {
    loadAllPatients();
  }, []);

  const loadAllPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      setResults(res.data.patients || []);
    } catch (error) {
      console.error("Error loading patients:", error);
    }
  };

  const runSearch = async () => {
    if (search.trim() === "") {
      // If search is empty → load all patients
      return loadAllPatients();
    }

    const res = await patientsAPI.search(search);
    setResults(res.data.patients || []);
  };

  return (
    <div className="patient-search">
      <h2>Search Patients</h2>

      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search by name, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={runSearch}>Search</button>
      </div>

      {results.length === 0 && <p>No patients found.</p>}

      <div className="patients-grid">
        {results.map((p) => (
          <div key={p.id} className="card patient-card">
            <h4>{p.firstName} {p.lastName}</h4>
            <p>ID: {p.id}</p>
            <p>Phone: {p.phone}</p>
            <Link className="view-btn" to={`/patients/${p.id}`}>
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
