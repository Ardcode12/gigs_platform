import React, { useCallback, useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../../components/Avatar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import useLocation from '../../hooks/useLocation';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { setAvailability } from '../../api/worker';
import { getRequests, getCurrentJob, getHistory } from '../../api/jobs';
import { getSummary } from '../../api/earnings';
import { getUnreadCount } from '../../api/notifications';
import { formatRupees, formatTime } from '../../utils/format';
import { JOB_STEPS, STATUS_LABEL, STATUS_TONE, JOB_STATUS } from '../../constants/jobSteps';
import { useT } from '../../i18n/LanguageContext';

const greeting = (t) => {
  const hour = new Date().getHours();
  if (hour < 12) return t('worker.goodMorning');
  if (hour < 17) return t('worker.goodAfternoon');
  return t('worker.goodEvening');
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { worker, patchWorker } = useAuth();
  const t = useT();
  const [toggling, setToggling] = useState(false);
  const isAvailable = worker?.is_available ?? false;

  // A position is what lets the API compute distance and ETA for every job.
  const { request: requestLocation } = useLocation();

  const dashboard = useApi(
    useCallback(
      () =>
        Promise.all([
          getRequests(),
          getCurrentJob(),
          getSummary('today'),
          getHistory({ limit: 10 }),
          getUnreadCount(),
        ]).then(([requests, current, earnings, history, unread]) => ({
          requests,
          current,
          earnings,
          history,
          unread: unread.unread,
        })),
      [],
    ),
    [],
  );

  // Refetch when screen is focused and poll periodically
  useFocusEffect(
    useCallback(() => {
      dashboard.refetch({ quiet: true });
      const interval = setInterval(() => {
        dashboard.refetch({ quiet: true });
      }, 3500);
      return () => clearInterval(interval);
    }, [dashboard]),
  );

  // Anything that changes the dashboard arrives as one of these.
  useSocketEvent(
    [
      WS_EVENTS.NEW_JOB_REQUEST,
      WS_EVENTS.JOB_UPDATE,
      WS_EVENTS.PAYMENT_UPDATE,
      WS_EVENTS.EXTRA_AMOUNT_DECISION,
      WS_EVENTS.CHAT_MESSAGE,
    ],
    () => dashboard.refetch(),
  );

  const handleToggleAvailability = async (next) => {
    // Optimistic: the switch should not lag behind the thumb.
    patchWorker({ is_available: next });
    setToggling(true);
    try {
      const result = await setAvailability(next);
      patchWorker({ is_available: result.is_available });
      if (next) requestLocation();
      dashboard.refetch();
    } catch (error) {
      patchWorker({ is_available: !next });
      Alert.alert(t('worker.couldNotUpdateAvailability'), error.message);
    } finally {
      setToggling(false);
    }
  };

  if (dashboard.loading && !dashboard.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <LoadingState message={t('worker.loadingDay')} />
      </View>
    );
  }

  if (dashboard.error && !dashboard.data) {
    return (
      <View style={styles.container}>
        <EmptyState
          tone="error"
          title={t('worker.cantReach')}
          message={dashboard.error.message}
           actionLabel={t('common.tryAgain')}
          onAction={dashboard.reload}
        />
      </View>
    );
  }

  const { requests = [], current, earnings, history = [], unread = 0 } = dashboard.data ?? {};
  const pendingRequests = requests.length;
  const currentStepLabel =
    current?.current_step != null ? JOB_STEPS[current.current_step] : STATUS_LABEL[current?.status];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar
              name={worker?.name}
              uri={worker?.photo_url}
              size={48}
              backgroundColor="rgba(255,255,255,0.25)"
              color={COLORS.white}
              online={isAvailable}
            />
            <View style={styles.headerInfo}>
               <Text style={styles.greeting}>{greeting(t)}</Text>
              <Text style={styles.workerName}>{worker?.name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
            {unread > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availLeft}>
            <MaterialCommunityIcons
              name={isAvailable ? 'check-circle' : 'close-circle'}
              size={24}
              color={isAvailable ? COLORS.success : COLORS.offline}
            />
            <View style={{ marginLeft: SPACING.md }}>
              <Text style={styles.availLabel}>
                 {isAvailable ? t('worker.available') : t('worker.unavailable')}
              </Text>
              <Text style={styles.availSubtext}>
                 {isAvailable ? t('worker.readyJobs') : t('worker.notReceiving')}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            disabled={toggling}
            trackColor={{ false: COLORS.border, true: '#86EFAC' }}
            thumbColor={isAvailable ? COLORS.success : COLORS.offline}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.refreshing}
            onRefresh={dashboard.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* New Job Requests */}
        {pendingRequests > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('JobRequests')}
          >
            <Card style={styles.requestCard}>
              <View style={styles.requestCardInner}>
                <View style={styles.requestIconWrap}>
                  <MaterialCommunityIcons name="briefcase-clock" size={28} color={COLORS.white} />
                </View>
                <View style={styles.requestInfo}>
                   <Text style={styles.requestTitle}>{t('worker.newRequests')}</Text>
                  <Text style={styles.requestSubtext}>
                     {t('worker.request_one', { count: pendingRequests })}
                  </Text>
                </View>
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{pendingRequests}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {!isAvailable && (
          <Card variant="warning" style={styles.offlineCard}>
            <View style={styles.offlineRow}>
              <MaterialCommunityIcons name="sleep" size={22} color={COLORS.warning} />
              <Text style={styles.offlineText}>
                {t('worker.unavailableNotice')}
              </Text>
            </View>
          </Card>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="currency-inr" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{formatRupees(earnings?.total)}</Text>
            <Text style={styles.statLabel}>{t('worker.todayEarnings')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{earnings?.jobs ?? 0}</Text>
            <Text style={styles.statLabel}>{t('worker.todayJobs')}</Text>
          </Card>
        </View>

        {/* Current Job Quick View */}
        {current ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CurrentJob', { jobId: current.id })}
          >
            <Card style={styles.currentJobCard}>
              <View style={styles.currentJobHeader}>
                 <StatusBadge
                   label={t(STATUS_LABEL[current.status] ?? 'common.unknown').toUpperCase()}
                  color={STATUS_TONE[current.status] ?? 'warning'}
                  size="sm"
                />
                <Text style={styles.currentJobTime}>{formatTime(current.accepted_at)}</Text>
              </View>
              <View style={styles.currentJobBody}>
                <View style={[styles.serviceIconCircle, { backgroundColor: COLORS.infoLight }]}>
                  <MaterialCommunityIcons
                    name={current.service_icon || 'wrench'}
                    size={24}
                    color={COLORS.info}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.currentJobService}>{current.service_type}</Text>
                  <Text style={styles.currentJobCustomer}>{current.customer.name}</Text>
                  <View style={styles.currentJobLocation}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.currentJobAddress} numberOfLines={1}>
                      {current.location.address}
                    </Text>
                  </View>
                </View>
                <View style={styles.currentJobAmount}>
                  <Text style={styles.currentJobAmountText}>
                    {formatRupees(current.amounts.total_amount)}
                  </Text>
                </View>
              </View>
              <View style={styles.currentJobFooter}>
                <View style={styles.currentJobStep}>
                  <View style={styles.stepDot} />
                   <Text style={styles.stepText}>{t(currentStepLabel ?? 'common.unknown')}</Text>
                </View>
                <View style={styles.viewBtn}>
                   <Text style={styles.viewBtnText}>{t('worker.viewDetails')}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ) : (
          <Card style={styles.noJobCard}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={28}
              color={COLORS.textTertiary}
            />
             <Text style={styles.noJobTitle}>{t('job.none')}</Text>
            <Text style={styles.noJobText}>
              {pendingRequests > 0
                 ? t('worker.pickNext')
                 : t('worker.acceptOne')}
            </Text>
          </Card>
        )}

        {/* Recent Jobs */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>{t('worker.recentJobs')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('JobsTab')}>
             <Text style={styles.seeAllText}>{t('worker.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <Card style={styles.jobItem}>
             <Text style={styles.noJobText}>{t('worker.noJobs')}</Text>
          </Card>
        ) : (
          history.map((job) => (
            <Card key={String(job.id)} style={styles.jobItem}>
              <TouchableOpacity
                style={styles.jobItemRow}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate(
                    job.status === JOB_STATUS.COMPLETED ? 'JobRequest' : 'CurrentJob',
                    { jobId: job.id },
                  )
                }
              >
                <View
                  style={[
                    styles.jobStatusDot,
                    {
                      backgroundColor:
                        job.status === JOB_STATUS.COMPLETED
                          ? COLORS.success
                          : job.status === JOB_STATUS.REJECTED ||
                            job.status === JOB_STATUS.CANCELLED
                          ? COLORS.danger
                          : COLORS.warning,
                    },
                  ]}
                />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.jobItemService}>{job.service_type}</Text>
                  <Text style={styles.jobItemCustomer}>
                    {job.customer_name} · {formatTime(job.completed_at || job.requested_at)}
                  </Text>
                </View>
                <View style={styles.jobItemRight}>
                  <Text style={styles.jobItemAmount}>{formatRupees(job.total_amount)}</Text>
                  <StatusBadge
                     label={t(STATUS_LABEL[job.status] ?? 'common.unknown')}
                    color={STATUS_TONE[job.status] ?? 'neutral'}
                    size="sm"
                  />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: SPACING.md,
    flexShrink: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  workerName: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  availLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  availLabel: {
    flexShrink: 1,
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: 24,
  },
  availSubtext: {
    flexShrink: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
    lineHeight: 21,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  requestCard: {
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  requestCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  requestTitle: {
    flexShrink: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  requestSubtext: {
    flexShrink: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  requestBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  requestBadgeText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  offlineCard: {
    marginBottom: SPACING.lg,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  offlineText: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  currentJobCard: {
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warningLight,
  },
  currentJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  currentJobTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  currentJobBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentJobService: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  currentJobCustomer: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  currentJobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentJobAddress: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  currentJobAmount: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  currentJobAmountText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  currentJobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  currentJobStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    marginRight: SPACING.sm,
  },
  stepText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    marginRight: 4,
  },
  noJobCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  noJobTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  noJobText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  jobItem: {
    marginBottom: SPACING.sm,
  },
  jobItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jobItemService: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  jobItemCustomer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobItemRight: {
    alignItems: 'flex-end',
  },
  jobItemAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
});

export default HomeScreen;
