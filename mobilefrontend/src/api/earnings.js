import client from './client';

export const getSummary = (period = 'today') =>
  client.get('/api/earnings/summary', { params: { period } }).then((r) => r.data);

/** All three periods in one round trip — the screen switches tabs client-side. */
export const getOverview = () => client.get('/api/earnings/overview').then((r) => r.data);

export const getPayments = (params = {}) =>
  client.get('/api/payments', { params }).then((r) => r.data);
