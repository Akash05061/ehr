import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { patientsAPI } from "../services/api";

export default function PatientSearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all patients at page load
  useEffect(() => {
    loadPatients();
  }, []);

  // 🔥 Fetch patients (with search or all)
  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await patientsAPI.getAll({
        search: search.trim(),
        page: 1,
        limit: 50
      });

      // SQL backend returns: { success, patients, total }
      setResults(res.data.patients || []);
    } catch (err) {
      console.error("Error loading patients:", err);
    }
    setLoading(false);
  };

  // Search button click
  const runSearch = async () => {
    await loadPatients();
  };

  // Search when pressing Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") runSearch();
  };

  return (
    <div className="patient-search">
      <h2>Search Patients</h2>

      <div className="search-input-group">
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <button onClick={runSearch}>Search</button>
      </div>

      {loading && <p>Loading patients...</p>}

      {!loading && results.length === 0 && <p>No patients found.</p>}

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
