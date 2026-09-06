import client from './client';

export const getMessages = (jobId, lang) =>
  client
    .get(`/api/jobs/${jobId}/messages`, { params: lang ? { lang } : undefined })
    .then((r) => r.data);

export const sendMessage = (jobId, text) =>
  client.post(`/api/jobs/${jobId}/messages`, { text }).then((r) => r.data);

/** Asks the customer to call. No number is exchanged in either direction. */
export const requestCall = (jobId, note) =>
  client.post(`/api/jobs/${jobId}/call-request`, { note: note || null }).then((r) => r.data);

export const getCallRequests = (jobId) =>
  client.get(`/api/jobs/${jobId}/call-requests`).then((r) => r.data);

export const getCustomerMessages = (jobId) =>
  client.get(`/api/customer/chat/${jobId}`).then((r) => r.data);

export const sendCustomerMessage = (jobId, text) =>
  client.post(`/api/customer/chat/${jobId}`, { text }).then((r) => r.data);
