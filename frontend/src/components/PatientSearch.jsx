import { useState } from "react";
import { Link } from "react-router-dom";
import { patientsAPI } from "../services/api";

export default function PatientSearch() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const runSearch = async () => {
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

      {results.length === 0 && search && <p>No results found.</p>}

      <div className="patients-grid">
        {results.map((p) => (
          <div key={p.id} className="card patient-card">
            <h4>{p.firstName} {p.lastName}</h4>
            <p>ID: {p.id}</p>
            <p>Phone: {p.phone}</p>
            <Link className="view-btn" to={`/patients/${p.id}`}>View Profile</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
