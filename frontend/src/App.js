import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import PatientManagement from "./components/PatientManagement";
import AppointmentManagement from "./components/AppointmentManagement";
import PrescriptionManagement from "./components/PrescriptionManagement";
import PatientProfile from "./components/PatientProfile";
import MedicalRecords from "./components/MedicalRecords";

import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* -------- PUBLIC ROUTES -------- */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* -------- PROTECTED LAYOUT -------- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Patients */}
            <Route path="patients" element={<PatientManagement />} />
            <Route path="patients/:id" element={<PatientProfile />} />
            <Route path="patients/:id/records" element={<MedicalRecords />} />

            {/* Appointments */}
            <Route path="appointments" element={<AppointmentManagement />} />

            {/* Prescriptions */}
            <Route path="prescriptions" element={<PrescriptionManagement />} />

          </Route>

          {/* -------- CATCH ALL ROUTE -------- */}
          <Route path="*" element={<Navigate to="/dashboard" />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}
