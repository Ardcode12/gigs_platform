import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { RECOMMENDED_WORKERS, AI_DETECTION_SAMPLE } from '../data/customerMockData';

const WorkerRecommendationsScreen = ({ navigation, route }) => {
  const [workersList] = useState(RECOMMENDED_WORKERS);
  const [activeFilter, setActiveFilter] = useState('All');

  const handleSelectWorker = (worker) => {
    navigation.navigate('WorkerProfile', { worker });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recommended Workers</Text>
        <TouchableOpacity style={styles.filterIconButton}>
          <MaterialCommunityIcons name="tune-variant" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Service Requirement Summary Pill */}
        <View style={styles.serviceSummaryBar}>
          <View style={styles.summaryBarIcon}>
            <MaterialCommunityIcons name="flash" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.summaryBarTextWrapper}>
            <Text style={styles.summaryBarTitle}>Electrical Service (3 Tasks)</Text>
            <Text style={styles.summaryBarSubtitle}>
              Fan repair, 2 lights replaced, wiring
            </Text>
          </View>
          <View style={styles.summaryBarPriceTag}>
            <Text style={styles.summaryBarPrice}>₹{AI_DETECTION_SAMPLE.baseEstimatedTotal}</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['All', 'Available Now', 'Highest Rated', 'Nearest (under 2 km)'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionNotice}>
          Showing {workersList.length} verified cooperative members matching your requirement:
        </Text>

        {/* Worker Cards List */}
        {workersList.map((worker) => (
          <View key={worker.id} style={styles.workerCard}>
            {/* Card Top: Photo, Badge, Name, Rating, Exp */}
            <View style={styles.cardTopRow}>
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
                <View style={styles.onlineBadge} />
              </View>

              <View style={styles.workerMainInfo}>
                <View style={styles.badgeRow}>
                  <View style={styles.coopBadgePill}>
                    <MaterialCommunityIcons name="shield-check" size={12} color={COLORS.success} />
                    <Text style={styles.coopBadgeText}>{worker.badge}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <MaterialCommunityIcons name="map-marker-distance" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.distanceText}>{worker.distance}</Text>
                  </View>
                </View>

                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerTrade}>{worker.trade}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.ratingBox}>
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingNumber}>{worker.rating}</Text>
                    <Text style={styles.reviewsCount}>({worker.reviewsCount})</Text>
                  </View>

                  <Text style={styles.statDot}>•</Text>
                  <Text style={styles.expText}>{worker.experience} exp</Text>

                  <Text style={styles.statDot}>•</Text>
                  <Text style={styles.jobsDoneText}>{worker.completedJobs} jobs</Text>
                </View>
              </View>
            </View>

            {/* Availability Alert */}
            <View style={styles.availabilityRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
              <Text style={styles.availabilityText}>{worker.availability}</Text>
            </View>

            {/* Skills Pills */}
            <View style={styles.skillsRow}>
              {worker.skills.slice(0, 3).map((skill, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                </View>
              ))}
              {worker.skills.length > 3 && (
                <View style={styles.skillMorePill}>
                  <Text style={styles.skillMoreText}>+{worker.skills.length - 3}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardDivider} />

            {/* Card Footer: Amount and Actions */}
            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.amountLabel}>Cooperative Standard</Text>
                <Text style={styles.amountValue}>₹{worker.estimatedAmount}</Text>
              </View>

              <View style={styles.actionButtonsGroup}>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => handleSelectWorker(worker)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookNowButton}
                  onPress={() => navigation.navigate('ConfirmBooking', { worker })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Book</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  serviceSummaryBar: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryBarIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  summaryBarTextWrapper: {
    flex: 1,
  },
  summaryBarTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  summaryBarSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  summaryBarPriceTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  summaryBarPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  sectionNotice: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  workerPhoto: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.background,
  },
  onlineBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.online,
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  workerMainInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coopBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  coopBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  workerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  reviewsCount: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  statDot: {
    marginHorizontal: 6,
    color: COLORS.border,
    fontSize: 10,
  },
  expText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  jobsDoneText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  availabilityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.md,
  },
  skillPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  skillPillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  skillMorePill: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  skillMoreText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  viewProfileButton: {
    borderWidth: 1.2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  bookNowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    ...SHADOWS.sm,
  },
  bookNowText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default WorkerRecommendationsScreen;
