// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // VERIFY TOKEN ON PAGE REFRESH
  // -----------------------------
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // LOGIN FUNCTION
  // -----------------------------
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });

      if (!response?.data?.token) {
        toast.error("Login failed: No token received");
        return { success: false };
      }

      const { token, user } = response.data;

      // Save to local storage
      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(user));

      // Update state
      setToken(token);
      setUser(user);

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // -----------------------------
  // REGISTER FUNCTION
  // -----------------------------
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      if (response?.data?.token) {
        const { token, user } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        setToken(token);
        setUser(user);

        toast.success("Registration successful!");
        return { success: true };
      }
      return { success: false, error: "Registration failed" };
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // -----------------------------
  // LOGOUT FUNCTION
  // -----------------------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");

    // 🔥 Auto-redirect
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
