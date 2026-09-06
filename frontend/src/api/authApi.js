import { api } from './client.js';

export const authApi = {
  login: (email, password) =>
    api
      .post('/auth/society/login', { societyCode: email, password })
      .then((r) => ({
        user: r.data.society,
        session: {
          accessToken: r.data.access_token,
          refreshToken: r.data.refresh_token,
        },
      })),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  me: () => api.get('/authority/me').then((r) => r.data.authority),

  loginHistory: () => api.get('/auth/login-history').then((r) => r.data.data.history),

  forgotPassword: (email) => api.post('/auth/forgot-password', { identifier: email }).then((r) => r.data),

  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),

  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
};
