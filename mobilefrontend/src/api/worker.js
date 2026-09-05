import client from './client';

export const getProfile = () => client.get('/api/worker/me').then((r) => r.data);

export const updateProfile = (patch) =>
  client.patch('/api/worker/me', patch).then((r) => r.data);

export const setAvailability = (isAvailable) =>
  client.put('/api/worker/availability', { is_available: isAvailable }).then((r) => r.data);

export const updateLocation = (lat, lng) =>
  client.put('/api/worker/location', { lat, lng }).then((r) => r.data);
