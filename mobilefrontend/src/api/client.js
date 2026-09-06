/**
 * The single axios instance every api/* module uses.
 *
 * Two things happen here that nothing else has to think about:
 *   - the access token is attached to every request;
 *   - a 401 triggers one refresh attempt and one retry, with concurrent 401s
 *     queued behind that single refresh instead of each firing their own.
 *
 * IMPORTANT: Workers and customers use different refresh endpoints.
 *   Worker:   POST /api/auth/refresh           (expects role="worker" token)
 *   Customer: POST /api/customer/auth/refresh   (expects role="customer" token)
 * Using the wrong endpoint causes refresh to silently fail and log the user out.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const ACCESS_KEY = 'workmat.access_token';
const REFRESH_KEY = 'workmat.refresh_token';
const ROLE_KEY = 'workmat.role'; // mirrors AuthContext's ROLE_KEY

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Kept in memory so the common path doesn't hit AsyncStorage on every request.
let accessToken = null;
let refreshToken = null;

// Set by AuthContext; called when refreshing fails and the session is truly over.
let onSessionExpired = () => {};

export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

export const getAccessToken = () => accessToken;

// Current user role — used to pick the correct refresh endpoint.
let userRole = null;

export function setUserRole(role) {
  userRole = role;
}

export async function loadTokens() {
  const [access, refresh, role] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
    AsyncStorage.getItem(ROLE_KEY),
  ]);
  accessToken = access;
  refreshToken = refresh;
  userRole = role;
  return { access, refresh, role };
}

export async function saveTokens({ access_token, refresh_token }) {
  accessToken = access_token;
  refreshToken = refresh_token;
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access_token],
    [REFRESH_KEY, refresh_token],
  ]);
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

client.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// One refresh in flight at a time; everyone else awaits the same promise.
let refreshing = null;

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('no refresh token');
  // Choose the correct refresh endpoint based on the current session role.
  // Using the worker endpoint for a customer token fails because the JWT
  // carries role="customer" and the worker endpoint rejects it.
  const refreshUrl =
    userRole === 'customer'
      ? `${API_BASE_URL}/api/customer/auth/refresh`
      : `${API_BASE_URL}/api/auth/refresh`;
  const { data } = await axios.post(
    refreshUrl,
    { refresh_token: refreshToken },
    { timeout: 15000 },
  );
  await saveTokens(data);
  return data.access_token;
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status !== 401 || !config || config._retried || config.skipAuth) {
      return Promise.reject(normalizeError(error));
    }

    config._retried = true;
    try {
      refreshing = refreshing ?? refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const fresh = await refreshing;
      config.headers.Authorization = `Bearer ${fresh}`;
      return client(config);
    } catch {
      await clearTokens();
      onSessionExpired();
      return Promise.reject(normalizeError(error));
    }
  },
);

/**
 * Flatten FastAPI's error shapes into a plain `Error` with a readable message,
 * so screens can render `err.message` without unpacking `detail` themselves.
 */
export function normalizeError(error) {
  if (error?.isNormalized) return error;

  const detail = error?.response?.data?.detail;
  let message;

  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail) && detail.length) {
    // Pydantic validation errors.
    message = detail[0]?.msg ?? 'Please check what you entered.';
  } else if (error?.code === 'ECONNABORTED') {
    message = 'The server took too long to respond.';
  } else if (!error?.response) {
    message = 'Cannot reach the server. Check your connection and API_HOST in src/config.js.';
  } else {
    message = 'Something went wrong. Please try again.';
  }

  const normalized = new Error(message);
  normalized.isNormalized = true;
  normalized.status = error?.response?.status ?? null;
  normalized.original = error;
  return normalized;
}

export default client;
