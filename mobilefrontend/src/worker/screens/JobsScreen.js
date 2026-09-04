import React from 'react';
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
import StatusBadge from '../components/StatusBadge';
import { TODAYS_JOBS, CURRENT_JOB } from '../data/workerMockData';

const JobsScreen = ({ navigation }) => {
  const completedJobs = TODAYS_JOBS.filter((j) => j.status === 'completed');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="filter-variant" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Standardized Quick Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>1</Text>
            <Text style={styles.statText}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{completedJobs.length}</Text>
            <Text style={styles.statText}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{1 + completedJobs.length}</Text>
            <Text style={styles.statText}>Total Today</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Job Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Job</Text>
          <StatusBadge label="IN PROGRESS" color="warning" size="sm" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CurrentJob')}
        >
          <Card style={styles.activeJobCard}>
            <View style={styles.activeJobTop}>
              <View style={styles.jobIconCircle}>
                <MaterialCommunityIcons name="water-pump" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.jobMetaWrap}>
                <Text style={styles.jobService}>{CURRENT_JOB.serviceType}</Text>
                <Text style={styles.jobCustomer}>{CURRENT_JOB.customer.name}</Text>
              </View>
              <Text style={styles.jobAmount}>₹{CURRENT_JOB.totalAmount}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {CURRENT_JOB.location.address} ({CURRENT_JOB.location.distance})
              </Text>
            </View>

            <View style={styles.activeCardFooter}>
              <View style={styles.stagePill}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
                <Text style={styles.stagePillText}>Stage: Arrived</Text>
              </View>

              <View style={styles.openDetailsLink}>
                <Text style={styles.openDetailsText}>Manage Job</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Completed Jobs Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Completed Today</Text>
          <Text style={styles.sectionSubCount}>{completedJobs.length} Jobs Done</Text>
        </View>

        {completedJobs.map((job) => (
          <Card key={job.id} style={styles.completedCard}>
            <View style={styles.completedRow}>
              <View style={styles.completedDot} />
              <View style={styles.completedDetails}>
                <Text style={styles.completedService}>{job.service}</Text>
                <Text style={styles.completedMeta}>{job.customer} • {job.time}</Text>
              </View>
              <View style={styles.completedRight}>
                <Text style={styles.completedAmount}>₹{job.amount}</Text>
                <StatusBadge label="Done" color="success" size="sm" />
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
    paddingTop: SPACING.xs,
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
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
  sectionSubCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  activeJobCard: {
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  activeJobTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobMetaWrap: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  jobService: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  jobCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  jobAmount: {
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
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  activeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  openDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  openDetailsText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  completedCard: {
    marginBottom: SPACING.sm,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  completedDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  completedService: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  completedMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  completedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  completedAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
});

export default JobsScreen;
