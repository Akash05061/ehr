// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const s3Service = require('./s3-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ehr-system-secret-key';

// Middleware - FIXED CORS CONFIGURATION
app.use(cors({
  origin: ['http://localhost:3000', 'http://13.127.5.209:3000', 'http://172.31.33.70:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug: Log CORS configuration
console.log('🌐 CORS configured for origins:', ['http://localhost:3000', 'http://13.127.5.209:3000', 'http://172.31.33.70:3000']);

// Add express.json() middleware HERE - this is crucial!
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url} from origin: ${req.headers.origin}`);
  console.log(`📋 Headers:`, req.headers);
  next();
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
      'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    allowedMimes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'), false);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// In-memory databases (replace with real database later)
let patients = [];
let users = [];
let appointments = [];
let prescriptions = [];
let labResults = [];
let medicalFiles = [];
let nextId = { patients: 1, users: 1, appointments: 1, prescriptions: 1, labResults: 1, medicalFiles: 1 };

// ==================== MEDICAL RECORDS STORAGE ====================
let medicalRecords = [];
let nextMedicalRecordId = 1;

// Initialize admin user
const initializeAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    users.push({
      id: 1,
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@ehr.com',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Admin user initialized');
  } catch (error) {
    console.error('❌ Failed to initialize admin user:', error);
  }
};

// ==================== AUTHENTICATION ENDPOINTS ====================

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, role = 'staff' } = req.body;

    // Validation
    if (!username || !password || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: nextId.users++,
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      role: ['admin', 'doctor', 'staff', 'receptionist', 'lab_technician'].includes(role) ? role : 'staff',
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== PATIENT MANAGEMENT ENDPOINTS ====================

// Get all patients (with pagination and search)
app.get('/api/patients', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let filteredPatients = patients;

    // Search functionality
    if (search) {
      filteredPatients = patients.filter(patient =>
        patient.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        patient.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        patient.phone?.includes(search) ||
        patient.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const paginatedPatients = filteredPatients.slice(skip, skip + parseInt(limit));

    res.json({
      patients: paginatedPatients,
      total: filteredPatients.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredPatients.length / limit)
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID with full medical history
app.get('/api/patients/:id', authenticateToken, (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get related data
    const patientAppointments = appointments.filter(a => a.patientId === patientId);
    const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId);
    const patientLabResults = labResults.filter(l => l.patientId === patientId);
    const patientFiles = medicalFiles.filter(f => f.patientId === patientId);
    const patientMedicalRecords = medicalRecords.filter(record => record.patientId === patientId);

    const patientWithHistory = {
      ...patient,
      appointments: patientAppointments,
      prescriptions: patientPrescriptions,
      labResults: patientLabResults,
      files: patientFiles,
      medicalRecords: patientMedicalRecords
    };

    res.json(patientWithHistory);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create patient with enhanced fields
app.post('/api/patients', authenticateToken, requireRole(['admin', 'doctor', 'receptionist']), (req, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender, phone, email,
      address, emergencyContact, bloodType, insuranceInfo, medicalHistory
    } = req.body;

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({ error: 'Required fields: firstName, lastName, dateOfBirth, gender, phone' });
    }

    const patient = {
      id: nextId.patients++,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email: email || '',
      address: address || {},
      emergencyContact: emergencyContact || {},
      bloodType: bloodType || '',
      insuranceInfo: insuranceInfo || {},
      medicalHistory: medicalHistory || [],
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    patients.push(patient);
    res.status(201).json({ message: 'Patient created successfully', patient });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
app.put('/api/patients/:id', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex === -1) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patients[patientIndex] = {
      ...patients[patientIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.userId
    };

    res.json({ message: 'Patient updated successfully', patient: patients[patientIndex] });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// ==================== MEDICAL RECORDS ENDPOINTS ====================

// Get patient medical records
app.get('/api/patients/:id/medical-records', authenticateToken, (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patientRecords = medicalRecords.filter(record => record.patientId === patientId);
    
    res.json({ medicalRecords: patientRecords });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Add medical record (vitals, symptoms, diagnosis)
app.post('/api/patients/:id/medical-records', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const {
      visitDate,
      symptoms,
      diagnosis,
      treatment,
      medications,
      vitals = {},
      notes,
      followUpDate
    } = req.body;

    // Validation
    if (!visitDate || !symptoms) {
      return res.status(400).json({ error: 'Visit date and symptoms are required' });
    }

    const medicalRecord = {
      id: nextMedicalRecordId++,
      patientId,
      visitDate,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      medications: Array.isArray(medications) ? medications : (medications ? [medications] : []),
      vitals: {
        bloodPressure: vitals.bloodPressure || '',
        temperature: vitals.temperature || '',
        heartRate: vitals.heartRate || '',
        respiratoryRate: vitals.respiratoryRate || '',
        oxygenSaturation: vitals.oxygenSaturation || '',
        height: vitals.height || '',
        weight: vitals.weight || '',
        bmi: vitals.bmi || ''
      },
      notes: notes || '',
      followUpDate: followUpDate || '',
      createdBy: req.user.userId,
      createdAt: new Date().toISOString()
    };

    medicalRecords.push(medicalRecord);
    res.status(201).json({ 
      message: 'Medical record added successfully', 
      medicalRecord 
    });
  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({ error: 'Failed to add medical record' });
  }
});

// Update medical record
app.put('/api/medical-records/:id', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const recordIndex = medicalRecords.findIndex(record => record.id === recordId);

    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    medicalRecords[recordIndex] = {
      ...medicalRecords[recordIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.userId
    };

    res.json({ 
      message: 'Medical record updated successfully', 
      medicalRecord: medicalRecords[recordIndex] 
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ error: 'Failed to update medical record' });
  }
});

// Get vitals history for a patient
app.get('/api/patients/:id/vitals', authenticateToken, (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patientRecords = medicalRecords
      .filter(record => record.patientId === patientId)
      .map(record => ({
        date: record.visitDate,
        vitals: record.vitals,
        recordId: record.id
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ vitalsHistory: patientRecords });
  } catch (error) {
    console.error('Get vitals history error:', error);
    res.status(500).json({ error: 'Failed to fetch vitals history' });
  }
});

// ==================== APPOINTMENT MANAGEMENT ENDPOINTS ====================

// Create appointment
app.post('/api/appointments', authenticateToken, requireRole(['admin', 'receptionist', 'doctor']), (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason, notes } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'patientId, doctorId, and appointmentDate are required' });
    }

    const appointment = {
      id: nextId.appointments++,
      patientId: parseInt(patientId),
      doctorId: parseInt(doctorId),
      appointmentDate,
      reason: reason || '',
      notes: notes || '',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    appointments.push(appointment);
    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get appointments with filters
app.get('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { patientId, doctorId, status, date } = req.query;

    let filteredAppointments = appointments;

    if (patientId) filteredAppointments = filteredAppointments.filter(a => a.patientId == patientId);
    if (doctorId) filteredAppointments = filteredAppointments.filter(a => a.doctorId == doctorId);
    if (status) filteredAppointments = filteredAppointments.filter(a => a.status === status);
    if (date) filteredAppointments = filteredAppointments.filter(a => a.appointmentDate.startsWith(date));

    res.json({ appointments: filteredAppointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
app.put('/api/appointments/:id/status', authenticateToken, requireRole(['admin', 'doctor', 'receptionist']), (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
    if (appointmentIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointments[appointmentIndex].status = status;
    appointments[appointmentIndex].updatedAt = new Date().toISOString();

    res.json({ message: 'Appointment status updated', appointment: appointments[appointmentIndex] });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// ==================== PRESCRIPTION MANAGEMENT ENDPOINTS ====================

// Create prescription
app.post('/api/prescriptions', authenticateToken, requireRole(['admin', 'doctor']), (req, res) => {
  try {
    const { patientId, medicationName, dosage, frequency, duration, instructions } = req.body;

    if (!patientId || !medicationName || !dosage) {
      return res.status(400).json({ error: 'patientId, medicationName, and dosage are required' });
    }

    const prescription = {
      id: nextId.prescriptions++,
      patientId: parseInt(patientId),
      medicationName,
      dosage,
      frequency: frequency || '',
      duration: duration || '',
      instructions: instructions || '',
      status: 'active',
      prescribedDate: new Date().toISOString(),
      prescribedBy: req.user.userId
    };

    prescriptions.push(prescription);
    res.status(201).json({ message: 'Prescription created successfully', prescription });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Get patient prescriptions
app.get('/api/patients/:id/prescriptions', authenticateToken, (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId);
    res.json({ prescriptions: patientPrescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// ==================== LAB RESULTS ENDPOINTS ====================

// Create lab result
app.post('/api/lab-results', authenticateToken, requireRole(['admin', 'doctor', 'lab_technician']), (req, res) => {
  try {
    const { patientId, testName, result, normalRange, units, notes } = req.body;

    if (!patientId || !testName || !result) {
      return res.status(400).json({ error: 'patientId, testName, and result are required' });
    }

    const labResult = {
      id: nextId.labResults++,
      patientId: parseInt(patientId),
      testName,
      result,
      normalRange: normalRange || '',
      units: units || '',
      notes: notes || '',
      testDate: new Date().toISOString(),
      createdBy: req.user.userId
    };

    labResults.push(labResult);
    res.status(201).json({ message: 'Lab result recorded successfully', labResult });
  } catch (error) {
    console.error('Create lab result error:', error);
    res.status(500).json({ error: 'Failed to record lab result' });
  }
});

// ==================== FILE UPLOAD ENDPOINTS ====================

// Upload medical file
app.post('/api/patients/:id/files', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const file = req.file;
    const { fileType, description } = req.body;

    // Check if patient exists
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadResult = await s3Service.uploadFile(patientId, file, fileType);

    if (!uploadResult.success) {
      return res.status(500).json({ error: 'File upload failed', details: uploadResult.error });
    }

    // Store file metadata
    const fileRecord = {
      id: nextId.medicalFiles++,
      patientId: patientId,
      fileName: file.originalname,
      fileType: fileType || 'medical',
      description: description || '',
      s3Key: uploadResult.key,
      s3Url: uploadResult.url,
      uploadedBy: req.user.userId,
      uploadDate: new Date().toISOString()
    };

    medicalFiles.push(fileRecord);

    res.json({
      message: 'File uploaded successfully',
      fileInfo: fileRecord
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Get patient files
app.get('/api/patients/:id/files', authenticateToken, (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    const patientFiles = medicalFiles.filter(f => f.patientId === patientId);
    res.json({ files: patientFiles });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get system statistics
app.get('/api/analytics/overview', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const stats = {
      totalPatients: patients.length,
      totalUsers: users.length,
      totalAppointments: appointments.length,
      upcomingAppointments: appointments.filter(a => a.status === 'scheduled').length,
      totalPrescriptions: prescriptions.length,
      totalLabResults: labResults.length,
      totalFiles: medicalFiles.length,
      recentLabResults: labResults.slice(-10).length,
      totalMedicalRecords: medicalRecords.length
    };

    res.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Advanced EHR Backend is running!',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'Authentication & Authorization',
      'Patient Management',
      'Appointment Scheduling',
      'Prescription Management',
      'Lab Results',
      'File Upload',
      'Medical Records',
      'Analytics'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize server
const startServer = async () => {
  await initializeAdmin();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Advanced EHR Backend running on http://0.0.0.0:${PORT}`);
    console.log('📋 Available Features:');
    console.log('   ✅ Authentication & Role-based Access');
    console.log('   ✅ Enhanced Patient Management');
    console.log('   ✅ Medical Records & Vitals Tracking');
    console.log('   ✅ Appointment Scheduling');
    console.log('   ✅ Prescription Management');
    console.log('   ✅ Lab Results Tracking');
    console.log('   ✅ File Upload to S3');
    console.log('   ✅ Analytics & Reporting');
    console.log(`   🔐 Admin credentials: admin / admin123`);
    console.log(`   🌐 CORS enabled for: http://localhost:3000`);
  });
};

startServer();
