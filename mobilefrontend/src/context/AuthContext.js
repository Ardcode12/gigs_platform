/**
 * Session state: which role is signed in, and the navigation-gate hooks the
 * static navigator's `if:` conditions read.
 *
 * `must_change_password` is treated as a third state rather than a flag on the
 * signed-in state, so the navigator can route straight to ChangePassword and the
 * worker cannot swipe past it into the tabs.
 *
 * Login is shared by both roles, so the session carries a `role`. Only the
 * worker role has a backend: signing in as a worker exchanges credentials for
 * tokens, while the customer role is a local session over mock data until
 * customer endpoints exist.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { loadTokens, setSessionExpiredHandler } from '../api/client';

export const ROLES = { WORKER: 'worker', CUSTOMER: 'customer' };

// The worker session is identified by its tokens; the customer session has no
// credentials to store, so the role marker alone survives a reload.
const ROLE_KEY = 'workmat.role';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [worker, setWorker] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  // `restoring` covers the first frame, before AsyncStorage has been read.
  const [restoring, setRestoring] = useState(true);

  const signOut = useCallback(async () => {
    await authApi.logout();
    await AsyncStorage.removeItem(ROLE_KEY);
    setRole(null);
    setWorker(null);
    setCustomer(null);
    setMustChangePassword(false);
  }, []);

  // A refresh that fails means the session is over; drop straight to Login.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      AsyncStorage.removeItem(ROLE_KEY);
      setRole(null);
      setWorker(null);
      setCustomer(null);
      setMustChangePassword(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const storedRole = await AsyncStorage.getItem(ROLE_KEY);
        const { access } = await loadTokens();

        if (storedRole === ROLES.CUSTOMER && access) {
          const me = await authApi.getCustomerMe();
          if (!cancelled) {
            setCustomer(me);
            setRole(ROLES.CUSTOMER);
          }
          return;
        }

        if (storedRole === ROLES.WORKER && access) {
          const me = await authApi.getMe();
          if (!cancelled) {
            setWorker(me);
            setRole(ROLES.WORKER);
          }
          return;
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

  /** Worker sign-in: worker code or phone, against the real backend. */
  const signIn = useCallback(async (identifier, password) => {
    const data = await authApi.login(identifier, password);
    await AsyncStorage.setItem(ROLE_KEY, ROLES.WORKER);
    setWorker(data.worker);
    setCustomer(null);
    setRole(ROLES.WORKER);
    setMustChangePassword(data.must_change_password);
    return data;
  }, []);

  /** Customer sign-in: phone or email + password, against the real backend. */
  const signInCustomer = useCallback(async (identifier, password) => {
    const data = await authApi.customerLogin(identifier, password);
    await AsyncStorage.setItem(ROLE_KEY, ROLES.CUSTOMER);
    setCustomer(data.customer);
    setWorker(null);
    setMustChangePassword(false);
    setRole(ROLES.CUSTOMER);
    return data;
  }, []);

  /** Customer sign-up: register new customer and store session against real backend. */
  const signUpCustomer = useCallback(async (payload) => {
    const data = await authApi.customerSignup(payload);
    await AsyncStorage.setItem(ROLE_KEY, ROLES.CUSTOMER);
    setCustomer(data.customer);
    setWorker(null);
    setMustChangePassword(false);
    setRole(ROLES.CUSTOMER);
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

  const refreshCustomer = useCallback(async () => {
    const me = await authApi.getCustomerMe();
    setCustomer(me);
    return me;
  }, []);

  /** Optimistic local patch, so a toggle doesn't wait for a round trip. */
  const patchWorker = useCallback((patch) => {
    setWorker((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const patchCustomer = useCallback((patch) => {
    setCustomer((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      role,
      worker,
      customer,
      restoring,
      mustChangePassword,
      isSignedIn: !!role && !mustChangePassword,
      signIn,
      signInCustomer,
      signUpCustomer,
      signOut,
      completePasswordChange,
      refreshWorker,
      refreshCustomer,
      patchWorker,
      patchCustomer,
    }),
    [
      role,
      worker,
      customer,
      restoring,
      mustChangePassword,
      signIn,
      signInCustomer,
      signUpCustomer,
      signOut,
      completePasswordChange,
      refreshWorker,
      refreshCustomer,
      patchWorker,
      patchCustomer,
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
// Exactly one of these is true at a time, so exactly one navigator group mounts.
export const useIsSignedOut = () => {
  const { role, restoring } = useAuth();
  return !restoring && !role;
};
export const useMustChangePassword = () => {
  const { role, mustChangePassword } = useAuth();
  return !!role && mustChangePassword;
};
export const useIsWorker = () => {
  const { role, mustChangePassword } = useAuth();
  return role === ROLES.WORKER && !mustChangePassword;
};
export const useIsCustomer = () => {
  const { role, mustChangePassword } = useAuth();
  return role === ROLES.CUSTOMER && !mustChangePassword;
};
