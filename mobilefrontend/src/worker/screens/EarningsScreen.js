import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import { EARNINGS } from '../data/workerMockData';

const EarningsScreen = () => {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'weekly':
        return { amount: EARNINGS.weekly, jobs: EARNINGS.weeklyJobs, label: 'Weekly Earnings' };
      case 'monthly':
        return { amount: EARNINGS.monthly, jobs: EARNINGS.monthlyJobs, label: 'Monthly Earnings' };
      default:
        return { amount: EARNINGS.today, jobs: EARNINGS.todayJobs, label: "Today's Earnings" };
    }
  };

  const activeData = getActiveData();

  const weeklyBreakdown = [
    { day: 'Mon', amount: 2100, jobs: 3 },
    { day: 'Tue', amount: 1850, jobs: 2 },
    { day: 'Wed', amount: 2400, jobs: 4 },
    { day: 'Thu', amount: 1600, jobs: 2 },
    { day: 'Fri', amount: 2300, jobs: 3 },
    { day: 'Sat', amount: 1200, jobs: 2 },
    { day: 'Sun', amount: 1000, jobs: 2 },
  ];

  const maxAmount = Math.max(...weeklyBreakdown.map((d) => d.amount));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Earnings Dashboard</Text>
          <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="history" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Standardized Tab Selector (48px Touch Targets) */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Big Earnings Display */}
        <View style={styles.heroAmountBox}>
          <Text style={styles.heroSubtitle}>{activeData.label}</Text>
          <Text style={styles.heroAmountValue}>
            ₹{activeData.amount.toLocaleString('en-IN')}
          </Text>
          <View style={styles.jobsPill}>
            <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
            <Text style={styles.jobsPillText}>{activeData.jobs} Jobs Completed</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrapSuccess}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statVal}>₹{activeData.amount}</Text>
            <Text style={styles.statLbl}>Net Payout</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconWrapPrimary}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statVal}>{activeData.jobs}</Text>
            <Text style={styles.statLbl}>Jobs Completed</Text>
          </Card>
        </View>

        {/* Weekly Trend Bar Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Daily Earnings (This Week)</Text>
            <Text style={styles.chartSub}>Total: ₹12,450</Text>
          </View>

          <View style={styles.chartContainer}>
            {weeklyBreakdown.map((item, index) => {
              const barHeight = Math.round((item.amount / maxAmount) * 110);
              const isToday = item.day === 'Wed';

              return (
                <View key={index} style={styles.barCol}>
                  <Text style={styles.barAmtText}>₹{Math.round(item.amount / 1000)}k</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: barHeight },
                        isToday && styles.barFillToday,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayText, isToday && styles.barDayToday]}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Direct Bank Transfer Assurance */}
        <Card style={styles.payoutNoticeCard}>
          <View style={styles.payoutNoticeRow}>
            <MaterialCommunityIcons name="bank-check" size={24} color={COLORS.primary} />
            <View style={styles.payoutNoticeMeta}>
              <Text style={styles.payoutNoticeTitle}>Direct Cooperative Bank Transfer</Text>
              <Text style={styles.payoutNoticeSub}>
                100% of earnings are deposited daily with 0% platform fee.
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
  },
  historyBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.85)',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  heroAmountBox: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: FONT_WEIGHT.medium,
  },
  heroAmountValue: {
    fontSize: 38,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
    marginVertical: 4,
  },
  jobsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  jobsPillText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
  },
  statIconWrapSuccess: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statIconWrapPrimary: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statVal: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  chartSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: SPACING.sm,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barAmtText: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 110,
    justifyContent: 'flex-end',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
  },
  barFillToday: {
    backgroundColor: COLORS.primary,
  },
  barDayText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  barDayToday: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  payoutNoticeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    marginBottom: SPACING.md,
  },
  payoutNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  payoutNoticeMeta: {
    flex: 1,
  },
  payoutNoticeTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  payoutNoticeSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default EarningsScreen;
