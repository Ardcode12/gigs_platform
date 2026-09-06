import axios from 'axios';

const TOKEN_KEY = 'authority.accessToken';
const REFRESH_KEY = 'authority.refreshToken';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  save({ accessToken, refreshToken }) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  // Relative by default so Vite's proxy (see vite.config.js) forwards to the API
  // on one origin. An absolute localhost URL here would bypass that proxy.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * On a 401, try the refresh token once, then replay the original request.
 *
 * Concurrent 401s share a single refresh via `refreshPromise` -- without it,
 * a dashboard firing several requests at once would trigger several refreshes,
 * and the losers would replay with a token that had already been rotated.
 */
let refreshPromise = null;

function onSessionExpired() {
  tokenStore.clear();
  // Full reload rather than a router navigation: this can fire from outside
  // React, and it guarantees no stale authenticated state survives.
  if (window.location.pathname !== '/login') {
    window.location.assign('/login?reason=expired');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh');

    if (response?.status !== 401 || config?._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      onSessionExpired();
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise =
        refreshPromise ??
        api
          .post('/auth/refresh', { refreshToken })
          .then((res) => ({
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
          }))
          .finally(() => {
            refreshPromise = null;
          });

      const session = await refreshPromise;
      tokenStore.save(session);
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(config);
    } catch (refreshError) {
      onSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

/** Pulls a displayable message out of an axios error. */
export function readErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  return error?.message ?? fallback;
}

/** Field-level validation errors returned by the API, keyed by field name. */
export function readFieldErrors(error) {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((detail) => [detail.field, detail.message]));
}
