import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import useApi from '../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../context/SocketContext';
import { getNotifications, markRead, markAllRead } from '../api/notifications';
import { timeAgo, dayLabel } from '../utils/format';

/** How each notification type looks, and where tapping it goes. */
const TYPE_META = {
  new_job: { icon: 'briefcase-plus', color: COLORS.primary, bg: COLORS.primaryLight },
  chat: { icon: 'message-text', color: COLORS.info, bg: COLORS.infoLight },
  extra_amount: { icon: 'cash-plus', color: COLORS.warning, bg: COLORS.warningLight },
  payment: { icon: 'wallet', color: COLORS.success, bg: COLORS.successLight },
  job_update: { icon: 'progress-wrench', color: COLORS.primary, bg: COLORS.primaryLight },
};

const FALLBACK_META = { icon: 'bell', color: COLORS.textSecondary, bg: COLORS.borderLight };

/** Groups the flat list into Today / Yesterday / date sections. */
const toSections = (items) => {
  const order = [];
  const buckets = new Map();
  items.forEach((item) => {
    const key = dayLabel(item.created_at);
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key).push(item);
  });
  return order.map((title) => ({ title, data: buckets.get(title) }));
};

/** Spec #12 — one inbox for jobs, messages, extra-amount decisions and payments. */
const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [marking, setMarking] = useState(false);

  const feed = useApi(useCallback(() => getNotifications({ limit: 100 }), []), []);

  // Every live event also lands here as a row.
  useSocketEvent(
    [
      WS_EVENTS.NEW_JOB_REQUEST,
      WS_EVENTS.CHAT_MESSAGE,
      WS_EVENTS.EXTRA_AMOUNT_DECISION,
      WS_EVENTS.PAYMENT_UPDATE,
      WS_EVENTS.JOB_UPDATE,
    ],
    () => feed.refetch(),
  );

  const items = feed.data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  const handleOpen = async (item) => {
    // Mark read locally first — the row should dim on tap, not after a round trip.
    if (!item.is_read) {
      feed.setData((prev) =>
        (prev ?? []).map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
      );
      markRead(item.id).catch(() => {});
    }

    const jobId = item.data?.job_id;
    if (!jobId) return;

    if (item.type === 'chat') navigation.navigate('Chat', { jobId });
    else if (item.type === 'new_job') navigation.navigate('JobRequest', { jobId });
    else navigation.navigate('CurrentJob', { jobId });
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllRead();
      feed.setData((prev) => (prev ?? []).map((n) => ({ ...n, is_read: true })));
    } catch {
      feed.refetch();
    } finally {
      setMarking(false);
    }
  };

  const renderItem = ({ item }) => {
    const meta = TYPE_META[item.type] ?? FALLBACK_META;

    return (
      <TouchableOpacity
        style={[styles.row, !item.is_read && styles.rowUnread]}
        activeOpacity={0.7}
        onPress={() => handleOpen(item)}
      >
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.title, !item.is_read && styles.titleUnread]} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.body && (
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (feed.loading && !feed.data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
        <LoadingState />
      </View>
    );
  }

  if (feed.error && !feed.data) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
        <EmptyState
          tone="error"
          title="Couldn't load notifications"
          message={feed.error.message}
          actionLabel="Try again"
          onAction={feed.reload}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        onBack={() => navigation.goBack()}
        right={
          unread > 0 ? (
            <TouchableOpacity
              onPress={handleMarkAll}
              disabled={marking}
              style={styles.markAll}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllText}>{marking ? '…' : 'Mark all'}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="No notifications"
          message="Job requests, messages and payment updates will show up here."
        />
      ) : (
        <SectionList
          sections={toSections(items)}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={feed.refetch}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  markAll: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textWhite,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  rowUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: FONT_WEIGHT.bold,
  },
  body: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 19,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    marginTop: 6,
  },
});

export default NotificationsScreen;
