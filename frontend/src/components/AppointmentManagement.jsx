import { useState } from 'react';

const AppointmentManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentDate: '',
    reason: '',
    notes: ''
  });

  return (
    <div className="appointment-management">
      <h1>Appointment Management</h1>
      
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Schedule New Appointment'}
      </button>

      {showForm && (
        <div className="appointment-form">
          <h3>New Appointment</h3>
          <form>
            <input
              type="number"
              placeholder="Patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
            />
            <input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
            />
            <input
              type="text"
              placeholder="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
            <button type="button">Schedule</button>
          </form>
        </div>
      )}

      <div className="appointments-list">
        <p>Appointments will appear here</p>
      </div>
    </div>
  );
};

export default AppointmentManagement;
