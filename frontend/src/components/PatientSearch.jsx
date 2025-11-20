import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PatientSearch = () => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('id'); // 'id' or 'name'

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let url = '/api/patients';
      if (searchType === 'id') {
        url = `/api/patients/${searchTerm}`;
      } else {
        url = `/api/patients?search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (searchType === 'id') {
          setSelectedPatient(data);
          setPatients([]);
        } else {
          setPatients(data.patients || []);
          setSelectedPatient(null);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Patient not found'}`);
        setPatients([]);
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      alert('Error searching patients. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPatients();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPatients([]);
    setSelectedPatient(null);
  };

  return (
    <div className="patient-search">
      <h2>Search Patients</h2>
      
      <div className="search-controls">
        <div className="search-type">
          <label>
            <input
              type="radio"
              value="id"
              checked={searchType === 'id'}
              onChange={(e) => setSearchType(e.target.value)}
            />
            Search by ID
          </label>
          <label>
            <input
              type="radio"
              value="name"
              checked={searchType === 'name'}
              onChange={(e) => setSearchType(e.target.value)}
            />
            Search by Name
          </label>
        </div>

        <div className="search-input-group">
          <input
            type={searchType === 'id' ? 'number' : 'text'}
            placeholder={searchType === 'id' ? 'Enter Patient ID' : 'Search by name or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={searchPatients} disabled={loading || !searchTerm.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={clearSearch} className="secondary">
            Clear
          </button>
        </div>
      </div>
      
      {/* Single Patient View */}
      {selectedPatient && (
        <div className="patient-details card">
          <h3>Patient Details</h3>
          <div className="patient-info">
            <p><strong>ID:</strong> {selectedPatient.id}</p>
            <p><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
            <p><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth}</p>
            <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            <p><strong>Phone:</strong> {selectedPatient.phone}</p>
            <p><strong>Email:</strong> {selectedPatient.email || 'N/A'}</p>
            <p><strong>Blood Type:</strong> {selectedPatient.bloodType || 'Not specified'}</p>
            {selectedPatient.address && Object.keys(selectedPatient.address).length > 0 && (
              <p><strong>Address:</strong> {JSON.stringify(selectedPatient.address)}</p>
            )}
          </div>
          
          {/* Medical History */}
          {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
            <div className="medical-section">
              <h4>Appointments ({selectedPatient.appointments.length})</h4>
              <div className="appointments-list">
                {selectedPatient.appointments.map(apt => (
                  <div key={apt.id} className="appointment-item">
                    <span>{apt.appointmentDate}</span> - <span>{apt.reason}</span> - <span className={`status ${apt.status}`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Multiple Patients View */}
      {patients.length > 0 && (
        <div className="patients-list">
          <h3>Search Results ({patients.length})</h3>
          <div className="patients-grid">
            {patients.map(patient => (
              <div key={patient.id} className="patient-card card" onClick={() => setSelectedPatient(patient)}>
                <h4>{patient.firstName} {patient.lastName}</h4>
                <p>ID: {patient.id}</p>
                <p>Phone: {patient.phone}</p>
                <p>DOB: {patient.dateOfBirth}</p>
                <button className="view-btn">View Details</button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No Results */}
      {!loading && searchTerm && patients.length === 0 && !selectedPatient && (
        <div className="no-results">
          <p>No patients found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default PatientSearch;
