import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { getJobDetail, getActiveJob, cancelJob } from '../../api/jobs';
import { ONGOING_BOOKING } from '../data/customerMockData';

/**
 * Map a backend status string to a human label for the stepper subtitles.
 */
const STATUS_LABELS = {
  requested: 'Waiting for a worker to accept…',
  accepted: 'A worker has accepted your booking',
  on_the_way: 'Worker is heading to your location',
  arrived: 'Worker arrived — share OTP to begin',
  work_started: 'Service is in progress',
  completed: 'Work finished — review & pay',
  cancelled: 'This booking was cancelled',
  rejected: 'No worker available right now',
};

/**
 * Backend current_step (0-indexed over JOB_PROGRESS_STEPS which starts at
 * ACCEPTED) maps to our 5-step UI as follows:
 *   backend null/0 → UI 1  (Confirmed / Accepted)
 *   backend 1      → UI 2  (On The Way)
 *   backend 2      → UI 3  (Arrived)
 *   backend 3      → UI 4  (Work Started)
 *   backend 4      → UI 5  (Completed)
 */
const toUiStep = (backendStep) => {
  if (backendStep == null || backendStep <= 0) return 1;
  return backendStep + 1; // 1→2, 2→3, 3→4, 4→5
};

const POLL_INTERVAL_MS = 3500;

const TrackBookingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId: routeJobId, otp: routeOtp, workerData: routeWorker } = route.params ?? {};

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef(null);

  // Derive UI values from the real job, with sensible fallbacks
  const currentStep = job ? toUiStep(job.current_step) : 1;
  const otpCode = job?.otp_code || routeOtp || ONGOING_BOOKING.otpCode;
  const hasWorker = Boolean(job?.worker || routeWorker);
  const workerInfo = job?.worker
    ? {
        id: job.worker.id,
        name: job.worker.name,
        photo: job.worker.photo_url || ONGOING_BOOKING.worker.photo,
        trade: job.service_type ? `${job.service_type} Specialist` : 'Cooperative Technician',
        coopBranch: 'WORKMAT Cooperative Member',
        phone: job.worker.phone,
        rating: job.worker.rating_avg || 4.9,
        reviewsCount: job.worker.rating_count || 38,
      }
    : routeWorker
      ? {
          id: routeWorker.id,
          name: routeWorker.name,
          photo: routeWorker.photo,
          trade: routeWorker.trade || 'Cooperative Technician',
          coopBranch: routeWorker.coopBranch || 'WORKMAT Cooperative',
          phone: routeWorker.phone || '9876543210',
          rating: routeWorker.rating || 4.8,
          reviewsCount: routeWorker.reviewsCount || 24,
        }
      : ONGOING_BOOKING.worker;

  const serviceType = job?.service_type || ONGOING_BOOKING.serviceType;
  const jobStatus = job?.status || 'requested';
  const baseAmount = job?.amounts?.base_amount ?? ONGOING_BOOKING.pricing.baseAmount;
  const approvedExtraAmount = job?.amounts?.extra_amount ?? 0;
  const pendingExtraAmount = job?.amounts?.pending_extra_amount ?? 0;
  const totalAmount = job?.amounts?.total_amount ?? (baseAmount + approvedExtraAmount);
  const jobIdDisplay = job?.id ? `WM-${job.id}` : ONGOING_BOOKING.bookingId;
  const serviceItems = job?.services && job.services.length > 0
    ? job.services
    : ONGOING_BOOKING.items;

  // Build dynamic step descriptions from the live job
  const trackingSteps = [
    {
      id: 1,
      title: 'Booking Confirmed',
      sub: hasWorker ? `Assigned to ${workerInfo.name}` : 'Broadcasting to nearby workers…',
      icon: 'check-circle',
    },
    { id: 2, title: 'Worker On The Way', sub: STATUS_LABELS.on_the_way, icon: 'motorbike' },
    { id: 3, title: 'Worker Arrived', sub: `Share OTP ${otpCode} to start service`, icon: 'map-marker-check' },
    { id: 4, title: 'Work Started', sub: 'Inspection, repair & service in progress', icon: 'tools' },
    { id: 5, title: 'Work Completed', sub: 'Review, payment & digital receipt', icon: 'star-check' },
  ];

  /** Fetch job detail — either by explicit ID or via the active-job endpoint. */
  const fetchJob = useCallback(async () => {
    try {
      let data;
      if (routeJobId) {
        data = await getJobDetail(routeJobId);
      } else {
        data = await getActiveJob();
      }
      if (data) setJob(data);
    } catch {
      // Network blip — keep last known state
    } finally {
      setLoading(false);
    }
  }, [routeJobId]);

  // Initial fetch + poll every 3.5 s while screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchJob();
      pollRef.current = setInterval(fetchJob, POLL_INTERVAL_MS);
      return () => clearInterval(pollRef.current);
    }, [fetchJob]),
  );

  // Stop polling when job reaches a terminal state
  useEffect(() => {
    if (job && ['completed', 'cancelled', 'rejected'].includes(job.status)) {
      clearInterval(pollRef.current);
    }
  }, [job?.status]);

  const handleCallWorker = () => {
    Alert.alert(
      'Masked Secure Call',
      `Connecting to ${workerInfo.name} via WORKMAT secure relay.\nYour private phone number remains hidden.`,
      [{ text: 'Start Call' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const handleCancelBooking = () => {
    if (!job?.id) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Cancel Booking?',
      'Are you sure you want to cancel this booking? No penalty applies before service starts.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelJob(job.id);
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Cancellation Error', err.message || 'Could not cancel booking.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !job) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>Loading booking…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Booking Tracker</Text>
          <Text style={styles.headerSubtitle}>Booking #{jobIdDisplay}</Text>
        </View>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => Alert.alert('Cooperative Helpline', '24x7 Customer Support: 1800-420-COOP')}
        >
          <MaterialCommunityIcons name="lifebuoy" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Map / Live Location Section */}
        <View style={styles.mapSectionCard}>
          <View style={styles.mapCanvas}>
            {/* Grid Map Road Lines */}
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapDiagonalRoad} />

            {/* Destination Marker (Customer Home) */}
            <View style={styles.homeMarkerBox}>
              <View style={styles.homeMarkerPin}>
                <MaterialCommunityIcons name="home-account" size={18} color={COLORS.white} />
              </View>
              <Text style={styles.homeMarkerText}>Your Home</Text>
            </View>

            {/* Moving Worker Marker */}
            {hasWorker && (
              <View style={styles.workerMarkerBox}>
                <View style={styles.workerMarkerPin}>
                  <MaterialCommunityIcons name="motorbike" size={18} color={COLORS.white} />
                </View>
                <View style={styles.workerPulseCircle} />
                <Text style={styles.workerMarkerText}>{workerInfo.name ? `${workerInfo.name.split(' ')[0]}` : 'Worker'}</Text>
              </View>
            )}

            {/* Floating Live Badge */}
            <View style={styles.liveTrackingPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveTrackingPillText}>
                {jobStatus === 'requested' ? 'SEARCHING NEARBY' : 'REAL-TIME SYNC'}
              </Text>
            </View>

            {/* Floating ETA Card */}
            <View style={styles.etaFloatingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.etaTitle}>Booking Status</Text>
                <Text style={styles.etaTimeText} numberOfLines={1}>
                  {STATUS_LABELS[jobStatus] || 'Tracking…'}
                </Text>
              </View>
              <View style={styles.speedPill}>
                <Text style={styles.speedText}>
                  {jobStatus === 'requested' ? 'Matching' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start OTP Code Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpLeft}>
            <Text style={styles.otpTitle}>Start Verification OTP</Text>
            <Text style={styles.otpDesc}>
              Share this 4-digit code with the technician upon doorstep arrival to begin work.
            </Text>
          </View>
          <View style={styles.otpCodeContainer}>
            <Text style={styles.otpCodeText}>{otpCode}</Text>
          </View>
        </View>

        {/* Worker Quick Contact Card or Awaiting Match Banner */}
        {hasWorker ? (
          <View style={styles.workerCard}>
            <Image source={{ uri: workerInfo.photo }} style={styles.workerAvatar} />
            <View style={styles.workerMeta}>
              <View style={styles.workerNameRow}>
                <Text style={styles.workerName}>{workerInfo.name}</Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.workerTrade}>{workerInfo.trade}</Text>
              <View style={styles.workerRatingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#EAB308" />
                <Text style={styles.workerRatingText}>
                  {typeof workerInfo.rating === 'number' ? workerInfo.rating.toFixed(1) : '4.9'} ({workerInfo.reviewsCount} jobs)
                </Text>
              </View>
              <Text style={styles.coopBranch}>{workerInfo.coopBranch}</Text>
            </View>

            <View style={styles.contactButtonsRow}>
              <TouchableOpacity
                style={styles.circleIconButton}
                onPress={() => navigation.navigate('CustomerChat', { worker: workerInfo, jobId: job?.id })}
              >
                <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.circleIconButton, styles.callIconActive]}
                onPress={handleCallWorker}
              >
                <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.searchingCard}>
            <View style={styles.searchingIconCircle}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchingTitle}>Finding Nearby Technicians</Text>
              <Text style={styles.searchingSub}>
                Your request has been broadcasted to verified cooperative workers nearby.
              </Text>
            </View>
          </View>
        )}

        {/* Extra Amount Alert — only shown when there are pending extras */}
        {pendingExtraAmount > 0 && (
          <TouchableOpacity
            style={styles.extraAmountTriggerBanner}
            onPress={() => navigation.navigate('ExtraAmount', { jobId: job?.id })}
            activeOpacity={0.85}
          >
            <View style={styles.extraBannerIcon}>
              <MaterialCommunityIcons name="cash-plus" size={22} color="#B45309" />
            </View>
            <View style={styles.extraBannerTextWrap}>
              <Text style={styles.extraBannerTitle}>
                Extra Amount Requested: ₹{pendingExtraAmount}
              </Text>
              <Text style={styles.extraBannerSub}>
                Technician requested additional scope/parts. Tap to review & approve.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* Booked Services & Pricing Card (Taken from backend) */}
        <View style={styles.itemsCard}>
          <View style={styles.itemsHeaderRow}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.itemsCardTitle}>Booked Services & Charges</Text>
          </View>

          <View style={styles.itemsList}>
            {serviceItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.itemBullet} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          {job?.work_details ? (
            <View style={styles.workNotesBox}>
              <MaterialCommunityIcons name="text-box-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.workNotesText} numberOfLines={2}>
                Notes: {job.work_details}
              </Text>
            </View>
          ) : null}

          <View style={styles.itemsDivider} />

          {/* Pricing breakdown */}
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceBreakdownLabel}>Base Service Amount</Text>
            <Text style={styles.priceBreakdownVal}>₹{baseAmount}</Text>
          </View>
          {approvedExtraAmount > 0 && (
            <View style={styles.priceBreakdownRow}>
              <Text style={[styles.priceBreakdownLabel, { color: COLORS.success }]}>
                Approved Extra Work
              </Text>
              <Text style={[styles.priceBreakdownVal, { color: COLORS.success }]}>
                +₹{approvedExtraAmount}
              </Text>
            </View>
          )}
          <View style={[styles.priceBreakdownRow, styles.priceTotalRow]}>
            <Text style={styles.totalPriceLabel}>Total Amount Due</Text>
            <Text style={styles.totalPriceVal}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Destination / Address Card */}
        {job?.address && (
          <View style={styles.addressCard}>
            <View style={styles.addressIconWrap}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressCardTitle}>Service Location</Text>
              <Text style={styles.addressCardText}>{job.address}</Text>
              {job.landmark ? (
                <Text style={styles.addressCardLandmark}>Landmark: {job.landmark}</Text>
              ) : null}
            </View>
          </View>
        )}

        {/* 5-Step Progress Stepper */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressCardTitle}>Booking Progress</Text>
            <Text style={styles.simLink}>#{jobIdDisplay}</Text>
          </View>

          <View style={styles.stepperContainer}>
            {trackingSteps.map((step, idx) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isLast = idx === trackingSteps.length - 1;

              return (
                <View key={step.id} style={styles.stepItemRow}>
                  {/* Left Column: Icon and Line */}
                  <View style={styles.stepperIndicatorCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && styles.stepCircleCompleted,
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={step.icon}
                        size={16}
                        color={isCompleted || isCurrent ? COLORS.white : COLORS.textTertiary}
                      />
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepperLine,
                          isCompleted && styles.stepperLineCompleted,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Title and Subtitle */}
                  <View style={styles.stepContentCol}>
                    <View style={styles.stepTitleRow}>
                      <Text
                        style={[
                          styles.stepTitle,
                          (isCompleted || isCurrent) && styles.stepTitleActive,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {isCurrent && (
                        <View style={styles.currentActivePill}>
                          <Text style={styles.currentActiveText}>IN PROGRESS</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepSubtitle}>{step.sub}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Cancellation Option (Available before work starts) */}
        {['requested', 'accepted'].includes(jobStatus) && (
          <TouchableOpacity
            style={styles.cancelBookingButton}
            onPress={handleCancelBooking}
            disabled={cancelling}
            activeOpacity={0.7}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.cancelBookingText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Sticky Action for Payment */}
      {(currentStep === 5 || jobStatus === 'completed') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.paymentCTAButton}
            onPress={() => navigation.navigate('Payment', { amount: totalAmount, jobId: job?.id })}
          >
            <Text style={styles.paymentCTAText}>Work Completed • Pay ₹{totalAmount}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
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
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 80,
  },
  mapSectionCard: {
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  mapCanvas: {
    height: 220,
    backgroundColor: '#E6EFFD',
    position: 'relative',
    overflow: 'hidden',
  },
  mapRoadHorizontal: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#CBD5E1',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#94A3B8',
  },
  mapRoadVertical: {
    position: 'absolute',
    left: 120,
    top: 0,
    bottom: 0,
    width: 22,
    backgroundColor: '#CBD5E1',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#94A3B8',
  },
  mapDiagonalRoad: {
    position: 'absolute',
    top: 40,
    left: 10,
    width: 240,
    height: 16,
    backgroundColor: '#CBD5E1',
    transform: [{ rotate: '25deg' }],
  },
  homeMarkerBox: {
    position: 'absolute',
    right: 40,
    top: 60,
    alignItems: 'center',
  },
  homeMarkerPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  homeMarkerText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    ...SHADOWS.sm,
  },
  workerMarkerBox: {
    position: 'absolute',
    left: 60,
    top: 80,
    alignItems: 'center',
  },
  workerMarkerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...SHADOWS.md,
  },
  workerPulseCircle: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(27, 110, 245, 0.25)',
    top: -9,
  },
  workerMarkerText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    ...SHADOWS.sm,
  },
  liveTrackingPill: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveTrackingPillText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  etaFloatingCard: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  etaTitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  etaTimeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  speedPill: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  speedText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  otpCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  otpLeft: {
    flex: 1,
  },
  otpTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  otpDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  otpCodeContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  otpCodeText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
  },
  workerMeta: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  coopBranch: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconActive: {
    backgroundColor: COLORS.primary,
  },
  extraAmountTriggerBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  extraBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraBannerTextWrap: {
    flex: 1,
  },
  extraBannerTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
  },
  extraBannerSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  progressCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  simLink: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepperIndicatorCol: {
    alignItems: 'center',
    width: 32,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepperLine: {
    width: 2,
    height: 38,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  stepperLineCompleted: {
    backgroundColor: COLORS.success,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: SPACING.md,
    paddingBottom: 24,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  stepTitleActive: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  currentActivePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  currentActiveText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  stepSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  paymentCTAButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  paymentCTAText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  workerRatingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  searchingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  searchingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  searchingSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  itemsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  itemsCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  workNotesText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  itemsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  priceBreakdownLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceBreakdownVal: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  priceTotalRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalPriceLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalPriceVal: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCardTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  addressCardText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addressCardLandmark: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  cancelBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 6,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cancelBookingText: {
    fontSize: 13,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#DC2626',
  },
});

export default TrackBookingScreen;
