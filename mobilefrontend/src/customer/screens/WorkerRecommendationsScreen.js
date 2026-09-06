import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { getRecommendedWorkers } from '../../api/jobs';
import useLocation from '../../hooks/useLocation';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80';

const WorkerRecommendationsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const t = useT();
  const {
    category: rawCategory,
    service_type: rawServiceType,
    estimatedAmount: rawAmount,
    requirements: rawReq,
    serviceBundle,
  } = route.params ?? {};

  let bundleCategory = serviceBundle?.category || serviceBundle?.service_type;
  if (!bundleCategory && serviceBundle?.detectedCategoryKey) {
    const key = String(serviceBundle.detectedCategoryKey).toLowerCase();
    if (key.includes('plumb')) bundleCategory = 'Plumbing';
    else if (key.includes('electr')) bundleCategory = 'Electrical';
    else if (key.includes('carpent')) bundleCategory = 'Carpentry';
    else if (key.includes('clean')) bundleCategory = 'Cleaning';
    else if (key.includes('paint')) bundleCategory = 'Painting';
  }

  const category = rawCategory || bundleCategory || 'Plumbing';
  const service_type = rawServiceType || bundleCategory || category;
  const estimatedAmount = rawAmount ?? (serviceBundle?.baseEstimatedTotal || 450);
  const requirements = rawReq || serviceBundle?.userInput || '';

  const { coords, request: requestLocation, loading: locating } = useLocation({ reportToServer: false });
  const [workersList, setWorkersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Request customer GPS on screen load
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch real-time worker recommendations
  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        service_type: service_type || category || 'Plumbing',
      };
      if (coords?.latitude && coords?.longitude) {
        params.lat = coords.latitude;
        params.lng = coords.longitude;
      }

      if (activeFilter === 'Available Now') {
        params.only_available = true;
      } else if (activeFilter === 'Highest Rated') {
        params.sort_by = 'rating';
      } else if (activeFilter === 'Nearest (under 2 km)') {
        params.sort_by = 'distance';
        params.radius_km = 2.0;
      }

      const res = await getRecommendedWorkers(params);
      setWorkersList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Failed to load recommended workers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service_type, category, coords, activeFilter]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const onRefresh = () => {
    setRefreshing(true);
    requestLocation().finally(() => fetchWorkers());
  };

  const handleSelectWorker = (worker) => {
    navigation.navigate('WorkerProfile', {
      worker,
      service_type: service_type || category,
      estimatedAmount,
    });
  };

  const handleBookWorker = (worker) => {
    navigation.navigate('ConfirmBooking', {
      worker,
      service_type: service_type || category,
      estimatedAmount,
      serviceBundle,
    });
  };

  const handleBroadcastBooking = () => {
    navigation.navigate('ConfirmBooking', {
      worker: { id: null, name: 'Auto-Assign Nearest Worker', rating_avg: 5.0, rating_count: 1 },
      service_type: service_type || category,
      estimatedAmount,
      serviceBundle,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t('customer.recommendedWorkers') || 'Recommended Workers'}</Text>
          <Text style={styles.headerSubtitle}>
            {service_type || category} {coords ? '• Live GPS Active' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.filterIconButton} onPress={onRefresh}>
          <MaterialCommunityIcons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Service Requirement Summary Pill */}
        <View style={styles.serviceSummaryBar}>
          <View style={styles.summaryBarIcon}>
            <MaterialCommunityIcons name="flash" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.summaryBarTextWrapper}>
            <Text style={styles.summaryBarTitle}>{service_type || category} Specialist</Text>
            <Text style={styles.summaryBarSubtitle}>
              {requirements || 'Verified Co-op technicians nearby with live tracking'}
            </Text>
          </View>
          <View style={styles.summaryBarPriceTag}>
            <Text style={styles.summaryBarPrice}>₹{estimatedAmount}</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {[
            ['All', 'customer.filterAll'],
            ['Available Now', 'customer.availableNow'],
            ['Highest Rated', 'customer.highestRated'],
            ['Nearest (under 2 km)', 'customer.nearest'],
          ].map(([filter, key]) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {t(key) || filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.countRow}>
          <Text style={styles.sectionNotice}>
            {loading ? 'Finding nearby workers…' : `${workersList.length} verified workers found`}
          </Text>
          {coords && (
            <View style={styles.gpsIndicator}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color={COLORS.success} />
              <Text style={styles.gpsText}>GPS Located</Text>
            </View>
          )}
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Locating nearest available workers…</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && workersList.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No specific workers found</Text>
            <Text style={styles.emptySubtitle}>
              You can broadcast your booking to all available {service_type || category} workers in your area.
            </Text>
            <TouchableOpacity style={styles.broadcastButton} onPress={handleBroadcastBooking}>
              <MaterialCommunityIcons name="broadcast" size={18} color={COLORS.white} />
              <Text style={styles.broadcastButtonText}>Broadcast Request to Area</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Worker Cards List */}
        {!loading &&
          workersList.map((worker) => {
            const distanceDisplay =
              worker.distance_km != null ? `${worker.distance_km} km away` : 'Nearby';
            const etaDisplay =
              worker.eta_minutes != null ? `~${worker.eta_minutes} min arrival` : 'Available for dispatch';

            return (
              <View key={String(worker.id)} style={styles.workerCard}>
                {/* Card Top: Photo, Badge, Name, Rating, Exp */}
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: worker.photo_url || DEFAULT_AVATAR }} style={styles.workerPhoto} />
                    {worker.is_available && <View style={styles.onlineBadge} />}
                  </View>

                  <View style={styles.workerMainInfo}>
                    <View style={styles.badgeRow}>
                      <View style={styles.coopBadgePill}>
                        <MaterialCommunityIcons name="shield-check" size={12} color={COLORS.success} />
                        <Text style={styles.coopBadgeText}>Verified Co-op</Text>
                      </View>
                      <View style={styles.distanceBadge}>
                        <MaterialCommunityIcons name="map-marker-distance" size={12} color={COLORS.primary} />
                        <Text style={styles.distanceText}>{distanceDisplay}</Text>
                      </View>
                    </View>

                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerTrade}>{worker.skills?.join(', ') || 'Professional'}</Text>

                    <View style={styles.statsRow}>
                      <View style={styles.ratingBox}>
                        <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingNumber}>{(worker.rating_avg || 5.0).toFixed(1)}</Text>
                        <Text style={styles.reviewsCount}>({worker.rating_count || 1})</Text>
                      </View>

                      <Text style={styles.statDot}>•</Text>
                      <Text style={styles.jobsDoneText}>{worker.completed_jobs || 0} jobs done</Text>

                      <Text style={styles.statDot}>•</Text>
                      <Text style={styles.codeText}>{worker.worker_code}</Text>
                    </View>
                  </View>
                </View>

                {/* Live Distance & ETA Banner */}
                <View style={styles.availabilityRow}>
                  <MaterialCommunityIcons name="clock-fast" size={14} color={COLORS.primary} />
                  <Text style={styles.availabilityText}>{etaDisplay}</Text>
                  {worker.is_available ? (
                    <View style={styles.statusPillOnline}>
                      <Text style={styles.statusPillTextOnline}>Online</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPillOffline}>
                      <Text style={styles.statusPillTextOffline}>Offline</Text>
                    </View>
                  )}
                </View>

                {/* Skills Pills */}
                <View style={styles.skillsRow}>
                  {(worker.skills || []).slice(0, 3).map((skill, idx) => (
                    <View key={`skill-${idx}-${skill}`} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                  {(worker.skills || []).length > 3 && (
                    <View style={styles.skillMorePill}>
                      <Text style={styles.skillMoreText}>+{worker.skills.length - 3}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardDivider} />

                {/* Card Footer: Amount and Actions */}
                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={styles.amountLabel}>Standard Rate</Text>
                    <Text style={styles.amountValue}>₹{estimatedAmount}</Text>
                  </View>

                  <View style={styles.actionButtonsGroup}>
                    <TouchableOpacity
                      style={styles.bookNowButton}
                      onPress={() => handleBookWorker(worker)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bookNowText}>Book Worker</Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
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
  headerTitleWrap: {
    flex: 1,
    marginLeft: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
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
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionNotice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  gpsText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: 3,
  },
  loadingBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.sm,
    lineHeight: 18,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  broadcastButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: 13,
    marginLeft: 6,
  },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  workerPhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surface,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
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
    marginBottom: 2,
  },
  coopBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  coopBadgeText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
    marginLeft: 2,
  },
  workerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  reviewsCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginLeft: 1,
  },
  statDot: {
    marginHorizontal: 4,
    color: COLORS.textTertiary,
  },
  jobsDoneText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  codeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  availabilityText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: 4,
    flex: 1,
  },
  statusPillOnline: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusPillTextOnline: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.bold,
  },
  statusPillOffline: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusPillTextOffline: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: 4,
  },
  skillPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  skillPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  skillMorePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  skillMoreText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginRight: 2,
  },
});

export default WorkerRecommendationsScreen;
