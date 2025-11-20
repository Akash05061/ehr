import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://13.127.5.209:3001/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request Headers:', config.headers);
    console.log('📤 Request Data:', config.data);
    
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header');
    } else {
      console.log('⚠️ No token found for request');
    }
    
    return config;
  },
  (error) => {
    console.log('❌ API Request Interceptor Error:', error);
    console.log('🔍 Request Error Details:', {
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.status, response.config.url);
    console.log('📥 Response Data:', response.data);
    console.log('📋 Response Headers:', response.headers);
    return response;
  },
  (error) => {
    console.log('❌ API Response Error:');
    console.log('🔍 Error URL:', error.config?.url);
    console.log('🔍 Error Method:', error.config?.method?.toUpperCase());
    console.log('🔍 Status Code:', error.response?.status);
    console.log('🔍 Error Message:', error.message);
    console.log('🔍 Response Data:', error.response?.data);
    console.log('🔍 Response Headers:', error.response?.headers);
    
    // Network errors (CORS, timeout, etc.)
    if (!error.response) {
      console.log('🌐 Network Error - No response received');
      console.log('Possible CORS issue or server unreachable');
    }
    
    if (error.response?.status === 401) {
      console.log('🔐 401 Unauthorized - Removing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 Login API call with credentials:', credentials);
    return api.post('/auth/login', credentials);
  },
  register: (userData) => api.post('/auth/register', userData),
};

// Patients API
export const patientsAPI = {
  getAll: (params = {}) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (patientData) => api.post('/patients', patientData),
  update: (id, patientData) => api.put(`/patients/${id}`, patientData),
  search: (searchTerm) => api.get('/patients', { params: { search: searchTerm } }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params = {}) => api.get('/appointments', { params }),
  create: (appointmentData) => api.post('/appointments', appointmentData),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
};

// Prescriptions API
export const prescriptionsAPI = {
  create: (prescriptionData) => api.post('/prescriptions', prescriptionData),
  getByPatient: (patientId) => api.get(`/patients/${patientId}/prescriptions`),
};

// Lab Results API
export const labResultsAPI = {
  create: (labData) => api.post('/lab-results', labData),
};

// Files API
export const filesAPI = {
  upload: (patientId, fileData) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('fileType', fileData.fileType);
    formData.append('description', fileData.description);
    
    return api.post(`/patients/${patientId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getByPatient: (patientId) => api.get(`/patients/${patientId}/files`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
};

export default api;
