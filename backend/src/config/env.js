import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Copy backend/.env.example to backend/.env and fill it in.'
    );
  }
  return value;
}

function number(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}".`);
  }
  return parsed;
}

export const env = {
  port: number('PORT', 5000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',

  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  supabase: {
    url: required('SUPABASE_URL'),
    publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
    secretKey: required('SUPABASE_SECRET_KEY'),
  },

  auth: {
    sessionTimeoutMinutes: number('SESSION_TIMEOUT_MINUTES', 30),
    maxFailedLoginAttempts: number('MAX_FAILED_LOGIN_ATTEMPTS', 5),
    accountLockMinutes: number('ACCOUNT_LOCK_MINUTES', 15),
    passwordResetRedirectUrl:
      process.env.PASSWORD_RESET_REDIRECT_URL ?? 'http://localhost:5173/reset-password',
  },
};
