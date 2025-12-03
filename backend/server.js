// ======================== IMPORTS ==========================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ===================== APP INIT ============================
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "*"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dummysecret123";

// ===================== DUMMY USER (SQL-Like) ==========================
const dummyUser = {
  id: 1,
  username: "admin",
  email: "admin@example.com",
  role: "admin",
  password: bcrypt.hashSync("Admin@123", 10),
};

// ===================== DUMMY PATIENTS (SQL FORMAT) ====================
let dummyPatients = [
  {
    id: 1,
    first_name: "Arjun",
    last_name: "Sharma",
    dob: "1990-05-12",
    gender: "Male",
    phone: "9876543210",
    email: "arjun@example.com",
    city: "Bangalore",
    blood_type: "A+",
    medical_history: ["diabetes"],
    appointments: [],
    prescriptions: [],
    medicalRecords: []
  },
  {
    id: 2,
    first_name: "Meera",
    last_name: "Rao",
    dob: "1985-09-23",
    gender: "Female",
    phone: "9988776655",
    email: "meera@example.com",
    city: "Chennai",
    blood_type: "O-",
    medical_history: [],
    appointments: [],
    prescriptions: [],
    medicalRecords: []
  },
  {
    id: 3,
    first_name: "Rahul",
    last_name: "Verma",
    dob: "2000-12-01",
    gender: "Male",
    phone: "9123456780",
    email: "rahul@example.com",
    city: "Hyderabad",
    blood_type: "B+",
    medical_history: ["asthma"],
    appointments: [],
    prescriptions: [],
    medicalRecords: []
  },
  {
    id: 4,
    first_name: "Sneha",
    last_name: "Patil",
    dob: "1995-03-15",
    gender: "Female",
    phone: "9001122334",
    email: "sneha@example.com",
    city: "Mumbai",
    blood_type: "AB+",
    medical_history: [],
    appointments: [],
    prescriptions: [],
    medicalRecords: []
  },
  {
    id: 5,
    first_name: "Vikram",
    last_name: "Shetty",
    dob: "1988-07-27",
    gender: "Male",
    phone: "9876001234",
    email: "vikram@example.com",
    city: "Delhi",
    blood_type: "O+",
    medical_history: ["hypertension"],
    appointments: [],
    prescriptions: [],
    medicalRecords: []
  },
];

// ======================== AUTH MIDDLEWARE ======================
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.user = user;
    next();
  });
}

// =============================================================
// ======================== AUTH ROUTES ========================
// =============================================================

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== dummyUser.username)
    return res.status(401).json({ error: "Invalid user" });

  const valid = bcrypt.compareSync(password, dummyUser.password);
  if (!valid) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign(
    { id: dummyUser.id, role: dummyUser.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    token,
    user: {
      id: dummyUser.id,
      username: dummyUser.username,
      email: dummyUser.email,
      role: dummyUser.role,
    },
  });
});

// =============================================================
// ======================== PATIENT ROUTES ======================
// =============================================================

// GET ALL PATIENTS (Supports Search)
app.get("/api/patients", auth, (req, res) => {
  const search = req.query.search?.toLowerCase() || "";

  const filtered = dummyPatients.filter((p) =>
    p.first_name.toLowerCase().includes(search) ||
    p.last_name.toLowerCase().includes(search) ||
    p.phone.includes(search) ||
    p.email.toLowerCase().includes(search)
  );

  res.json({ success: true, patients: filtered });
});

// GET PATIENT BY ID
app.get("/api/patients/:id", auth, (req, res) => {
  const id = Number(req.params.id);

  const patient = dummyPatients.find((p) => p.id === id);

  if (!patient) return res.json({ success: false });

  res.json({
    success: true,
    patient,
  });
});

// CREATE PATIENT (Stored in memory)
app.post("/api/patients", auth, (req, res) => {
  const newId = dummyPatients.length + 1;

  const newPatient = {
    id: newId,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    dob: req.body.dob,
    gender: req.body.gender,
    phone: req.body.phone,
    email: req.body.email,
    city: req.body.city,
    blood_type: req.body.blood_type,
    medical_history: req.body.medical_history || [],
    appointments: [],
    prescriptions: [],
    medicalRecords: [],
  };

  dummyPatients.push(newPatient);

  res.json({ success: true, patient: newPatient });
});

// =============================================================
// ========================== START SERVER =======================
// =============================================================
app.listen(PORT, () =>
  console.log(`🚀 Backend running at http://0.0.0.0:${PORT}`)
);
