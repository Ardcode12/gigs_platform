import client, { saveTokens, clearTokens, loadTokens } from './client';

export const login = async (identifier, password) => {
  const { data } = await client.post(
    '/api/auth/login',
    { identifier, password },
    { skipAuth: true },
  );
  await saveTokens(data);
  return data;
};

export const customerLogin = async (identifier, password) => {
  const { data } = await client.post(
    '/api/customer/auth/login',
    { identifier, password },
    { skipAuth: true },
  );
  await saveTokens(data);
  return data;
};

export const sendSignupOtp = ({ phone, email }) =>
  client
    .post('/api/customer/auth/send-signup-otp', { phone, email }, { skipAuth: true })
    .then((r) => r.data);

export const customerSignup = async ({ name, phone, email, password, city, otp }) => {
  const { data } = await client.post(
    '/api/customer/auth/signup',
    { name, phone, email, password, city, otp },
    { skipAuth: true },
  );
  await saveTokens(data);
  return data;
};

export const getCustomerMe = () => client.get('/api/customer/auth/me').then((r) => r.data);

export const logout = async () => {
  try {
    await client.post('/api/auth/logout');
  } catch {
    // The server-side call is a courtesy; the tokens go regardless.
  }
  await clearTokens();
};

export const getMe = () => client.get('/api/auth/me').then((r) => r.data);

export const forgotPassword = (identifier) =>
  client
    .post('/api/auth/forgot-password', { identifier }, { skipAuth: true })
    .then((r) => r.data);

export const resetPassword = (identifier, code, newPassword) =>
  client
    .post(
      '/api/auth/reset-password',
      { identifier, code, new_password: newPassword },
      { skipAuth: true },
    )
    .then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  client
    .post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    .then((r) => r.data);

export { loadTokens, clearTokens };
