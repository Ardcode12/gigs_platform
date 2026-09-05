import client from './client';

export const getRatings = (params = {}) =>
  client.get('/api/ratings', { params }).then((r) => r.data);

export const getRatingSummary = () => client.get('/api/ratings/summary').then((r) => r.data);
