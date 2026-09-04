import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { WORKER, TODAYS_JOBS, EARNINGS, NEW_JOB_REQUEST } from '../data/mockData';

const HomeScreen = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(WORKER.isAvailable);

  const pendingRequests = 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {WORKER.name.split(' ').map(n => n[0]).join('')}
              </Text>
              <View style={[styles.onlineDot, { backgroundColor: isAvailable ? COLORS.online : COLORS.offline }]} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Good Afternoon 👋</Text>
              <Text style={styles.workerName}>{WORKER.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
            {pendingRequests > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{pendingRequests}</Text>
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
                {isAvailable ? 'You are Available' : 'You are Unavailable'}
              </Text>
              <Text style={styles.availSubtext}>
                {isAvailable ? 'Ready to receive jobs' : 'Not receiving jobs'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
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
      >
        {/* New Job Requests */}
        {pendingRequests > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NewJobRequest')}
          >
            <Card style={styles.requestCard}>
              <View style={styles.requestCardInner}>
                <View style={styles.requestIconWrap}>
                  <MaterialCommunityIcons name="briefcase-clock" size={28} color={COLORS.white} />
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>New Job Requests</Text>
                  <Text style={styles.requestSubtext}>{pendingRequests} requests waiting</Text>
                </View>
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{pendingRequests}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="currency-inr" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>₹{EARNINGS.today.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{EARNINGS.todayJobs}</Text>
            <Text style={styles.statLabel}>Today's Jobs</Text>
          </Card>
        </View>

        {/* Current Job Quick View */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CurrentJob')}
        >
          <Card style={styles.currentJobCard}>
            <View style={styles.currentJobHeader}>
              <StatusBadge label="IN PROGRESS" color="warning" size="sm" />
              <Text style={styles.currentJobTime}>2:15 PM</Text>
            </View>
            <View style={styles.currentJobBody}>
              <View style={[styles.serviceIconCircle, { backgroundColor: COLORS.infoLight }]}>
                <MaterialCommunityIcons name="water-pump" size={24} color={COLORS.info} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.currentJobService}>Plumbing</Text>
                <Text style={styles.currentJobCustomer}>Amit Patel</Text>
                <View style={styles.currentJobLocation}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.currentJobAddress} numberOfLines={1}>Banjara Hills, Hyderabad</Text>
                </View>
              </View>
              <View style={styles.currentJobAmount}>
                <Text style={styles.currentJobAmountText}>₹850</Text>
              </View>
            </View>
            <View style={styles.currentJobFooter}>
              <View style={styles.currentJobStep}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Arrived</Text>
              </View>
              <View style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View Details</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Today's Completed Jobs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Jobs</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {TODAYS_JOBS.map((job) => (
          <Card key={job.id} style={styles.jobItem}>
            <View style={styles.jobItemRow}>
              <View style={[
                styles.jobStatusDot,
                { backgroundColor: job.status === 'completed' ? COLORS.success : COLORS.warning }
              ]} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.jobItemService}>{job.service}</Text>
                <Text style={styles.jobItemCustomer}>{job.customer} · {job.time}</Text>
              </View>
              <View style={styles.jobItemRight}>
                <Text style={styles.jobItemAmount}>₹{job.amount}</Text>
                <StatusBadge
                  label={job.status === 'completed' ? 'Done' : 'Active'}
                  color={job.status === 'completed' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
            </View>
          </Card>
        ))}

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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  headerInfo: {
    marginLeft: SPACING.md,
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
    width: 18,
    height: 18,
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
  },
  availLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  availSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
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
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  requestSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
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
