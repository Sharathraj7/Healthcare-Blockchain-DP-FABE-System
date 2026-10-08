/**
 * Axios API Service
 * Centralized HTTP client configuration
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  registerPatient: (data) => api.post('/auth/patient/register', data),
  loginPatient: (data) => api.post('/auth/patient/login', data),
  loginDoctor: (data) => api.post('/auth/doctor/login', data),
};

// Patient API
export const patientAPI = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data) => api.put('/patient/profile', data),
  createRecord: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'medicalReport' && data[key]) {
        formData.append('medicalReport', data[key]);
      } else if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/patient/records', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getRecords: () => api.get('/patient/records'),
  getRecord: (id) => api.get(`/patient/records/${id}`),
};

// Doctor API
export const doctorAPI = {
  getDashboard: () => api.get('/doctor/dashboard'),
  getPatients: () => api.get('/doctor/patients'),
  getPatient: (id) => api.get(`/doctor/patients/${id}`),
  requestAccess: (recordId) => api.post(`/doctor/records/${recordId}/access`),
  getAuditLogs: (params) => api.get('/doctor/audit-logs', { params }),
};

// Blockchain API
export const blockchainAPI = {
  getBlocks: () => api.get('/blockchain/blocks'),
  getTransactions: () => api.get('/blockchain/transactions'),
  validate: () => api.get('/blockchain/validate'),
  getStats: () => api.get('/blockchain/stats'),
};

// Metrics API
export const metricsAPI = {
  getMetrics: () => api.get('/metrics'),
};

// IPFS API
export const ipfsAPI = {
  getMetadata: (cid) => api.get(`/ipfs/${cid}`),
};

export default api;
