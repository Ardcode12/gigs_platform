import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { getOverview, getPayments } from '../../api/earnings';
import { formatRupees, formatDate } from '../../utils/format';
import { useT } from '../../i18n/LanguageContext';

/** A single bar of ₹0 for "today" says nothing — show the week's shape instead. */
const chartFor = (overview, tab) => (tab === 'today' ? overview.week : overview[tab]);

const todayIso = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Spec #10 — what came in today, this week, this month, and per completed job. */
const EarningsScreen = () => {
  const [activeTab, setActiveTab] = useState('today');
  const t = useT();
  const tabs = [
    { key: 'today', label: t('worker.earningsTabToday'), heroLabel: t('worker.todayEarningsHero') },
    { key: 'week', label: t('worker.earningsTabWeekly'), heroLabel: t('worker.weekEarningsHero') },
    { key: 'month', label: t('worker.earningsTabMonthly'), heroLabel: t('worker.monthEarningsHero') },
  ];

  const earnings = useApi(
    useCallback(
      () =>
        Promise.all([getOverview(), getPayments({ limit: 15 })]).then(([overview, payments]) => ({
          overview,
          payments,
        })),
      [],
    ),
    [],
  );

  // A completed job writes a payment row, so both events matter here.
  useSocketEvent([WS_EVENTS.PAYMENT_UPDATE, WS_EVENTS.JOB_UPDATE], () => earnings.refetch());

  const header = (
    <View style={styles.header}>
       <Text style={styles.headerTitle}>{t('tabs.earnings')}</Text>
    </View>
  );

  if (earnings.loading && !earnings.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {header}
        <LoadingState message={t('worker.loadingEarnings')} />
      </View>
    );
  }

  if (!earnings.data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {header}
        <EmptyState
          tone="error"
          title={t('worker.loadEarnings')}
          message={earnings.error?.message}
          actionLabel={t('common.tryAgain')}
          onAction={earnings.reload}
        />
      </View>
    );
  }

  const { overview, payments } = earnings.data;
  const active = overview[activeTab];
   const tabMeta = tabs.find((tab) => tab.key === activeTab);
  const chart = chartFor(overview, activeTab);
  const maxAmount = Math.max(1, ...chart.breakdown.map((b) => b.amount));
  const today = todayIso();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      {header}

      {/* Earnings Hero */}
      <View style={styles.heroSection}>
        {/* Tab Selector */}
        <View style={styles.tabRow}>
           {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Big Earnings Amount */}
        <View style={styles.heroAmount}>
          <Text style={styles.heroLabel}>{tabMeta.heroLabel}</Text>
          <Text style={styles.heroValue}>{formatRupees(active.total)}</Text>
          <Text style={styles.heroJobs}>
             {t(active.jobs === 1 ? 'worker.job_one' : 'worker.job_other', { count: active.jobs })} {t('worker.completed')}
             {active.pending > 0 ? ` · ${formatRupees(active.pending)} ${t('worker.awaitingPayment')}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={earnings.refreshing}
            onRefresh={earnings.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{active.jobs}</Text>
            <Text style={styles.statLabel}>{t('worker.completedJobs')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="cash-plus" size={22} color="#B45309" />
            </View>
            <Text style={styles.statValue}>{formatRupees(active.extra_earned)}</Text>
            <Text style={styles.statLabel}>{t('worker.extraEarned')}</Text>
          </Card>
        </View>

        {/* Breakdown Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {activeTab === 'month' ? t('worker.thisMonth') : t('worker.thisWeek')}
            </Text>
            <Text style={styles.chartSubtitle}>
              {activeTab === 'month' ? t('worker.weeklyBreakdown') : t('worker.dailyBreakdown')}
            </Text>
          </View>
          <View style={styles.chartBars}>
            {chart.breakdown.map((bucket) => {
              const barHeight = (bucket.amount / maxAmount) * 120;
              const isToday = bucket.day === today;
              return (
                <View key={`${bucket.label}-${bucket.day}`} style={styles.barWrap}>
                  <Text style={styles.barAmount}>
                    {bucket.amount >= 1000
                      ? `₹${(bucket.amount / 1000).toFixed(1)}k`
                      : bucket.amount > 0
                        ? `₹${Math.round(bucket.amount)}`
                        : '–'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday ? COLORS.primary : COLORS.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, isToday && styles.barDayActive]}>
                    {bucket.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Earnings Breakdown */}
        <Card style={styles.breakdownCard}>
           <Text style={styles.breakdownTitle}>{t('worker.earningsSummary')}</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.primary }]} />
               <Text style={styles.breakdownLabel}>{t('time.today')}</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatRupees(overview.today.total)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.info }]} />
               <Text style={styles.breakdownLabel}>{t('worker.thisWeek')}</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatRupees(overview.week.total)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.success }]} />
               <Text style={styles.breakdownLabel}>{t('worker.thisMonth')}</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatRupees(overview.month.total)}</Text>
          </View>

          <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.warning }]} />
               <Text style={styles.breakdownLabel}>{t('worker.extraAmountEarned')}</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.warning }]}>
              +{formatRupees(overview.month.extra_earned)}
            </Text>
          </View>
        </Card>

        {/* Per-job payments */}
        <Card style={styles.breakdownCard}>
           <Text style={styles.breakdownTitle}>{t('worker.recentPayments')}</Text>

          {payments.length === 0 ? (
            <Text style={styles.emptyText}>
               {t('worker.paymentsEmpty')}
            </Text>
          ) : (
            payments.map((payment, index) => (
              <View
                key={payment.id}
                style={[
                  styles.paymentRow,
                  index === payments.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentService}>
                     {payment.service_type ?? t('worker.job')} · {payment.customer_name ?? t('worker.customer')}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    {formatDate(payment.paid_at ?? payment.created_at)}
                    {payment.extra_amount > 0
                       ? ` · ${t('worker.includedExtra', { amount: formatRupees(payment.extra_amount) })}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>{formatRupees(payment.total_amount)}</Text>
                  <StatusBadge
                     label={payment.status === 'paid' ? t('worker.paid') : t('worker.pending')}
                    color={payment.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </View>
            ))
          )}
        </Card>

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
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  heroAmount: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONT_WEIGHT.medium,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  heroJobs: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  chartCard: {
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  chartSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 170,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
  },
  barAmount: {
    fontSize: 9,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 4,
  },
  barTrack: {
    width: 28,
    height: 120,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  barDay: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.sm,
  },
  barDayActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  breakdownCard: {
    marginBottom: SPACING.lg,
  },
  breakdownTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  breakdownLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  paymentService: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  paymentMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  paymentAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default EarningsScreen;
