import client from './client';

export const getRequests = () => client.get('/api/jobs/requests').then((r) => r.data);

export const getCurrentJob = () => client.get('/api/jobs/current').then((r) => r.data);

export const getJob = (jobId) => client.get(`/api/jobs/${jobId}`).then((r) => r.data);

export const getHistory = (params = {}) =>
  client.get('/api/jobs', { params }).then((r) => r.data);

export const acceptJob = (jobId) =>
  client.post(`/api/jobs/${jobId}/accept`).then((r) => r.data);

export const rejectJob = (jobId, reason) =>
  client.post(`/api/jobs/${jobId}/reject`, { reason: reason || null }).then((r) => r.data);

export const updateJobStatus = (jobId, status) =>
  client.post(`/api/jobs/${jobId}/status`, { status }).then((r) => r.data);

export const getExtraRequests = (jobId) =>
  client.get(`/api/jobs/${jobId}/extra-amount`).then((r) => r.data);

export const requestExtraAmount = (jobId, amount, reason) =>
  client
    .post(`/api/jobs/${jobId}/extra-amount`, { amount: Number(amount), reason })
    .then((r) => r.data);
