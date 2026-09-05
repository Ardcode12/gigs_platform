import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { getHistory, getCurrentJob } from '../../api/jobs';
import { formatRupees, formatDistance, formatTime, dayLabel } from '../../utils/format';
import {
  JOB_STATUS,
  JOB_STEPS,
  STATUS_LABEL,
  STATUS_TONE,
  ACTIVE_STATUSES,
} from '../../constants/jobSteps';
import { useT } from '../../i18n/LanguageContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const JobsScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const [filter, setFilter] = useState('all');

  const jobs = useApi(
    useCallback(
      () =>
        Promise.all([getHistory({ limit: 100 }), getCurrentJob()]).then(([history, current]) => ({
          history,
          current,
        })),
      [],
    ),
    [],
  );

  useSocketEvent([WS_EVENTS.JOB_UPDATE, WS_EVENTS.PAYMENT_UPDATE], () => jobs.refetch());

  const history = jobs.data?.history ?? [];
  const current = jobs.data?.current ?? null;

  const completed = history.filter((job) => job.status === JOB_STATUS.COMPLETED);
  const activeCount = current ? 1 : 0;

  // "Active" is a client-side view of the history list: the API filters by one
  // status at a time, and active spans four of them.
  const visible =
    filter === 'completed'
      ? completed
      : filter === 'active'
        ? history.filter((job) => ACTIVE_STATUSES.includes(job.status))
        : history;

  const openJob = (job) =>
    navigation.navigate(job.status === JOB_STATUS.COMPLETED ? 'JobRequest' : 'CurrentJob', {
      jobId: job.id,
    });

  const chrome = (children) => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('worker.myJobs')}</Text>
      </View>
      {children}
    </View>
  );

  if (jobs.loading && !jobs.data) return chrome(<LoadingState message={t('worker.loadingJobs')} />);

  if (!jobs.data) {
    return chrome(
      <EmptyState
        tone="error"
        title={t('worker.loadYourJobs')}
        message={jobs.error?.message}
        actionLabel={t('common.tryAgain')}
        onAction={jobs.reload}
      />,
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('worker.myJobs')}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{activeCount}</Text>
          <Text style={styles.statText}>{t('worker.active')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{completed.length}</Text>
          <Text style={styles.statText}>{t('worker.completed')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{history.length}</Text>
          <Text style={styles.statText}>{t('worker.total')}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {t(`worker.${item.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={jobs.refreshing}
            onRefresh={jobs.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Active Job Section */}
        {!!current && filter !== 'completed' && (
          <>
             <Text style={styles.sectionTitle}>{t('worker.activeJob')}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CurrentJob', { jobId: current.id })}
            >
              <Card style={styles.activeJobCard}>
                <View style={styles.activeJobHeader}>
                  <StatusBadge
                    label={t(STATUS_LABEL[current.status] ?? 'common.unknown').toUpperCase()}
                    color={STATUS_TONE[current.status] ?? 'warning'}
                    size="sm"
                  />
                  <Text style={styles.jobTime}>{formatTime(current.accepted_at)}</Text>
                </View>
                <View style={styles.activeJobBody}>
                  <View style={[styles.jobIconCircle, { backgroundColor: COLORS.infoLight }]}>
                    <MaterialCommunityIcons
                      name={current.service_icon || 'wrench'}
                      size={24}
                      color={COLORS.info}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={styles.jobService}>{current.service_type}</Text>
                    <Text style={styles.jobCustomer}>{current.customer_name}</Text>
                    <View style={styles.jobLocRow}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.jobLoc} numberOfLines={1}>
                        {current.address}
                      </Text>
                      {!!formatDistance(current.distance_km) && (
                        <Text style={styles.jobDist}>· {formatDistance(current.distance_km)}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.jobAmount}>{formatRupees(current.total_amount)}</Text>
                </View>
                <View style={styles.activeJobFooter}>
                  <View style={styles.stepIndicator}>
                    <View style={[styles.stepCircle, { backgroundColor: COLORS.warning }]} />
                    <Text style={styles.stepLabel}>
                      {t(JOB_STEPS[current.current_step] ?? STATUS_LABEL[current.status] ?? 'common.unknown')}
                    </Text>
                  </View>
                  <View style={styles.tapView}>
                    <Text style={styles.tapText}>{t('worker.tapView')}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, !!current && { marginTop: SPACING.xl }]}>
          {filter === 'completed' ? t('worker.completedJobs') : filter === 'active' ? t('worker.inProgress') : t('worker.history')}
        </Text>

        {visible.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={30}
              color={COLORS.textTertiary}
            />
            <Text style={styles.emptyTitle}>{t('worker.nothingYet')}</Text>
            <Text style={styles.emptyText}>
              {filter === 'completed'
                ? t('worker.finishedListed')
                : t('worker.acceptedFinished')}
            </Text>
          </Card>
        ) : (
          visible.map((job) => {
            const done = job.status === JOB_STATUS.COMPLETED;
            return (
              <TouchableOpacity key={job.id} activeOpacity={0.85} onPress={() => openJob(job)}>
                <Card style={styles.completedCard}>
                  <View style={styles.completedRow}>
                    <View
                      style={[
                        styles.jobIconCircle,
                        {
                          backgroundColor: done ? COLORS.successLight : COLORS.primaryLight,
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={job.service_icon || 'wrench'}
                        size={20}
                        color={done ? COLORS.success : COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.md }}>
                      <Text style={styles.completedService}>{job.service_type}</Text>
                      <Text style={styles.completedCustomer}>
                        {job.customer_name} ·{' '}
                        {dayLabel(job.completed_at ?? job.requested_at)}
                        {done ? `, ${formatTime(job.completed_at)}` : ''}
                      </Text>
                    </View>
                    <View style={styles.completedRight}>
                      <Text style={styles.completedAmount}>{formatRupees(job.total_amount)}</Text>
                      <StatusBadge
                         label={done ? t('worker.completed') : t(STATUS_LABEL[job.status] ?? 'common.unknown')}
                        color={STATUS_TONE[job.status] ?? 'neutral'}
                        size="sm"
                      />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    marginTop: -2,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    ...SHADOWS.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  activeJobCard: {
    borderWidth: 1,
    borderColor: COLORS.warningLight,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  jobTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  activeJobBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobService: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  jobCustomer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  jobLoc: {
    flexShrink: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  jobDist: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginLeft: 4,
  },
  jobAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textSuccess,
  },
  activeJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  stepLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  tapView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    marginRight: 4,
  },
  completedCard: {
    marginBottom: SPACING.sm,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedService: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  completedCustomer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  completedRight: {
    alignItems: 'flex-end',
  },
  completedAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
  },
});

export default JobsScreen;
