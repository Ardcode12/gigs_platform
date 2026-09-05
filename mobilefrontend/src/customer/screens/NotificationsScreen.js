import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { NOTIFICATIONS_SAMPLE } from '../data/customerMockData';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const [notifications, setNotifications] = useState(NOTIFICATIONS_SAMPLE);

  const handleNotificationPress = (item) => {
    // Mark as read
    setNotifications(
      notifications.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );

    // Route to appropriate screen based on requirement:
    // 1. Booking confirmation -> TrackBooking
    // 2. Worker messages -> CustomerChat
    // 3. Extra amount request -> ExtraAmount
    // 4. Worker arrival -> TrackBooking
    // 5. Payment confirmation -> BookingHistory or Payment
    // 6. Invoice -> BookingHistory
    // 7. Rating reminder -> RatingFeedback
    if (item.screen && navigation.navigate) {
      navigation.navigate(item.screen);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const notificationCopy = (item) => {
    const values = {
      extra_amount: ['customer.notif.extra.title', 'customer.notif.extra.body', { name: 'Ramesh Kumar', amount: '₹100' }],
      worker_message: ['customer.notif.message.title', 'customer.notif.message.body', { name: 'Ramesh', minutes: 15 }],
      worker_arrival: ['customer.notif.arrival.title', 'customer.notif.arrival.body', { name: 'Ramesh Kumar', address: 'Flat 402, Green Glen Layout' }],
      booking_confirmed: ['customer.notif.confirmed.title', 'customer.notif.confirmed.body', { id: 'WM-9812', time: '3:45 PM' }],
      payment_confirmation: ['customer.notif.payment.title', 'customer.notif.payment.body', { amount: '₹450' }],
      invoice: ['customer.notif.invoice.title', 'customer.notif.invoice.body', { id: 'WM-8102' }],
      rating_reminder: ['customer.notif.rating.title', 'customer.notif.rating.body', { name: 'Rajesh' }],
    }[item.type];
    return values ? { title: t(values[0], values[2]), body: t(values[1], values[2]) } : { title: item.title, body: item.body };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.notifications')}</Text>
        <TouchableOpacity onPress={markAllRead}>
           <Text style={styles.markReadText}>{t('customer.markRead')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
         <Text style={styles.sectionHeaderTitle}>{t('customer.recentUpdates')}</Text>

        <View style={styles.listContainer}>
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.notificationCard, item.unread && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '18' }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>

              <View style={styles.contentWrap}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.itemTitle, item.unread && styles.itemTitleUnread]}>
                     {notificationCopy(item).title}
                  </Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
                </View>

                <Text style={styles.itemBody} numberOfLines={2}>
                   {notificationCopy(item).body}
                </Text>

                <View style={styles.actionPromptRow}>
                   <Text style={styles.actionPromptText}>{t('customer.tapDetails')}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.primary} />
                </View>
              </View>

              {item.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  markReadText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  listContainer: {
    gap: SPACING.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm,
  },
  unreadCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contentWrap: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  itemTitleUnread: {
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primaryDark,
  },
  itemTime: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  itemBody: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  actionPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  actionPromptText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
});

export default NotificationsScreen;
