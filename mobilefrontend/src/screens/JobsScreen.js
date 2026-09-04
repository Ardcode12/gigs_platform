import React from 'react';
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
import StatusBadge from '../components/StatusBadge';
import { TODAYS_JOBS, CURRENT_JOB } from '../data/mockData';

const JobsScreen = ({ navigation }) => {
  const serviceIcons = {
    'Fan Repair': 'fan',
    'Wiring': 'lightning-bolt',
    'Plumbing': 'water-pump',
    'Electrical Repair': 'lightning-bolt',
  };

  const allJobs = [
    {
      id: CURRENT_JOB.id,
      service: CURRENT_JOB.serviceType,
      customer: CURRENT_JOB.customer.name,
      amount: CURRENT_JOB.totalAmount,
      status: 'in-progress',
      time: '2:15 PM',
      location: 'Banjara Hills',
    },
    ...TODAYS_JOBS.filter(j => j.id !== CURRENT_JOB.id).map(j => ({
      ...j,
      location: 'Hyderabad',
    })),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialCommunityIcons name="filter-variant" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>1</Text>
          <Text style={styles.statText}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>2</Text>
          <Text style={styles.statText}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statText}>Total</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Job Section */}
        <Text style={styles.sectionTitle}>Active Job</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('HomeTab', { screen: 'CurrentJob' })}
        >
          <Card style={styles.activeJobCard}>
            <View style={styles.activeJobHeader}>
              <StatusBadge label="IN PROGRESS" color="warning" size="sm" />
              <Text style={styles.jobTime}>2:15 PM</Text>
            </View>
            <View style={styles.activeJobBody}>
              <View style={[styles.jobIconCircle, { backgroundColor: COLORS.infoLight }]}>
                <MaterialCommunityIcons name="water-pump" size={24} color={COLORS.info} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.jobService}>{CURRENT_JOB.serviceType}</Text>
                <Text style={styles.jobCustomer}>{CURRENT_JOB.customer.name}</Text>
                <View style={styles.jobLocRow}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.jobLoc}>Banjara Hills</Text>
                  <Text style={styles.jobDist}>· {CURRENT_JOB.location.distance}</Text>
                </View>
              </View>
              <Text style={styles.jobAmount}>₹{CURRENT_JOB.totalAmount}</Text>
            </View>
            <View style={styles.activeJobFooter}>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepCircle, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.stepLabel}>Arrived</Text>
              </View>
              <View style={styles.tapView}>
                <Text style={styles.tapText}>Tap to view</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Completed Jobs */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Today's Completed</Text>

        {TODAYS_JOBS.filter(j => j.status === 'completed').map((job) => (
          <Card key={job.id} style={styles.completedCard}>
            <View style={styles.completedRow}>
              <View style={[styles.jobIconCircle, { backgroundColor: COLORS.successLight, width: 44, height: 44, borderRadius: 22 }]}>
                <MaterialCommunityIcons
                  name={serviceIcons[job.service] || 'wrench'}
                  size={20}
                  color={COLORS.success}
                />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.completedService}>{job.service}</Text>
                <Text style={styles.completedCustomer}>{job.customer} · {job.time}</Text>
              </View>
              <View style={styles.completedRight}>
                <Text style={styles.completedAmount}>₹{job.amount}</Text>
                <StatusBadge label="Done" color="success" size="sm" />
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
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
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
});

export default JobsScreen;
