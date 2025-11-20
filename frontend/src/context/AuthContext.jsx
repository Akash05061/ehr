// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token on app start
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      // You might want to add a token verification endpoint
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
  try {
    console.log('🔴 AuthContext: Starting login for user:', username);
    console.log('🟡 AuthContext: Calling authAPI.login...');
    
    const response = await authAPI.login({ username, password });
    
    console.log('🟢 AuthContext: API response received:', response);
    console.log('🟢 AuthContext: Response data:', response.data);

    if (response.data.token) {
      const { token, user } = response.data;
      console.log('✅ AuthContext: Login successful, token received');

      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success('Login successful!');
      return { success: true };
    } else {
      console.log('❌ AuthContext: No token in response');
      return { success: false, error: 'No token received' };
    }
  } catch (error) {
    console.log('❌ AuthContext: Login error:', error);
    console.log('❌ AuthContext: Error details:', error.message);
    console.log('❌ AuthContext: Error response:', error.response);
    
    const message = error.response?.data?.error || 'Login failed';
    toast.error(message);
    return { success: false, error: message };
  }
};

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.token) {
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        
        toast.success('Registration successful!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
