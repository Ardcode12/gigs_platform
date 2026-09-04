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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { WORKER, TODAYS_JOBS, EARNINGS } from '../data/workerMockData';

const HomeScreen = ({ navigation }) => {
  const [isAvailable, setIsAvailable] = useState(WORKER.isAvailable);
  const pendingRequests = 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {WORKER.name.split(' ').map((n) => n[0]).join('')}
              </Text>
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isAvailable ? COLORS.success : COLORS.offline },
                ]}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Good Afternoon 👋</Text>
              <Text style={styles.workerName}>{WORKER.name}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('JobsTab')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
            {pendingRequests > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{pendingRequests}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Large Availability Card */}
        <View
          style={[
            styles.availabilityCard,
            isAvailable ? styles.availabilityActive : styles.availabilityInactive,
          ]}
        >
          <View style={styles.availLeft}>
            <MaterialCommunityIcons
              name={isAvailable ? 'check-circle' : 'close-circle'}
              size={28}
              color={isAvailable ? COLORS.success : COLORS.offline}
            />
            <View style={styles.availTextWrap}>
              <Text style={styles.availLabel}>
                {isAvailable ? 'YOU ARE AVAILABLE' : 'YOU ARE OFFLINE'}
              </Text>
              <Text style={styles.availSubtext}>
                {isAvailable ? 'Receiving new customer requests' : 'Tap switch to start accepting jobs'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ false: COLORS.border, true: COLORS.successLight }}
            thumbColor={isAvailable ? COLORS.success : COLORS.offline}
          />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New Job Requests Alert Banner */}
        {pendingRequests > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NewJobRequest')}
            style={styles.requestBannerTouchable}
          >
            <View style={styles.requestBanner}>
              <View style={styles.requestIconWrap}>
                <MaterialCommunityIcons name="briefcase-clock" size={28} color={COLORS.white} />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestTitle}>New Job Requests</Text>
                <Text style={styles.requestSubtext}>2 customer requests waiting nearby</Text>
              </View>
              <View style={styles.requestActionPill}>
                <Text style={styles.requestActionText}>View</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Standardized Today Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrapSuccess}>
              <MaterialCommunityIcons name="currency-inr" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>₹{EARNINGS.today.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconWrapPrimary}>
              <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{EARNINGS.todayJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done Today</Text>
          </Card>
        </View>

        {/* Current Active Job Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Current Job</Text>
          <StatusBadge label="ACTIVE" color="warning" size="sm" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CurrentJob')}
        >
          <Card style={styles.currentJobCard}>
            <View style={styles.currentJobHeader}>
              <View style={styles.serviceIconCircle}>
                <MaterialCommunityIcons name="water-pump" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.currentJobMeta}>
                <Text style={styles.currentJobService}>Plumbing Repair</Text>
                <Text style={styles.currentJobCustomer}>Customer: Amit Patel</Text>
              </View>
              <Text style={styles.currentJobAmount}>₹850</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.textSecondary} />
              <Text style={styles.locationAddressText} numberOfLines={1}>
                Flat 302, Banjara Hills, Hyderabad (2.1 km)
              </Text>
            </View>

            <View style={styles.currentJobFooter}>
              <View style={styles.stepIndicatorPill}>
                <MaterialCommunityIcons name="navigation-variant" size={14} color={COLORS.primary} />
                <Text style={styles.stepIndicatorText}>Status: Arrived</Text>
              </View>

              <View style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsBtnText}>Open Job Details</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Today's Jobs List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Completed Today</Text>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation.navigate('JobsTab')}
          >
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {TODAYS_JOBS.map((job) => (
          <Card key={job.id} style={styles.jobItemCard}>
            <View style={styles.jobItemRow}>
              <View
                style={[
                  styles.jobStatusDot,
                  { backgroundColor: job.status === 'completed' ? COLORS.success : COLORS.warning },
                ]}
              />
              <View style={styles.jobItemDetails}>
                <Text style={styles.jobItemService}>{job.service}</Text>
                <Text style={styles.jobItemCustomer}>{job.customer} • {job.time}</Text>
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
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
    position: 'relative',
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  workerName: {
    color: COLORS.white,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
  availabilityCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    ...SHADOWS.sm,
  },
  availabilityActive: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  availabilityInactive: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.offline,
  },
  availLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availTextWrap: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  availLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  availSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
  },
  requestBannerTouchable: {
    marginBottom: SPACING.md,
  },
  requestBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  requestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  requestTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  requestSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  requestActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  requestActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'flex-start',
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
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  seeAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  currentJobCard: {
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  currentJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentJobMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  currentJobService: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  currentJobCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  currentJobAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationAddressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  currentJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  stepIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  stepIndicatorText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  jobItemCard: {
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
  jobItemDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  jobItemService: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  jobItemCustomer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  jobItemAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
});

export default HomeScreen;
