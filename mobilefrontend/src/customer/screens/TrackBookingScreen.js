import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { ONGOING_BOOKING } from '../data/customerMockData';

const TRACKING_STEPS = [
  { id: 1, title: 'Booking Confirmed', sub: 'Assigned to Ramesh Kumar', icon: 'check-circle' },
  { id: 2, title: 'Worker On The Way', sub: '1.4 km away • Arriving in 15 mins', icon: 'motorbike' },
  { id: 3, title: 'Worker Arrived', sub: 'Share OTP 4829 to start service', icon: 'map-marker-check' },
  { id: 4, title: 'Work Started', sub: 'Inspection, repair & wiring in progress', icon: 'tools' },
  { id: 5, title: 'Work Completed', sub: 'Review, payment & digital receipt', icon: 'star-check' },
];

const TrackBookingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(2); // 2: Worker On The Way
  const booking = ONGOING_BOOKING;

  const handleNextSimulationStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Payment', { amount: booking.pricing.baseAmount });
    }
  };

  const handleCallWorker = () => {
    Alert.alert(
      'Masked Call',
      `Calling ${booking.worker.name} through WORKMAT protected line.`,
      [{ text: 'Start Call' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => Alert.alert('Support', 'Connecting with Cooperative Support Agent...')}
        >
          <MaterialCommunityIcons name="lifebuoy" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Map / Live Location Section */}
        <View style={styles.mapSectionCard}>
          {/* Simulated Map Graphical Canvas */}
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
            <View style={styles.workerMarkerBox}>
              <View style={styles.workerMarkerPin}>
                <MaterialCommunityIcons name="motorbike" size={18} color={COLORS.white} />
              </View>
              <View style={styles.workerPulseCircle} />
              <Text style={styles.workerMarkerText}>Ramesh (1.4 km)</Text>
            </View>

            {/* Floating Live Badge */}
            <View style={styles.liveTrackingPill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.liveTrackingPillText}>LIVE GPS TRACKING</Text>
            </View>

            {/* Floating ETA Card */}
            <View style={styles.etaFloatingCard}>
              <View>
                <Text style={styles.etaTitle}>Estimated Arrival</Text>
                <Text style={styles.etaTimeText}>3:45 PM (in 15 mins)</Text>
              </View>
              <View style={styles.speedPill}>
                <Text style={styles.speedText}>Normal Traffic</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start OTP Code Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpLeft}>
            <Text style={styles.otpTitle}>Share Start OTP with Worker</Text>
            <Text style={styles.otpDesc}>
              Do not share OTP until the worker arrives at your doorstep.
            </Text>
          </View>
          <View style={styles.otpCodeContainer}>
            <Text style={styles.otpCodeText}>{booking.otpCode}</Text>
          </View>
        </View>

        {/* Worker Quick Contact Card */}
        <View style={styles.workerCard}>
          <Image source={{ uri: booking.worker.photo }} style={styles.workerAvatar} />
          <View style={styles.workerMeta}>
            <View style={styles.workerNameRow}>
              <Text style={styles.workerName}>{booking.worker.name}</Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.workerTrade}>{booking.worker.trade}</Text>
            <Text style={styles.coopBranch}>{booking.worker.coopBranch}</Text>
          </View>

          <View style={styles.contactButtonsRow}>
            <TouchableOpacity
              style={styles.circleIconButton}
              onPress={() => navigation.navigate('CustomerChat', { worker: booking.worker })}
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

        {/* Extra Amount Alert Trigger Link (if pending) */}
        <TouchableOpacity
          style={styles.extraAmountTriggerBanner}
          onPress={() => navigation.navigate('ExtraAmount')}
          activeOpacity={0.85}
        >
          <View style={styles.extraBannerIcon}>
            <MaterialCommunityIcons name="cash-plus" size={20} color="#B45309" />
          </View>
          <View style={styles.extraBannerTextWrap}>
            <Text style={styles.extraBannerTitle}>Extra Amount Requested (₹100)</Text>
            <Text style={styles.extraBannerSub}>Worker requested for additional wiring. Tap to review.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#B45309" />
        </TouchableOpacity>

        {/* 5-Step Progress Stepper */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressCardTitle}>Booking Progress</Text>
            <TouchableOpacity onPress={handleNextSimulationStep}>
              <Text style={styles.simLink}>
                {currentStep < 5 ? 'Advance Step (Simulate)' : 'Proceed to Payment →'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepperContainer}>
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isLast = idx === TRACKING_STEPS.length - 1;

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
      </ScrollView>

      {/* Bottom Sticky Action */}
      {currentStep === 5 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.paymentCTAButton}
            onPress={() => navigation.navigate('Payment', { amount: 650 })}
          >
            <Text style={styles.paymentCTAText}>Work Completed • Pay ₹650</Text>
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
});

export default TrackBookingScreen;
