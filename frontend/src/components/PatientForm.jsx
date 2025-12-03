import { useState } from "react";
import { patientsAPI } from "../services/api";

export default function PatientForm() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    city: "",
    bloodType: "",
    medicalHistory: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Backend needs snake_case
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      dob: formData.dateOfBirth,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      blood_type: formData.bloodType,
      medical_history: formData.medicalHistory
        ? formData.medicalHistory.split(",").map((x) => x.trim())
        : []
    };

    try {
      const res = await patientsAPI.create(payload);

      if (res.data.success) {
        alert("✅ Patient created successfully!");

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "",
          phone: "",
          email: "",
          city: "",
          bloodType: "",
          medicalHistory: ""
        });
      } else {
        alert("❌ Error: " + res.data.error);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Failed to create patient. Check backend logs.");
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
          <input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            name="lastName"
            placeholder="Last Name"
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

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender *</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-row">
          <input
            name="phone"
            placeholder="Phone *"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            placeholder="Email (optional)"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <input
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
        />

        <input
          name="bloodType"
          placeholder="Blood Type (optional)"
          value={formData.bloodType}
          onChange={handleChange}
        />

        <textarea
          name="medicalHistory"
          placeholder="Medical History (comma separated)"
          value={formData.medicalHistory}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Patient"}
        </button>
      </form>
    </div>
  );
}
