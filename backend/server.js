// ======================== IMPORTS ==========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

// ===================== APP INIT ============================
const app = express();
app.use(express.json());

// ===================== CORS CONFIG =========================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      `http://${process.env.EC2_IP}:3000`,
      `http://${process.env.EC2_IP}`,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

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

// =============================================================
// ======================== AUTH ROUTES ========================
// =============================================================

// LOGIN USER (NO BCRYPT — PLAINTEXT PASSWORD)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    // Plaintext password match
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
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
  } catch (error) {
    res.status(500).json({ error: "Failed to load patients" });
  }
});

// GET PATIENT BY ID
app.get("/api/patients/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ patient: rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to load patient" });
  }
});

// CREATE PATIENT
app.post("/api/patients", authenticate, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      gender,
      phone,
      email,
      city,
      blood_type,
      medical_history,
    } = req.body;

    await pool.query(
      `INSERT INTO patients (first_name, last_name, dob, gender, phone, email, city, blood_type, medical_history)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        dob,
        gender,
        phone,
        email,
        city,
        blood_type,
        JSON.stringify(medical_history || []),
      ]
    );

    res.json({ success: true, message: "Patient created" });
  } catch (err) {
    res.status(500).json({ error: "Create patient failed" });
  }
});

// =============================================================
// ====================== MEDICAL RECORDS =======================
// =============================================================
app.get("/api/patients/:id/records", authenticate, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM medical_records WHERE patient_id = ? ORDER BY id DESC",
    [req.params.id]
  );
  res.json({ records: rows });
});

// =============================================================
// ======================== APPOINTMENTS ========================
// =============================================================
app.get("/api/appointments", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM appointments");
  res.json({ appointments: rows });
});

// =============================================================
// ======================= PRESCRIPTIONS ========================
// =============================================================
app.get("/api/prescriptions", authenticate, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM prescriptions");
  res.json({ prescriptions: rows });
});

// =============================================================
// ========================== START SERVER =======================
// =============================================================
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`)
);
