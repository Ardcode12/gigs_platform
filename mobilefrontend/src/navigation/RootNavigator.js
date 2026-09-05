/**
 * The one navigation container, and the auth gate over both roles.
 *
 * Four mutually exclusive groups, each guarded by a hook that reads AuthContext:
 *
 *   signedOut            → the shared Login (+ Forgot / Reset)
 *   mustChangePassword   → the forced password change, with nothing else mounted
 *                          so it cannot be swiped past
 *   worker               → the worker tabs
 *   customer             → the customer tabs
 *
 * Because a group unmounts the moment its condition flips, signing in or out
 * needs no navigation call at all — which is why LoginScreen just calls signIn()
 * and the logout buttons just call signOut(). It also means the two role trees
 * are never mounted at the same time.
 */

import React from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useIsCustomer,
  useIsSignedOut,
  useIsWorker,
  useMustChangePassword,
} from '../context/AuthContext';

// Shared auth screens — one login for both roles.
import LoginScreen from '../auth/LoginScreen';
import ForgotPasswordScreen from '../auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../auth/ResetPasswordScreen';
import ChangePasswordScreen from '../auth/ChangePasswordScreen';

import WorkerTabs from '../worker/navigation/WorkerAppNavigator';
import CustomerTabs from '../customer/navigation/CustomerAppNavigator';

const RootStack = createStackNavigator({
  screenOptions: { headerShown: false },
  groups: {
    SignedOut: {
      if: useIsSignedOut,
      screens: {
        Login: LoginScreen,
        ForgotPassword: ForgotPasswordScreen,
        ResetPassword: ResetPasswordScreen,
      },
    },
    ForcedPasswordChange: {
      if: useMustChangePassword,
      screens: {
        ForcePasswordChange: {
          screen: ChangePasswordScreen,
          options: { gestureEnabled: false },
        },
      },
    },
    Worker: {
      if: useIsWorker,
      screens: {
        WorkerApp: WorkerTabs,
      },
    },
    Customer: {
      if: useIsCustomer,
      screens: {
        CustomerApp: CustomerTabs,
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

const RootNavigator = () => <Navigation />;

export default RootNavigator;
