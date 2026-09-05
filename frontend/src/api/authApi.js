import { api } from './client.js';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data.data.user),

  loginHistory: () => api.get('/auth/login-history').then((r) => r.data.data.history),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),

  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
};
