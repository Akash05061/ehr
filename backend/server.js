// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./config/db");
const s3Service = require("./s3-service");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// -----------------------------
// CORS
// -----------------------------
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://13.233.194.42:3000",
    "http://35.154.95.223:3000",
  ],
  credentials: true,
}));

app.use(express.json());

// -----------------------------
// FILE UPLOAD SETUP
// -----------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// -----------------------------
// AUTH HELPERS
// -----------------------------
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const allowRoles = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Permission denied" });
  }
  next();
};

// -----------------------------
// AUTH ROUTES
// -----------------------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -----------------------------
// PATIENT ROUTES
// -----------------------------
app.get("/api/patients", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients ORDER BY id DESC");
    res.json({ patients: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load patients" });
  }
});

app.post("/api/patients", authenticate, allowRoles(["admin", "doctor", "receptionist"]), async (req, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, gender,
      phone, email, bloodType,
    } = req.body;

    await pool.query(
      `INSERT INTO patients 
      (firstName, lastName, dateOfBirth, gender, phone, email, bloodType, createdBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName, lastName, dateOfBirth, gender,
        phone, email, bloodType, req.user.id,
      ]
    );

    res.json({ message: "Patient added successfully" });
  } catch (err) {
    console.error("Add patient error:", err);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

app.get("/api/patients/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM patients WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Patient not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Fetch patient error:", err);
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", db: "Connected", version: "2.0.0" });
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 EHR Backend (RDS) running at http://0.0.0.0:${PORT}`);
});
