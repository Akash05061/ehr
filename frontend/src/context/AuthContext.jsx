// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { authAPI } from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userData")) || null
  );
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // ------------ VERIFY TOKEN ON REFRESH ------------
  useEffect(() => {
    if (token) verifyUser();
    else setLoading(false);
  }, [token]);

  const verifyUser = async () => {
    try {
      const res = await authAPI.me();
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("userData", JSON.stringify(res.data.user));
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ------------ LOGIN ------------
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });

      if (!response.data.success) {
        toast.error("Login failed!");
        return { success: false };
      }

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success("Login successful!");
      return { success: true };

    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
      return { success: false };
    }
  };

  // ------------ REGISTER ------------
  const register = async (formData) => {
    try {
      const response = await authAPI.register(formData);

      if (!response.data.success)
        return { success: false, error: response.data.error };

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userData", JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success("Account created!");
      return { success: true };

    } catch (error) {
      const msg = error.response?.data?.error || "Registration failed";
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // ------------ LOGOUT ------------
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
    toast.info("Logged out");
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
