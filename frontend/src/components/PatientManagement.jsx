import { useState } from 'react';
import PatientForm from './PatientForm';
import PatientSearch from './PatientSearch';

const PatientManagement = () => {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="patient-management">
      <h1>Patient Management</h1>
      
      <div className="tabs">
        <button onClick={() => setActiveTab('search')}>
          Search Patients
        </button>
        <button onClick={() => setActiveTab('create')}>
          Add New Patient
        </button>
      </div>

      {activeTab === 'search' && <PatientSearch />}
      {activeTab === 'create' && <PatientForm />}
    </div>
  );
};

export default PatientManagement;
