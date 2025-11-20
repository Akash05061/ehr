import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MedicalRecords = () => {
  const { id: patientId } = useParams();
  const { token } = useAuth();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    vitals: {
      bloodPressure: '',
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      height: '',
      weight: '',
      bmi: ''
    },
    notes: '',
    followUpDate: ''
  });

  const API_BASE_URL = 'http://13.127.5.209:3001/api';

  useEffect(() => {
    if (patientId) {
      fetchMedicalRecords();
    }
  }, [patientId]);

  const fetchMedicalRecords = async () => {
    try {
      console.log('🔍 Fetching medical records for patient:', patientId);
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Medical records response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Medical records data:', data);
        setMedicalRecords(data.medicalRecords || []);
      } else {
        console.error('❌ Failed to fetch medical records');
      }
    } catch (error) {
      console.error('❌ Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 Submitting medical record:', formData);
      
      const submitData = {
        ...formData,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
        medications: formData.medications.split(',').map(m => m.trim()).filter(m => m)
      };

      console.log('📤 Processed submission data:', submitData);

      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('📥 Submission response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Medical record added successfully:', result);
        alert('Medical record added successfully!');
        setShowForm(false);
        setFormData({
          visitDate: new Date().toISOString().split('T')[0],
          symptoms: '',
          diagnosis: '',
          treatment: '',
          medications: '',
          vitals: {
            bloodPressure: '',
            temperature: '',
            heartRate: '',
            respiratoryRate: '',
            oxygenSaturation: '',
            height: '',
            weight: '',
            bmi: ''
          },
          notes: '',
          followUpDate: ''
        });
        fetchMedicalRecords();
      } else {
        const errorData = await response.json();
        console.error('❌ Medical record submission failed:', errorData);
        alert(`Error: ${errorData.error || 'Failed to add medical record'}`);
      }
    } catch (error) {
      console.error('❌ Error adding medical record:', error);
      alert('Error adding medical record. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('vitals.')) {
      const vitalField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          [vitalField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.vitals.height);
    const weight = parseFloat(formData.vitals.weight);
    
    if (height && weight && height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setFormData(prev => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          bmi: bmi
        }
      }));
    }
  };

  if (loading && medicalRecords.length === 0) {
    return (
      <div className="medical-records">
        <div className="loading">Loading medical records...</div>
      </div>
    );
  }

  return (
    <div className="medical-records">
      <div className="page-header">
        <div className="header-content">
          <h1>Medical Records</h1>
          <p>Patient ID: {patientId}</p>
        </div>
        <div className="header-actions">
          <Link to="/patients" className="secondary-button">
            ← Back to Patients
          </Link>
          <button 
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            {showForm ? '✖ Cancel' : '➕ Add Medical Record'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="medical-record-form card">
          <h3>Add Medical Record</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Visit Date *</label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Symptoms *</label>
                <input
                  type="text"
                  name="symptoms"
                  placeholder="Fever, Headache, Cough (comma separated)"
                  value={formData.symptoms}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Diagnosis</label>
                <input
                  type="text"
                  name="diagnosis"
                  placeholder="Enter diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Treatment Plan</label>
                <input
                  type="text"
                  name="treatment"
                  placeholder="Enter treatment plan"
                  value={formData.treatment}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Medications</label>
              <input
                type="text"
                name="medications"
                placeholder="Paracetamol, Amoxicillin (comma separated)"
                value={formData.medications}
                onChange={handleChange}
              />
            </div>

            <div className="vitals-section">
              <h4>Vitals</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <input
                    type="text"
                    name="vitals.bloodPressure"
                    placeholder="120/80 mmHg"
                    value={formData.vitals.bloodPressure}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Temperature</label>
                  <input
                    type="number"
                    name="vitals.temperature"
                    placeholder="37.0 °C"
                    value={formData.vitals.temperature}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Heart Rate</label>
                  <input
                    type="number"
                    name="vitals.heartRate"
                    placeholder="72 bpm"
                    value={formData.vitals.heartRate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Respiratory Rate</label>
                  <input
                    type="number"
                    name="vitals.respiratoryRate"
                    placeholder="16 breaths/min"
                    value={formData.vitals.respiratoryRate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Oxygen Saturation</label>
                  <input
                    type="number"
                    name="vitals.oxygenSaturation"
                    placeholder="98 %"
                    value={formData.vitals.oxygenSaturation}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
                    name="vitals.height"
                    placeholder="170 cm"
                    value={formData.vitals.height}
                    onChange={handleChange}
                    onBlur={calculateBMI}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="number"
                    name="vitals.weight"
                    placeholder="65 kg"
                    value={formData.vitals.weight}
                    onChange={handleChange}
                    onBlur={calculateBMI}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>BMI</label>
                  <input
                    type="text"
                    name="vitals.bmi"
                    placeholder="Auto-calculated"
                    value={formData.vitals.bmi}
                    onChange={handleChange}
                    readOnly
                    className="readonly"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Clinical Notes</label>
              <textarea
                name="notes"
                placeholder="Additional clinical observations..."
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading} 
                className="primary-button"
              >
                {loading ? '➕ Adding...' : '➕ Add Medical Record'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="medical-records-list">
        <div className="section-header">
          <h2>Medical History</h2>
          <span className="record-count">({medicalRecords.length} records)</span>
        </div>
        
        {medicalRecords.length > 0 ? (
          <div className="records-grid">
            {medicalRecords.map(record => (
              <div key={record.id} className="medical-record-card card">
                <div className="record-header">
                  <h3>Visit on {new Date(record.visitDate).toLocaleDateString()}</h3>
                  <span className="record-id">Record #{record.id}</span>
                </div>
                
                <div className="record-content">
                  <div className="record-section">
                    <strong>🩺 Symptoms:</strong>
                    <div className="symptoms-list">
                      {record.symptoms.map((symptom, index) => (
                        <span key={index} className="symptom-tag">{symptom}</span>
                      ))}
                    </div>
                  </div>

                  {record.diagnosis && (
                    <div className="record-section">
                      <strong>📋 Diagnosis:</strong> 
                      <span className="diagnosis-text">{record.diagnosis}</span>
                    </div>
                  )}

                  {record.treatment && (
                    <div className="record-section">
                      <strong>💊 Treatment:</strong> 
                      <span className="treatment-text">{record.treatment}</span>
                    </div>
                  )}

                  {record.medications.length > 0 && (
                    <div className="record-section">
                      <strong>💊 Medications:</strong>
                      <div className="medications-list">
                        {record.medications.map((med, index) => (
                          <span key={index} className="medication-tag">{med}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.values(record.vitals).some(v => v && v !== '') && (
                    <div className="record-section">
                      <strong>📊 Vitals:</strong>
                      <div className="vitals-grid">
                        {record.vitals.bloodPressure && (
                          <div className="vital-item">
                            <span className="vital-label">BP:</span>
                            <span className="vital-value">{record.vitals.bloodPressure}</span>
                          </div>
                        )}
                        {record.vitals.temperature && (
                          <div className="vital-item">
                            <span className="vital-label">Temp:</span>
                            <span className="vital-value">{record.vitals.temperature}°C</span>
                          </div>
                        )}
                        {record.vitals.heartRate && (
                          <div className="vital-item">
                            <span className="vital-label">HR:</span>
                            <span className="vital-value">{record.vitals.heartRate} bpm</span>
                          </div>
                        )}
                        {record.vitals.respiratoryRate && (
                          <div className="vital-item">
                            <span className="vital-label">RR:</span>
                            <span className="vital-value">{record.vitals.respiratoryRate}</span>
                          </div>
                        )}
                        {record.vitals.oxygenSaturation && (
                          <div className="vital-item">
                            <span className="vital-label">O2 Sat:</span>
                            <span className="vital-value">{record.vitals.oxygenSaturation}%</span>
                          </div>
                        )}
                        {record.vitals.height && (
                          <div className="vital-item">
                            <span className="vital-label">Height:</span>
                            <span className="vital-value">{record.vitals.height} cm</span>
                          </div>
                        )}
                        {record.vitals.weight && (
                          <div className="vital-item">
                            <span className="vital-label">Weight:</span>
                            <span className="vital-value">{record.vitals.weight} kg</span>
                          </div>
                        )}
                        {record.vitals.bmi && (
                          <div className="vital-item">
                            <span className="vital-label">BMI:</span>
                            <span className="vital-value">{record.vitals.bmi}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="record-section">
                      <strong>📝 Clinical Notes:</strong> 
                      <p className="notes-text">{record.notes}</p>
                    </div>
                  )}

                  {record.followUpDate && (
                    <div className="record-section">
                      <strong>📅 Follow-up:</strong> 
                      <span className="followup-date">
                        {new Date(record.followUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="record-footer">
                  <small>
                    Added by User #{record.createdBy} on {new Date(record.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No medical records found for this patient.</p>
            <p>Click "Add Medical Record" to create the first entry.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
