import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PatientForm = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    bloodType: '',
    medicalHistory: ''
  });
  const [loading, setLoading] = useState(false);

  // Use the same base URL as your api.js
  const API_BASE_URL = 'http://13.127.5.209:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('📝 PatientForm: Submitting patient data:', formData);
      
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('📥 PatientForm: Response status:', response.status);
      const data = await response.json();
      console.log('📥 PatientForm: Response data:', data);
      
      if (response.ok) {
        console.log('✅ Patient created successfully');
        alert('Patient created successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          phone: '',
          email: '',
          address: '',
          emergencyContact: '',
          bloodType: '',
          medicalHistory: ''
        });
      } else {
        console.log('❌ Patient creation failed:', data.error);
        alert(`Error: ${data.error || 'Failed to create patient'}`);
      }
    } catch (error) {
      console.error('❌ PatientForm Error:', error);
      alert('Error creating patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="patient-form">
      <h2>Create New Patient</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            name="firstName"
            placeholder="First Name *"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name *"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender *</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-row">
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number *"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />

        <input
          type="text"
          name="emergencyContact"
          placeholder="Emergency Contact"
          value={formData.emergencyContact}
          onChange={handleChange}
        />

        <select name="bloodType" value={formData.bloodType} onChange={handleChange}>
          <option value="">Blood Type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <textarea
          name="medicalHistory"
          placeholder="Medical History"
          value={formData.medicalHistory}
          onChange={handleChange}
          rows="3"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
};

export default PatientForm;
