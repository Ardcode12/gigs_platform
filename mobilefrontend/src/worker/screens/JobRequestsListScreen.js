import React, { useCallback, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../../theme';
import Card from '../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { getRequests, acceptJob, rejectJob } from '../../api/jobs';
import { formatRupees, formatDistance, formatEta, timeAgo } from '../../utils/format';
import { useT } from '../../i18n/LanguageContext';

/**
 * Spec #3 — the list of open requests, nearest first.
 *
 * Tapping a row opens NewJobRequestScreen, which is the detail view where the
 * job is actually accepted or rejected.
 */
const JobRequestsListScreen = () => {
  const navigation = useNavigation();
  const { worker } = useAuth();
  const t = useT();
  const requests = useApi(useCallback(() => getRequests(), []), []);
  const [acting, setActing] = useState({ jobId: null, type: null });

  // Refetch when screen is focused and poll periodically
  useFocusEffect(
    useCallback(() => {
      requests.refetch({ quiet: true });
      const interval = setInterval(() => {
        requests.refetch({ quiet: true });
      }, 3500);
      return () => clearInterval(interval);
    }, [requests]),
  );

  // A request can arrive while this screen is the one being looked at.
  useSocketEvent([WS_EVENTS.NEW_JOB_REQUEST, WS_EVENTS.JOB_UPDATE], () => requests.refetch());

  const handleAccept = async (item) => {
    setActing({ jobId: item.id, type: 'accept' });
    try {
      await acceptJob(item.id);
      navigation.navigate('CurrentJob', { jobId: item.id });
    } catch (error) {
      const msg = error.message || t('worker.couldNotAccept');
      Alert.alert(t('worker.couldNotAccept'), msg, [
        { text: t('common.ok'), onPress: () => requests.refetch() },
      ]);
    } finally {
      setActing({ jobId: null, type: null });
    }
  };

  const handleReject = (item) => {
    Alert.alert(
      t('worker.rejectConfirm'),
      t('worker.rejectBody'),
      [
        { text: t('worker.keepJob'), style: 'cancel' },
        {
          text: t('worker.rejectJob'),
          style: 'destructive',
          onPress: async () => {
            setActing({ jobId: item.id, type: 'reject' });
            try {
              await rejectJob(item.id);
              requests.refetch();
            } catch (error) {
              Alert.alert(t('worker.couldNotReject'), error.message);
            } finally {
              setActing({ jobId: null, type: null });
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

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
               <Text style={styles.amountLabel}>{t('worker.estimated')}</Text>
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
                     {t('job.distanceUnknown')}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.ago}>{timeAgo(item.requested_at)}</Text>
          </View>

          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.cardRejectBtn}
              onPress={() => handleReject(item)}
              disabled={acting.jobId === item.id}
              activeOpacity={0.8}
            >
              {acting.jobId === item.id && acting.type === 'reject' ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <>
                  <MaterialCommunityIcons name="close" size={18} color={COLORS.danger} />
                  <Text style={styles.cardRejectText}>{t('common.reject')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardAcceptBtn}
              onPress={() => handleAccept(item)}
              disabled={acting.jobId === item.id}
              activeOpacity={0.8}
            >
              {acting.jobId === item.id && acting.type === 'accept' ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
                  <Text style={styles.cardAcceptText}>{t('worker.acceptJob')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const body = () => {
     if (requests.loading && !requests.data) return <LoadingState message={t('worker.findingWork')} />;

    if (requests.error && !requests.data) {
      return (
        <EmptyState
          tone="error"
           title={t('worker.loadRequests')}
          message={requests.error.message}
           actionLabel={t('common.tryAgain')}
          onAction={requests.reload}
        />
      );
    }

    const items = requests.data ?? [];

    if (items.length === 0) {
      return (
        <EmptyState
          icon={worker?.is_available ? 'briefcase-search-outline' : 'sleep'}
           title={worker?.is_available ? t('worker.noRequests') : t('worker.youUnavailable')}
          message={
            worker?.is_available
               ? t('worker.matchingRequests')
               : t('worker.turnAvailability')
          }
           actionLabel={worker?.is_available ? t('common.retry') : undefined}
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
         title={t('worker.jobRequests')}
         subtitle={count > 0 ? t('worker.waitingNearest', { count }) : t('worker.nothingWaiting')}
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
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
  },
  cardRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    minHeight: 44,
  },
  cardRejectText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    marginLeft: 6,
  },
  cardAcceptBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    minHeight: 44,
  },
  cardAcceptText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: 6,
  },
});

export default JobRequestsListScreen;
