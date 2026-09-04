/**
 * Session state: who is signed in, and the two navigation-gate hooks the static
 * navigator's `if:` conditions read.
 *
 * `must_change_password` is treated as a third state rather than a flag on the
 * signed-in state, so the navigator can route straight to ChangePassword and the
 * worker cannot swipe past it into the tabs.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { loadTokens, setSessionExpiredHandler } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [worker, setWorker] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  // `restoring` covers the first frame, before AsyncStorage has been read.
  const [restoring, setRestoring] = useState(true);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setWorker(null);
    setMustChangePassword(false);
  }, []);

  // A refresh that fails means the session is over; drop straight to Login.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setWorker(null);
      setMustChangePassword(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { access } = await loadTokens();
        if (access) {
          const me = await authApi.getMe();
          if (!cancelled) setWorker(me);
        }
      } catch {
        // Expired or invalid stored token — stay signed out, silently.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    setWorker(data.worker);
    setMustChangePassword(data.must_change_password);
    return data;
  }, []);

  const completePasswordChange = useCallback(async (currentPassword, newPassword) => {
    await authApi.changePassword(currentPassword, newPassword);
    setMustChangePassword(false);
    // The flag lives on the worker row too; keep the cached copy honest.
    setWorker((prev) => (prev ? { ...prev, must_change_password: false } : prev));
  }, []);

  const refreshWorker = useCallback(async () => {
    const me = await authApi.getMe();
    setWorker(me);
    return me;
  }, []);

  /** Optimistic local patch, so a toggle doesn't wait for a round trip. */
  const patchWorker = useCallback((patch) => {
    setWorker((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      worker,
      restoring,
      mustChangePassword,
      isSignedIn: !!worker && !mustChangePassword,
      signIn,
      signOut,
      completePasswordChange,
      refreshWorker,
      patchWorker,
    }),
    [
      worker,
      restoring,
      mustChangePassword,
      signIn,
      signOut,
      completePasswordChange,
      refreshWorker,
      patchWorker,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

// -- navigator gate hooks ---------------------------------------------------
export const useIsSignedIn = () => useAuth().isSignedIn;
export const useIsSignedOut = () => {
  const { worker, restoring } = useAuth();
  return !restoring && !worker;
};
export const useMustChangePassword = () => {
  const { worker, mustChangePassword } = useAuth();
  return !!worker && mustChangePassword;
};
