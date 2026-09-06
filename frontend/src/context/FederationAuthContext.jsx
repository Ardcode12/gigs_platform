import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { federationApi, federationTokenStore } from '../api/federationApi.js';

const FederationAuthContext = createContext(null);

/**
 * Session state for the federation admin console.
 *
 * Mirrors AuthContext but is kept separate on purpose: the two portals have
 * different tokens, different /me endpoints and different landing routes.
 */
export function FederationAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore on refresh. A stored token the API rejects is discarded, not trusted.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!federationTokenStore.getAccessToken()) {
        if (!cancelled) setInitializing(false);
        return;
      }
      try {
        const me = await federationApi.me();
        if (!cancelled) setUser(me);
      } catch {
        federationTokenStore.clear();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const result = await federationApi.login(email, password);
    federationTokenStore.save(result.session);
    setUser(result.user);
    return result.user;
  }, []);

  // No server call: /api/auth/logout authenticates as a worker, so a federation
  // token is rejected there. Dropping the token locally is the whole logout.
  const signOut = useCallback(() => {
    federationTokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
    }),
    [user, initializing, signIn, signOut]
  );

  return (
    <FederationAuthContext.Provider value={value}>{children}</FederationAuthContext.Provider>
  );
}

export function useFederationAuth() {
  const context = useContext(FederationAuthContext);
  if (!context) {
    throw new Error('useFederationAuth must be used inside a <FederationAuthProvider>.');
  }
  return context;
}
