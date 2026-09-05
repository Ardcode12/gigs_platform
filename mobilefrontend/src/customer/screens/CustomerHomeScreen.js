import React, { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
import { useT } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getActiveJob } from '../../api/jobs';
import {
  SERVICE_CATEGORIES,
  POPULAR_SERVICES,
  CUSTOMER_PROFILE,
} from '../data/customerMockData';

const STATUS_DISPLAY = {
  requested: { label: 'Booking Requested', icon: 'clock-outline' },
  accepted: { label: 'Worker Assigned', icon: 'check-circle' },
  on_the_way: { label: 'Worker On The Way', icon: 'motorbike' },
  arrived: { label: 'Worker Arrived', icon: 'map-marker-check' },
  work_started: { label: 'Work In Progress', icon: 'tools' },
};

const CustomerHomeScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const defaultAddress = CUSTOMER_PROFILE.savedAddresses.find((a) => a.isDefault) || CUSTOMER_PROFILE.savedAddresses[0];
  const { customer } = useAuth();
  const [activeJob, setActiveJob] = useState(null);

  // Fetch active job every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const data = await getActiveJob();
          if (!cancelled) setActiveJob(data);
        } catch {
          // API unreachable — keep null
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const addressTitle = customer?.saved_addresses?.[0]?.title || 'Location';
  const addressText =
    customer?.saved_addresses?.[0]?.address ||
    (customer?.city ? `${customer.city}, India` : 'Set your location');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top Header with Location Selector and Notifications Icon */}
        <View style={styles.headerRow}>
          <View style={styles.locationContainer}>
            <View style={styles.locationPinCircle}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.locationTextWrapper}>
              <View style={styles.locationTitleRow}>
                <Text style={styles.locationType}>{addressTitle}</Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {addressText}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.textPrimary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Cooperative Trust Banner */}
        <View style={styles.coopBanner}>
          <View style={styles.coopBannerLeft}>
            <View style={styles.coopBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.white} />
              <Text style={styles.coopBadgeText}>{t('customer.cooperative')}</Text>
            </View>
            <Text style={styles.coopBannerTitle}>{t('customer.directSkilled')}</Text>
            <Text style={styles.coopBannerSub}>{t('customer.fairWages')}</Text>
          </View>
          <View style={styles.coopSavingsBadge}>
            <Text style={styles.savingsPercent}>₹0</Text>
            <Text style={styles.savingsLabel}>{t('customer.platformFee')}</Text>
          </View>
        </View>

        {/* Search Service Bar (Natural requirement trigger) */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('SearchService')}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.primary} />
          <View style={styles.searchPlaceholderWrapper}>
            <Text style={styles.searchPlaceholderText}>
              {t('customer.searchPrompt')}
            </Text>
            <Text style={styles.searchNaturalHint}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={COLORS.textSecondary} />{' '}
               {t('customer.describeHint')}
            </Text>
          </View>
          <View style={styles.searchAiChip}>
            <MaterialCommunityIcons name="auto-fix" size={16} color={COLORS.white} />
            <Text style={styles.searchAiChipText}>AI</Text>
          </View>
        </TouchableOpacity>

        {/* Ongoing Booking Card — real backend data */}
        {activeJob && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('customer.ongoingBooking')}</Text>
              <View style={styles.livePulseContainer}>
                <View style={styles.liveDot} />
                <Text style={styles.liveStatusText}>{t('customer.liveTracking')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.ongoingCard}
              onPress={() => navigation.navigate('TrackBooking', { jobId: activeJob.id, otp: activeJob.otp_code })}
              activeOpacity={0.9}
            >
              <View style={styles.ongoingCardTop}>
                {activeJob.worker?.photo_url ? (
                  <Image
                    source={{ uri: activeJob.worker.photo_url }}
                    style={styles.workerAvatar}
                  />
                ) : (
                  <View style={[styles.workerAvatar, { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                    <MaterialCommunityIcons name="account" size={26} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.ongoingCardMeta}>
                  <View style={styles.ongoingStatusPill}>
                    <MaterialCommunityIcons
                      name={STATUS_DISPLAY[activeJob.status]?.icon || 'clock-outline'}
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.ongoingStatusPillText}>
                      {STATUS_DISPLAY[activeJob.status]?.label || activeJob.status}
                    </Text>
                  </View>
                  <Text style={styles.ongoingWorkerName}>
                    {activeJob.worker?.name || 'Finding Worker…'}
                  </Text>
                  <Text style={styles.ongoingServiceType}>
                    {activeJob.service_type}
                  </Text>
                </View>

                <View style={styles.etaBox}>
                  <Text style={styles.etaNumber}>#{activeJob.id}</Text>
                  <Text style={styles.etaUnit}>JOB</Text>
                </View>
              </View>

              <View style={styles.ongoingDivider} />

              <View style={styles.ongoingCardBottom}>
                <View style={styles.otpWrapper}>
                  <Text style={styles.otpLabel}>Start OTP: </Text>
                  <Text style={styles.otpValue}>{activeJob.otp_code}</Text>
                </View>

                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => navigation.navigate('TrackBooking', { jobId: activeJob.id, otp: activeJob.otp_code })}
                >
                  <Text style={styles.trackButtonText}>{t('customer.trackLive')}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Service Categories Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('customer.serviceCategories')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchService')}>
              <Text style={styles.seeAllText}>{t('customer.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('SearchService', { category: t(cat.nameKey) })}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                  <MaterialCommunityIcons name={cat.icon} size={28} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{t(cat.nameKey)}</Text>
                <Text style={styles.categoryCount} numberOfLines={1}>
                  {t('customer.nearbyWorkers', { count: cat.workerCount })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Services Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('customer.popularServices')}</Text>
            <Text style={styles.subTagline}>{t('customer.transparentRates')}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularServicesScroll}
          >
            {POPULAR_SERVICES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.popularCard}
                onPress={() => navigation.navigate('AIRequirement')}
                activeOpacity={0.85}
              >
                <View style={styles.popularIconBox}>
                  <MaterialCommunityIcons name={item.icon} size={26} color={COLORS.primary} />
                </View>
                <Text style={styles.popularName} numberOfLines={2}>
                  {t(item.nameKey)}
                </Text>
                <View style={styles.popularRatingRow}>
                  <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.popularRatingText}>{item.rating}</Text>
                  <Text style={styles.popularCategoryBadge}>• {t(item.categoryKey)}</Text>
                </View>
                <View style={styles.popularPriceRow}>
                  <Text style={styles.popularPrice}>{t('customer.fromPrice', { amount: `₹${item.price}` })}</Text>
                  <View style={styles.addPill}>
                    <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Helper Banner */}
        <TouchableOpacity
          style={styles.aiHelperBanner}
          onPress={() => navigation.navigate('AIRequirement')}
          activeOpacity={0.9}
        >
          <View style={styles.aiIconBubble}>
            <MaterialCommunityIcons name="robot" size={28} color={COLORS.white} />
          </View>
          <View style={styles.aiHelperTextWrap}>
            <Text style={styles.aiHelperTitle}>{t('customer.describePlain')}</Text>
            <Text style={styles.aiHelperDesc}>
              {t('customer.aiDescription')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  locationPinCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationType: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  locationAddress: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.sm,
  },
  notificationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    position: 'absolute',
    top: 8,
    right: 9,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  coopBanner: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  coopBannerLeft: {
    flex: 1,
  },
  coopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  coopBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  coopBannerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  coopBannerSub: {
    fontSize: FONT_SIZE.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  coopSavingsBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  savingsPercent: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.success,
  },
  savingsLabel: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.medium,
  },
  searchBar: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  searchPlaceholderWrapper: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  searchPlaceholderText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  searchNaturalHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  searchAiChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  searchAiChipText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
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
  subTagline: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  livePulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  ongoingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.md,
  },
  ongoingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
  },
  ongoingCardMeta: {
    flex: 1,
  },
  ongoingStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  ongoingStatusPillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  ongoingWorkerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ongoingServiceType: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  etaBox: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  etaNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  etaUnit: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
  },
  ongoingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  ongoingCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  otpValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  trackButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  popularServicesScroll: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  popularCard: {
    width: 155,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  popularIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  popularName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    height: 38,
  },
  popularRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  popularRatingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  popularCategoryBadge: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  popularPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  popularPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  addPill: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHelperBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    gap: SPACING.md,
  },
  aiIconBubble: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHelperTextWrap: {
    flex: 1,
  },
  aiHelperTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  aiHelperDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
});

export default CustomerHomeScreen;
