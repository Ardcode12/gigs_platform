import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

/** Activity that counts as "the officer is still here" for the idle timer. */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const idleTimer = useRef(null);

  // Restore the session on a page refresh. A stored token that the API rejects
  // is discarded rather than trusted.
  useEffect(() => {
    async function restore() {
      if (!tokenStore.getAccessToken()) {
        setInitializing(false);
        return;
      }
      try {
        setUser(await authApi.me());
      } catch {
        tokenStore.clear();
      } finally {
        setInitializing(false);
      }
    }
    restore();
  }, []);

  const signOut = useCallback(
    async ({ notifyServer = true } = {}) => {
      if (notifyServer) {
        // Best effort -- a failed logout call must not trap the officer in a
        // session they have asked to end.
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
      }
      tokenStore.clear();
      setUser(null);
    },
    []
  );

  // Session timeout, required by the spec. Signs the officer out after a
  // period with no interaction.
  useEffect(() => {
    if (!user) return undefined;

    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        signOut({ notifyServer: true });
        window.location.assign('/login?reason=timeout');
      }, timeoutMs);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, sessionTimeoutMinutes, signOut]);

  const signIn = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    tokenStore.save(result.session);
    setUser(result.user);
    if (result.sessionTimeoutMinutes) {
      setSessionTimeoutMinutes(result.sessionTimeoutMinutes);
    }
    return result.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      sessionTimeoutMinutes,
      signIn,
      signOut,
    }),
    [user, initializing, sessionTimeoutMinutes, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return context;
}
