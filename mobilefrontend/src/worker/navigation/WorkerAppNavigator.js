/**
 * The worker app's tab tree.
 *
 * This exports the navigator *config*, not a rendered navigation container:
 * RootNavigator mounts it inside the one container the app has, so switching
 * roles cannot leave two containers alive at once.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';

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

// Shared with the customer role.
import ChangePasswordScreen from '../../auth/ChangePasswordScreen';

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

const ProfileStackNav = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    ProfileMain: ProfileScreen,
    Ratings: RatingsScreen,
    ChangePassword: ChangePasswordScreen,
  },
});

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  JobsTab: { focused: 'briefcase', unfocused: 'briefcase-outline' },
  EarningsTab: { focused: 'wallet', unfocused: 'wallet-outline' },
  ProfileTab: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

const WorkerTabs = createBottomTabNavigator({
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

export default WorkerTabs;
