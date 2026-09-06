import React, { useState, useEffect } from 'react';
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
import { getCustomerNotifications, markCustomerRead, markAllCustomerRead } from '../../api/notifications';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getCustomerNotifications().then((data) => setNotifications(data?.items || [])).catch(() => setNotifications([]));
  }, []);

  const handleNotificationPress = (item) => {
    // Mark as read
    markCustomerRead(item.id).catch(() => {});
    setNotifications(notifications.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));

    // Route to appropriate screen based on requirement:
    // 1. Booking confirmation -> TrackBooking
    // 2. Worker messages -> CustomerChat
    // 3. Extra amount request -> ExtraAmount
    // 4. Worker arrival -> TrackBooking
    // 5. Payment confirmation -> BookingHistory or Payment
    // 6. Invoice -> BookingHistory
    // 7. Rating reminder -> RatingFeedback
    const screen = item.data?.screen;
    if (screen && navigation.navigate) navigation.navigate(screen, item.data);
  };

  const markAllRead = () => {
    markAllCustomerRead().catch(() => {});
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

  const notificationCopy = (item) => {
    return { title: item.title || '', body: item.body || '' };
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
           {notifications.length === 0 && (
             <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>{t('notif.empty')}</Text>
           )}
           {notifications.map((item) => (
            <TouchableOpacity
              key={String(item.id)}
               style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.85}
            >
               <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                 <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
              </View>

              <View style={styles.contentWrap}>
                <View style={styles.cardTopRow}>
                   <Text style={[styles.itemTitle, !item.is_read && styles.itemTitleUnread]}>
                     {notificationCopy(item).title}
                  </Text>
                   <Text style={styles.itemTime}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
                </View>

                <Text style={styles.itemBody} numberOfLines={2}>
                   {notificationCopy(item).body}
                </Text>

                <View style={styles.actionPromptRow}>
                   <Text style={styles.actionPromptText}>{t('customer.tapDetails')}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.primary} />
                </View>
              </View>

               {!item.is_read && <View style={styles.unreadDot} />}
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
