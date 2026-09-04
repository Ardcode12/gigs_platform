import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../theme';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent, WS_EVENTS } from '../context/SocketContext';
import { getRequests } from '../api/jobs';
import { formatRupees, formatDistance, formatEta, timeAgo } from '../utils/format';

/**
 * Spec #3 — the list of open requests, nearest first.
 *
 * Tapping a row opens NewJobRequestScreen, which is the detail view where the
 * job is actually accepted or rejected.
 */
const JobRequestsListScreen = () => {
  const navigation = useNavigation();
  const { worker } = useAuth();
  const requests = useApi(useCallback(() => getRequests(), []), []);

  // A request can arrive while this screen is the one being looked at.
  useSocketEvent([WS_EVENTS.NEW_JOB_REQUEST, WS_EVENTS.JOB_UPDATE], () => requests.refetch());

  const renderItem = ({ item }) => {
    const distance = formatDistance(item.distance_km);
    const eta = formatEta(item.eta_min);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('JobRequest', { jobId: item.id })}
      >
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.serviceIcon}>
              <MaterialCommunityIcons
                name={item.service_icon || 'wrench'}
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.cardHead}>
              <Text style={styles.service}>{item.service_type}</Text>
              <Text style={styles.customer}>{item.customer_name}</Text>
            </View>
            <View style={styles.amountWrap}>
              <Text style={styles.amount}>{formatRupees(item.total_amount)}</Text>
              <Text style={styles.amountLabel}>estimated</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.textSecondary} />
            <Text style={styles.address} numberOfLines={2}>
              {item.address}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              {distance ? (
                <>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons
                      name="navigation-variant-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.metaText}>{distance}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.metaText}>{eta}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons
                    name="crosshairs-question"
                    size={14}
                    color={COLORS.textTertiary}
                  />
                  <Text style={[styles.metaText, { color: COLORS.textTertiary }]}>
                    Distance unknown
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.ago}>{timeAgo(item.requested_at)}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const body = () => {
    if (requests.loading && !requests.data) return <LoadingState message="Finding work near you…" />;

    if (requests.error && !requests.data) {
      return (
        <EmptyState
          tone="error"
          title="Couldn't load requests"
          message={requests.error.message}
          actionLabel="Try again"
          onAction={requests.reload}
        />
      );
    }

    const items = requests.data ?? [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={worker?.is_available ? 'briefcase-search-outline' : 'sleep'}
          title={worker?.is_available ? 'No requests right now' : "You're unavailable"}
          message={
            worker?.is_available
              ? "New jobs matching your skills will show up here the moment they're posted."
              : 'Turn availability on from the Home screen to start receiving job requests.'
          }
          actionLabel={worker?.is_available ? 'Refresh' : undefined}
          onAction={worker?.is_available ? requests.reload : undefined}
        />
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={requests.refreshing}
            onRefresh={requests.refetch}
            tintColor={COLORS.primary}
          />
        }
      />
    );
  };

  const count = requests.data?.length ?? 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Job Requests"
        subtitle={count > 0 ? `${count} waiting · nearest first` : 'Nothing waiting'}
        onBack={() => navigation.goBack()}
      />
      {body()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  card: {
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHead: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  service: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  customer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textSuccess,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  address: {
    flex: 1,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  metaText: {
    marginLeft: 3,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  ago: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default JobRequestsListScreen;
