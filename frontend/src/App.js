import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import PatientManagement from "./components/PatientManagement";
import AppointmentManagement from "./components/AppointmentManagement";
import PrescriptionManagement from "./components/PrescriptionManagement";
import PatientProfile from "./components/PatientProfile";
import MedicalRecords from "./components/MedicalRecords";
import Admin from "./components/Admin";

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
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected */}
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
            <Route path="patients" element={<PatientManagement />} />
            <Route path="patients/:id" element={<PatientProfile />} />
            <Route path="patients/:id/records" element={<MedicalRecords />} />
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="prescriptions" element={<PrescriptionManagement />} />
            <Route path="admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
