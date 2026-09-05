import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

// Auto-attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── AUTH ────────────────────────────────────────────────
export const authAPI = {
  societyLogin:     (data) => api.post('/auth/society/login', data),
  workerLogin:      (data) => api.post('/auth/worker/login', data),
  customerRegister: (data) => api.post('/auth/customer/register', data),
  customerLogin:    (data) => api.post('/auth/customer/login', data),
  logout:           ()     => api.post('/auth/logout'),
};

// ── SOCIETY — DASHBOARD ─────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/society/dashboard'),
};

// ── SOCIETY — WORKERS ───────────────────────────────────
export const workersAPI = {
  list:        (params) => api.get('/society/workers', { params }),
  get:         (id)     => api.get(`/society/workers/${id}`),
  register:    (data)   => api.post('/society/workers/register', data),
  submitRefs:  (id, data) => api.post(`/society/workers/${id}/kyc/refs`, data),
  approveKyc:  (id)     => api.patch(`/society/workers/${id}/kyc/approve`),
  rejectKyc:   (id, data) => api.patch(`/society/workers/${id}/kyc/reject`, data),
};

// ── SOCIETY — BOOKINGS ──────────────────────────────────
export const bookingsAPI = {
  list:        (params) => api.get('/society/bookings', { params }),
  getIncoming: ()       => api.get('/society/bookings/incoming'),
  get:         (id)     => api.get(`/society/bookings/${id}`),
  assign:      (id, data) => api.post(`/society/bookings/${id}/assign`, data),
  assignBulk:  (id, data) => api.post(`/society/bookings/${id}/assign-bulk`, data),
  updateStatus:(id, data) => api.patch(`/society/bookings/${id}/status`, data),
};

// ── SOCIETY — PAYMENTS ──────────────────────────────────
export const paymentsAPI = {
  list:        (params) => api.get('/society/payments', { params }),
  get:         (id)     => api.get(`/society/payments/${id}`),
  record:      (data)   => api.post('/society/payments', data),
  updateStatus:(id, data) => api.patch(`/society/payments/${id}/status`, data),
};

// ── SOCIETY — RATES ─────────────────────────────────────
export const ratesAPI = {
  list:   () => api.get('/society/rates'),
  update: (category, data) => api.put(`/society/rates/${category}`, data),
};

// ── SOCIETY — WELFARE ───────────────────────────────────
export const welfareAPI = {
  list:           () => api.get('/society/welfare'),
  getAdvances:    () => api.get('/society/welfare/advances'),
  approveAdvance: (id) => api.patch(`/society/welfare/advances/${id}/approve`),
};

// ── SOCIETY — COMPLAINTS ────────────────────────────────
export const complaintsAPI = {
  list:   (params) => api.get('/society/complaints', { params }),
  get:    (id)     => api.get(`/society/complaints/${id}`),
  create: (data)   => api.post('/society/complaints', data),
  respond:(id, data) => api.post(`/society/complaints/${id}/respond`, data),
  resolve:(id, data) => api.patch(`/society/complaints/${id}/resolve`, data),
};

// ── WORKER PORTAL ───────────────────────────────────────
export const workerAPI = {
  getDashboard:     ()       => api.get('/worker/dashboard'),
  acceptJob:        (jobId)  => api.patch(`/worker/jobs/${jobId}/accept`),
  rejectJob:        (jobId, data) => api.patch(`/worker/jobs/${jobId}/reject`, data),
  updateJobStatus:  (jobId, data) => api.patch(`/worker/jobs/${jobId}/status`, data),
  toggleAvailability: (data) => api.patch('/worker/availability', data),
  changePassword:   (data)   => api.post('/worker/change-password', data),
};

// ── GPS / CUSTOMER SERVICE ──────────────────────────────
export const gpsAPI = {
  findNearestSociety: (data)     => api.post('/gps/nearest-society', data),
  findNearestWorker:  (data)     => api.post('/gps/nearest-worker', data),
  requestService:     (data)     => api.post('/gps/request', data),
  getSubcategories:   (category) => api.get(`/gps/subcategories/${category || 'all'}`),
};

export default api;
