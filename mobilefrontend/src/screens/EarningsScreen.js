import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import { EARNINGS } from '../data/mockData';

const EarningsScreen = () => {
  const [activeTab, setActiveTab] = useState('today');

  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'weekly':
        return { amount: EARNINGS.weekly, jobs: EARNINGS.weeklyJobs, label: 'This Week' };
      case 'monthly':
        return { amount: EARNINGS.monthly, jobs: EARNINGS.monthlyJobs, label: 'This Month' };
      default:
        return { amount: EARNINGS.today, jobs: EARNINGS.todayJobs, label: 'Today' };
    }
  };

  const activeData = getActiveData();

  // Mock daily breakdown
  const weeklyBreakdown = [
    { day: 'Mon', amount: 2100, jobs: 3 },
    { day: 'Tue', amount: 1850, jobs: 2 },
    { day: 'Wed', amount: 2400, jobs: 4 },
    { day: 'Thu', amount: 1600, jobs: 2 },
    { day: 'Fri', amount: 2300, jobs: 3 },
    { day: 'Sat', amount: 1200, jobs: 2 },
    { day: 'Sun', amount: 1000, jobs: 2 },
  ];

  const maxAmount = Math.max(...weeklyBreakdown.map(d => d.amount));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity style={styles.historyBtn}>
          <MaterialCommunityIcons name="history" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

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
          <Text style={styles.heroLabel}>{activeData.label}'s Earnings</Text>
          <Text style={styles.heroValue}>₹{activeData.amount.toLocaleString('en-IN')}</Text>
          <Text style={styles.heroJobs}>{activeData.jobs} Jobs Completed</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{EARNINGS.todayJobs + EARNINGS.weeklyJobs}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="cash-plus" size={22} color="#B45309" />
            </View>
            <Text style={styles.statValue}>₹{EARNINGS.extraEarned.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Extra Earned</Text>
          </Card>
        </View>

        {/* Weekly Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>This Week</Text>
            <Text style={styles.chartSubtitle}>Daily Breakdown</Text>
          </View>
          <View style={styles.chartBars}>
            {weeklyBreakdown.map((day, index) => {
              const barHeight = (day.amount / maxAmount) * 120;
              const isToday = index === 0;
              return (
                <View key={day.day} style={styles.barWrap}>
                  <Text style={styles.barAmount}>₹{(day.amount / 1000).toFixed(1)}k</Text>
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
                  <Text style={[styles.barDay, isToday && styles.barDayActive]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Earnings Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Earnings Summary</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.breakdownLabel}>Today</Text>
            </View>
            <Text style={styles.breakdownValue}>₹{EARNINGS.today.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.info }]} />
              <Text style={styles.breakdownLabel}>This Week</Text>
            </View>
            <Text style={styles.breakdownValue}>₹{EARNINGS.weekly.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.breakdownLabel}>This Month</Text>
            </View>
            <Text style={styles.breakdownValue}>₹{EARNINGS.monthly.toLocaleString('en-IN')}</Text>
          </View>

          <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.breakdownLabel}>Extra Amount Earned</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.warning }]}>
              +₹{EARNINGS.extraEarned.toLocaleString('en-IN')}
            </Text>
          </View>
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
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default EarningsScreen;
