import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import {
  useIsSignedIn,
  useIsSignedOut,
  useMustChangePassword,
} from '../context/AuthContext';

// Worker screens
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewJobRequestScreen from '../screens/NewJobRequestScreen';
import ChatScreen from '../screens/ChatScreen';
import RequestExtraAmountScreen from '../screens/RequestExtraAmountScreen';
import CurrentJobScreen from '../screens/CurrentJobScreen';
import JobRequestsListScreen from '../screens/JobRequestsListScreen';
import JobLocationScreen from '../screens/JobLocationScreen';
import RatingsScreen from '../screens/RatingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

// Home Stack
const HomeStackNav = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    HomeMain: HomeScreen,
    JobRequests: JobRequestsListScreen,
    JobRequest: NewJobRequestScreen,
    CurrentJob: CurrentJobScreen,
    Chat: ChatScreen,
    RequestExtraAmount: RequestExtraAmountScreen,
    JobLocation: JobLocationScreen,
    Notifications: NotificationsScreen,
  },
});

// Jobs Stack
const JobsStackNav = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    JobsMain: JobsScreen,
    JobRequest: NewJobRequestScreen,
    CurrentJob: CurrentJobScreen,
    Chat: ChatScreen,
    RequestExtraAmount: RequestExtraAmountScreen,
    JobLocation: JobLocationScreen,
  },
});

// Profile Stack
const ProfileStackNav = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    ProfileMain: ProfileScreen,
    Ratings: RatingsScreen,
    ChangePassword: ChangePasswordScreen,
  },
});

// Tab icons configuration
const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  JobsTab: { focused: 'briefcase', unfocused: 'briefcase-outline' },
  EarningsTab: { focused: 'wallet', unfocused: 'wallet-outline' },
  ProfileTab: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

// Signed-in tabs
const RootNavigator = createBottomTabNavigator({
  screenOptions: ({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ focused, color }) => {
      const icons = TAB_ICONS[route.name];
      const iconName = focused ? icons.focused : icons.unfocused;
      return (
        <View style={focused ? styles.activeTab : undefined}>
          <MaterialCommunityIcons name={iconName} size={26} color={color} />
        </View>
      );
    },
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textTertiary,
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabLabel,
    tabBarItemStyle: styles.tabItem,
  }),
  screens: {
    HomeTab: {
      screen: HomeStackNav,
      options: { tabBarLabel: 'Home' },
    },
    JobsTab: {
      screen: JobsStackNav,
      options: { tabBarLabel: 'Jobs' },
    },
    EarningsTab: {
      screen: EarningsScreen,
      options: { tabBarLabel: 'Earnings' },
    },
    ProfileTab: {
      screen: ProfileStackNav,
      options: { tabBarLabel: 'Profile' },
    },
  },
});

/**
 * The auth gate. Three mutually exclusive groups, each guarded by a hook that
 * reads AuthContext:
 *
 *   signedOut            → Login / Forgot / Reset
 *   mustChangePassword   → the forced password change, with nothing else mounted
 *                          so it cannot be swiped past
 *   signedIn             → the tabs
 *
 * Because the whole group unmounts when its condition flips, signing in or out
 * needs no navigation call at all — which is why LoginScreen just calls signIn().
 */
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
    SignedIn: {
      if: useIsSignedIn,
      screens: {
        Tabs: RootNavigator,
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

const AppNavigator = () => <Navigation />;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    ...SHADOWS.lg,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  activeTab: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 6,
    marginBottom: -4,
  },
});

export default AppNavigator;
