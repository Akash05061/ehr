// ======================== IMPORTS ==========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

// ===================== APP INIT ============================
const app = express();
app.use(express.json());

// ===================== CORS CONFIG ============================
// Replace "YOUR_PUBLIC_IP" with your EC2 public IP
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://YOUR_PUBLIC_IP",
      "http://YOUR_PUBLIC_IP:3000",
      "*"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
    connectionLimit: 20,
  });
  console.log("📌 Connected to MySQL");
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

// =============================================================
// ======================== AUTH ROUTES ========================
// =============================================================

// LOGIN (PLAINTEXT)
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );

  if (rows.length === 0)
    return res.status(401).json({ error: "Invalid credentials" });

  const user = rows[0];

  // PLAINTEXT MATCH
  if (password !== user.password)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    },
  });
});

// =============================================================
// ======================== PATIENTS ===========================
// =============================================================

app.get("/api/patients", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM patients ORDER BY id DESC");
  res.json({ patients: rows });
});

// =============================================================
// ============ MEDICAL RECORDS / PRESCRIPTIONS / APPOINTMENTS =
// =============================================================

// GET medical records
app.get("/api/patients/:id/medical-records", authenticate, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM medical_records WHERE patient_id = ? ORDER BY id DESC",
    [req.params.id]
  );
  res.json({ records: rows });
});

// Add medical record
app.post("/api/patients/:id/medical-records", authenticate, async (req, res) => {
  const {
    visit_date,
    symptoms,
    diagnosis,
    treatment,
    medications,
    vitals,
    notes,
    follow_up_date
  } = req.body;

  await pool.query(
    `INSERT INTO medical_records (
        patient_id, visit_date, symptoms, diagnosis, treatment, medications, vitals, notes, follow_up_date, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.id,
      visit_date,
      JSON.stringify(symptoms),
      diagnosis,
      treatment,
      JSON.stringify(medications),
      JSON.stringify(vitals),
      notes,
      follow_up_date,
      req.user.id
    ]
  );

  res.json({ success: true, message: "Record added" });
});

// Appointments
app.get("/api/appointments", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM appointments");
  res.json({ appointments: rows });
});

// Create appointment
app.post("/api/appointments", authenticate, async (req, res) => {
  const { patient_id, doctor_id, appointment_date, reason } = req.body;

  await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
     VALUES (?, ?, ?, ?, 'scheduled')`,
    [patient_id, doctor_id, appointment_date, reason]
  );

  res.json({ success: true, message: "Appointment created" });
});

// Prescriptions
app.get("/api/prescriptions", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM prescriptions");
  res.json({ prescriptions: rows });
});

app.post("/api/prescriptions", authenticate, async (req, res) => {
  const { patient_id, medication_name, dosage, instructions } = req.body;

  await pool.query(
    `INSERT INTO prescriptions (patient_id, medication_name, dosage, instructions)
     VALUES (?, ?, ?, ?)`,
    [patient_id, medication_name, dosage, instructions]
  );

  res.json({ success: true, message: "Prescription added" });
});

// =============================================================
// ========================== START SERVER =======================
// =============================================================

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});
