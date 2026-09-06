import { api } from '../api/client.js';

// ── AUTH ────────────────────────────────────────────────
export const authAPI = {
  societyLogin:     (data) => api.post('/auth/society/login', data),
  workerLogin:      (data) => api.post('/auth/worker/login', data),
  customerRegister: (data) => api.post('/auth/customer/register', data),
  customerLogin:    (data) => api.post('/auth/customer/login', data),
  logout:           ()     => api.post('/auth/logout'),
  getMe:            ()     => api.get('/auth/me'),
};

// ── SOCIETY — DASHBOARD ─────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/society/dashboard'),
  getSettings: () => api.get('/society/settings'),
  updateSettings: (data) => api.put('/society/settings', data),
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
  enroll:         (workerId, schemeId) => api.post('/society/welfare/enroll', { workerId, schemeId }),
  requestAdvance: (data) => api.post('/society/welfare/advances', data),
  getAdvances:    () => api.get('/society/welfare/advances'),
  approveAdvance: (id) => api.patch(`/society/welfare/advances/${id}/approve`),
  rejectAdvance: (id, data) => api.patch(`/society/welfare/advances/${id}/reject`, data),
};

// ── SOCIETY — COMPLAINTS ────────────────────────────────
export const complaintsAPI = {
  list:   (params) => api.get('/society/complaints', { params }),
  get:    (id)     => api.get(`/society/complaints/${id}`),
  create: (data)   => api.post('/society/complaints', data),
  respond:(id, data) => api.post(`/society/complaints/${id}/respond`, data),
  resolve:(id, data) => api.patch(`/society/complaints/${id}/resolve`, data),
  escalate:(id, data) => api.patch(`/society/complaints/${id}/escalate`, data),
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
