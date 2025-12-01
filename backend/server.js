// ======================== IMPORTS ==========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const s3Service = require("./s3-service");

// ===================== APP INIT ============================
const app = express();
app.use(express.json());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// ===================== MYSQL CONNECTION =====================
let pool;

(async () => {
  pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 20
  });

  console.log("📌 Connected to MySQL (RDS)");
})();

// ======================== AUTH MIDDLEWARE ======================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const allowRoles = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Permission denied" });
  next();
};

// ======================== FILE UPLOAD ========================
const upload = multer({ storage: multer.memoryStorage() });

// =============================================================
// ======================== AUTH ROUTES ========================
// =============================================================

// REGISTER USER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, role } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (username, password, firstName, lastName, email, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashed, firstName, lastName, email, role || "staff"]
    );

    res.json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN USER
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// =============================================================
// ======================== PATIENTS CRUD =======================
// =============================================================

// GET ALL PATIENTS
app.get("/api/patients", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients ORDER BY id DESC");
    res.json({ patients: rows });
  } catch {
    res.status(500).json({ error: "Failed to load patients" });
  }
});

// GET SINGLE PATIENT
app.get("/api/patients/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Failed to load patient" });
  }
});

// CREATE PATIENT
app.post("/api/patients", authenticate, allowRoles(["admin", "doctor", "receptionist"]), async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, bloodType } = req.body;

    await pool.query(
      `INSERT INTO patients (firstName, lastName, dateOfBirth, gender, phone, email, bloodType, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, dateOfBirth, gender, phone, email, bloodType, req.user.id]
    );

    res.json({ message: "Patient added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create patient" });
  }
});

// UPDATE PATIENT
app.put("/api/patients/:id", authenticate, allowRoles(["admin", "doctor"]), async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;

    await pool.query(
      `UPDATE patients SET firstName=?, lastName=?, phone=?, email=? WHERE id=?`,
      [firstName, lastName, phone, email, req.params.id]
    );

    res.json({ message: "Patient updated" });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

// =============================================================
// ====================== MEDICAL RECORDS =======================
// =============================================================

app.get("/api/patients/:id/records", authenticate, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM medicalRecords WHERE patientId = ? ORDER BY id DESC",
    [req.params.id]
  );
  res.json({ medicalRecords: rows });
});

app.post("/api/patients/:id/records", authenticate, allowRoles(["admin", "doctor"]), async (req, res) => {
  const { visitDate, symptoms, diagnosis, treatment, vitals } = req.body;

  await pool.query(
    `INSERT INTO medicalRecords (patientId, visitDate, symptoms, diagnosis, treatment, vitals, createdBy)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.params.id, visitDate, JSON.stringify(symptoms), diagnosis, treatment, JSON.stringify(vitals), req.user.id]
  );

  res.json({ message: "Record added" });
});

// =============================================================
// ======================== APPOINTMENTS ========================
// =============================================================

app.get("/api/appointments", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM appointments ORDER BY appointmentDate ASC");
  res.json({ appointments: rows });
});

app.post("/api/appointments", authenticate, async (req, res) => {
  const { patientId, doctorId, appointmentDate, reason } = req.body;

  await pool.query(
    `INSERT INTO appointments (patientId, doctorId, appointmentDate, reason, status, createdBy)
     VALUES (?, ?, ?, ?, 'scheduled', ?)`,
    [patientId, doctorId, appointmentDate, reason, req.user.id]
  );

  res.json({ message: "Appointment created" });
});

// =============================================================
// ======================= PRESCRIPTIONS ========================
// =============================================================

app.post("/api/prescriptions", authenticate, allowRoles(["admin", "doctor"]), async (req, res) => {
  const { patientId, medicationName, dosage, instructions } = req.body;

  await pool.query(
    `INSERT INTO prescriptions (patientId, medicationName, dosage, instructions, prescribedBy)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, medicationName, dosage, instructions, req.user.id]
  );

  res.json({ message: "Prescription added" });
});

// =============================================================
// ========================= LAB RESULTS ========================
// =============================================================

app.post("/api/lab-results", authenticate, async (req, res) => {
  const { patientId, testName, result, units } = req.body;

  await pool.query(
    `INSERT INTO labResults (patientId, testName, result, units, createdBy)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, testName, result, units, req.user.id]
  );

  res.json({ message: "Lab result saved" });
});

// =============================================================
// ========================= FILE UPLOAD ========================
// =============================================================

app.post("/api/patients/:id/files", authenticate, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "File missing" });

  const upload = await s3Service.uploadFile(req.params.id, file);
  if (!upload.success) return res.status(500).json(upload);

  await pool.query(
    `INSERT INTO medicalFiles (patientId, fileName, fileType, s3Key, s3Url, uploadedBy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.params.id, file.originalname, file.mimetype, upload.key, upload.url, req.user.id]
  );

  res.json({ message: "File uploaded", url: upload.url });
});

// =============================================================
// =========================== ANALYTICS ========================
// =============================================================

app.get("/api/analytics/overview", authenticate, allowRoles(["admin"]), async (req, res) => {
  const [[patients]] = await pool.query("SELECT COUNT(*) AS total FROM patients");
  const [[appointments]] = await pool.query("SELECT COUNT(*) AS total FROM appointments");
  const [[records]] = await pool.query("SELECT COUNT(*) AS total FROM medicalRecords");

  res.json({
    totalPatients: patients.total,
    totalAppointments: appointments.total,
    totalRecords: records.total
  });
});

// =============================================================
// ========================== START SERVER =======================
// =============================================================

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});
