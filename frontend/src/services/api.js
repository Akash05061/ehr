import axios from "axios";

// ===========================
// CONFIGURE BACKEND URL
// ===========================
export const API_BASE_URL = "http://13.201.55.18:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// ===========================
// REQUEST INTERCEPTOR
// ===========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("➡️ API REQUEST:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// ===========================
// RESPONSE INTERCEPTOR
// ===========================
api.interceptors.response.use(
  (response) => {
    console.log("✅ API RESPONSE:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API ERROR:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Auto-logout when token expires
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ===========================
// AUTH API
// ===========================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),   // ✅ REQUIRED (MISSING EARLIER)
};

// ===========================
// PATIENT API
// ===========================
export const patientsAPI = {
  getAll: (params = {}) => api.get("/patients", { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post("/patients", data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  search: (term) => api.get("/patients", { params: { search: term } }),
};

// ===========================
// APPOINTMENTS API
// ===========================
export const appointmentsAPI = {
  getAll: (params = {}) => api.get("/appointments", { params }),
  create: (data) => api.post("/appointments", data),
  updateStatus: (id, status) =>
    api.put(`/appointments/${id}/status`, { status }),
};

// ===========================
// PRESCRIPTIONS API
// ===========================
export const prescriptionsAPI = {
  create: (data) => api.post("/prescriptions", data),
  getByPatient: (patientId) =>
    api.get(`/patients/${patientId}/prescriptions`),
};

// ===========================
// LAB RESULTS API
// ===========================
export const labResultsAPI = {
  create: (data) => api.post("/lab-results", data),
};

// ===========================
// FILE UPLOAD API
// ===========================
export const filesAPI = {
  upload: (patientId, fileData) => {
    const formData = new FormData();
    formData.append("file", fileData.file);
    formData.append("fileType", fileData.fileType);
    formData.append("description", fileData.description);

    return api.post(`/patients/${patientId}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getByPatient: (patientId) => api.get(`/patients/${patientId}/files`),
};

// ===========================
// ANALYTICS API
// ===========================
export const analyticsAPI = {
  getOverview: () => api.get("/analytics/overview"),
};

export default api;
