import axios from 'axios';

/**
 * Federation admin API.
 *
 * Deliberately a separate axios instance from `api/client.js`: that one attaches
 * the *society* token, and the backend rejects a federation token on every
 * /api/society/* route (and vice versa). Keeping two instances -- and two sets
 * of storage keys -- means an officer can hold both sessions without one
 * clobbering the other.
 */

const TOKEN_KEY = 'federation.accessToken';
const REFRESH_KEY = 'federation.refreshToken';

export const federationTokenStore = {
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

const federationClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

federationClient.interceptors.request.use((config) => {
  const token = federationTokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * There is no federation refresh route -- /api/auth/refresh resolves the subject
 * against the workers table -- so an expired token cannot be renewed silently.
 * Drop the session and send them back to the federation login instead.
 */
federationClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/federation/login');

    if (error.response?.status === 401 && !isLogin) {
      federationTokenStore.clear();
      if (window.location.pathname !== '/federation/login') {
        window.location.assign('/federation/login?reason=expired');
      }
    }
    return Promise.reject(error);
  }
);

export const federationApi = {
  login: (email, password) =>
    federationClient
      .post('/auth/federation/login', { email: email.trim(), password })
      .then((r) => ({
        user: r.data.federation,
        session: {
          accessToken: r.data.access_token,
          refreshToken: r.data.refresh_token,
        },
      })),

  me: () => federationClient.get('/federation/me').then((r) => r.data.federation),

  listSocieties: () => federationClient.get('/federation/societies').then((r) => r.data.societies),

  createSociety: (payload) =>
    federationClient.post('/federation/societies', payload).then((r) => r.data.society),
};

/** Pulls a displayable message out of a federation API error. */
export function readFederationError(error, fallback = 'Something went wrong. Please try again.') {
  // FastAPI puts the message in `detail`; it is a list for validation failures.
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  return error?.message ?? fallback;
}
