import client from './client';

export const reportCustomer = (jobId, category, description) =>
  client.post(`/api/jobs/${jobId}/reports`, { category, description }).then((r) => r.data);
