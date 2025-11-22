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
    city: '',
    bloodType: '',
    medicalHistory: ''
  });

  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://35.154.95.223:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔥 Convert form to backend format
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender, // Should be "Male", "Female"
      phone: formData.phone,
      email: formData.email,
      address: {
        city: formData.city
      },
      medicalHistory: formData.medicalHistory
        ? formData.medicalHistory.split(',').map(s => s.trim())
        : []
    };

    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Patient created successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          phone: '',
          email: '',
          city: '',
          bloodType: '',
          medicalHistory: ''
        });
      } else {
        alert(`Error: ${data.error}`);
      }

    } catch (err) {
      console.error(err);
      alert('Error creating patient.');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="patient-form">
      <h2>Create New Patient</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>     {/* 🔥 Fixed */}
            <option value="Female">Female</option> {/* 🔥 Fixed */}
            <option value="Other">Other</option>   {/* 🔥 Fixed */}
          </select>
        </div>

        <div className="form-row">
          <input name="phone" placeholder="Phone *" value={formData.phone} onChange={handleChange} required />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        </div>

        {/* 🔥 New – backend expects an address object */}
        <input name="city" placeholder="City" value={formData.city} onChange={handleChange} />

        <textarea
          name="medicalHistory"
          placeholder="Medical History (comma separated)"
          value={formData.medicalHistory}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
};

export default PatientForm;
