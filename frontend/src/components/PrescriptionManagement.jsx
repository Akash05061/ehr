import { useState } from 'react';

const PrescriptionManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    medicationName: '',
    dosage: '',
    instructions: ''
  });

  return (
    <div className="prescription-management">
      <h1>Prescription Management</h1>
      
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create New Prescription'}
      </button>

      {showForm && (
        <div className="prescription-form">
          <h3>New Prescription</h3>
          <form>
            <input
              type="number"
              placeholder="Patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
            />
            <input
              type="text"
              placeholder="Medication Name"
              value={formData.medicationName}
              onChange={(e) => setFormData({...formData, medicationName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
            />
            <textarea
              placeholder="Instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
            />
            <button type="button">Create Prescription</button>
          </form>
        </div>
      )}

      <div className="prescriptions-list">
        <p>Prescriptions will appear here</p>
      </div>
    </div>
  );
};

export default PrescriptionManagement;
