/**
 * The customer app's tab tree.
 *
 * This exports the navigator *config*, not a rendered navigation container:
 * RootNavigator mounts it inside the one container the app has. Login is not in
 * here — it is shared with the worker role and lives above this tree.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';

// Customer Screens
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import SearchServiceScreen from '../screens/SearchServiceScreen';
import AIRequirementScreen from '../screens/AIRequirementScreen';
import CostEstimateScreen from '../screens/CostEstimateScreen';
import WorkerRecommendationsScreen from '../screens/WorkerRecommendationsScreen';
import WorkerProfileScreen from '../screens/WorkerProfileScreen';
import CustomerChatScreen from '../screens/CustomerChatScreen';
import ExtraAmountScreen from '../screens/ExtraAmountScreen';
import ConfirmBookingScreen from '../screens/ConfirmBookingScreen';
import TrackBookingScreen from '../screens/TrackBookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RatingFeedbackScreen from '../screens/RatingFeedbackScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import CustomerProfileScreen from '../screens/CustomerProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// 1. Home Stack
const HomeStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    CustomerHome: CustomerHomeScreen,
    SearchService: SearchServiceScreen,
    AIRequirement: AIRequirementScreen,
    CostEstimate: CostEstimateScreen,
    WorkerRecommendations: WorkerRecommendationsScreen,
    WorkerProfile: WorkerProfileScreen,
    ConfirmBooking: ConfirmBookingScreen,
    ExtraAmount: ExtraAmountScreen,
    TrackBooking: TrackBookingScreen,
    Payment: PaymentScreen,
    RatingFeedback: RatingFeedbackScreen,
    CustomerChat: CustomerChatScreen,
    Notifications: NotificationsScreen,
  },
});

// 2. Bookings Stack
const BookingsStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    TrackBookingMain: TrackBookingScreen,
    BookingHistory: BookingHistoryScreen,
    Payment: PaymentScreen,
    RatingFeedback: RatingFeedbackScreen,
    CustomerChat: CustomerChatScreen,
    ExtraAmount: ExtraAmountScreen,
  },
});

// 3. Messages Stack
const MessagesStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    CustomerChatMain: CustomerChatScreen,
    ExtraAmount: ExtraAmountScreen,
    WorkerProfile: WorkerProfileScreen,
  },
});

// 4. Profile Stack
const ProfileStack = createStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    CustomerProfileMain: CustomerProfileScreen,
    Notifications: NotificationsScreen,
    BookingHistory: BookingHistoryScreen,
  },
});

const TAB_ICONS = {
  HomeTab: { focused: 'home', unfocused: 'home-outline' },
  BookingsTab: { focused: 'calendar-check', unfocused: 'calendar-check-outline' },
  MessagesTab: { focused: 'chat-processing', unfocused: 'chat-processing-outline' },
  ProfileTab: { focused: 'account-circle', unfocused: 'account-circle-outline' },
};

// Root Tab Navigator with 4 tabs: Home, Bookings, Messages, Profile
const LocalizedTabLabel = ({ labelKey, color }) => {
  const t = useT();
  return <Text style={[styles.tabLabel, { color }]}>{t(labelKey)}</Text>;
};

const RootCustomerTabs = createBottomTabNavigator({
  screenOptions: ({ route }) => {
    const nestedRoute = route.state?.routes?.[route.state.index ?? 0]?.name;
    const isNestedScreen = nestedRoute && !nestedRoute.endsWith('Main') && nestedRoute !== 'CustomerHome';

    return {
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        const icons = TAB_ICONS[route.name];
        const iconName = focused ? icons.focused : icons.unfocused;
        return (
          <View style={focused ? styles.activeTabHighlight : styles.tabIcon}>
            <MaterialCommunityIcons name={iconName} size={24} color={color} />
          </View>
        );
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textTertiary,
      tabBarStyle: isNestedScreen ? styles.hiddenTabBar : styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarItemStyle: styles.tabItem,
    };
  },
  screens: {
    HomeTab: {
      screen: HomeStack,
       options: { tabBarLabel: ({ color }) => <LocalizedTabLabel labelKey="tabs.home" color={color} /> },
    },
    BookingsTab: {
      screen: BookingsStack,
       options: { tabBarLabel: ({ color }) => <LocalizedTabLabel labelKey="tabs.bookings" color={color} /> },
    },
    MessagesTab: {
      screen: MessagesStack,
       options: { tabBarLabel: ({ color }) => <LocalizedTabLabel labelKey="tabs.messages" color={color} /> },
    },
    ProfileTab: {
      screen: ProfileStack,
       options: { tabBarLabel: ({ color }) => <LocalizedTabLabel labelKey="tabs.profile" color={color} /> },
    },
  },
});

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Leave room for Android's gesture/navigation inset so labels stay above it.
    height: Platform.OS === 'ios' ? 88 : 88,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 24,
    ...SHADOWS.lg,
  },
  hiddenTabBar: {
    display: 'none',
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabHighlight: {
    backgroundColor: COLORS.primaryLight,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootCustomerTabs;
