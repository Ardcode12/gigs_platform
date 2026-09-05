import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../api/jobs';
import {
  RECOMMENDED_WORKERS,
  CUSTOMER_PROFILE,
  AI_DETECTION_SAMPLE,
} from '../data/customerMockData';

const ConfirmBookingScreen = () => {
  const navigation = useNavigation();
  const { customer } = useAuth();
  const { worker = RECOMMENDED_WORKERS[0], hasExtra = false } = useRoute().params ?? {};
  const baseAmount = 650;
  const extraAmount = hasExtra ? 100 : 0;
  const finalAmount = baseAmount + extraAmount;

  const [serviceTime, setServiceTime] = useState('Today, 3:45 PM - 4:45 PM');
  const [submitting, setSubmitting] = useState(false);

  // Use real customer address if available, else fall back to mock
  const address = customer?.saved_addresses?.[0]
    ? {
        type: customer.saved_addresses[0].title,
        address: customer.saved_addresses[0].address,
        landmark: customer.saved_addresses[0].landmark,
        lat: customer.saved_addresses[0].lat,
        lng: customer.saved_addresses[0].lng,
      }
    : { ...CUSTOMER_PROFILE.savedAddresses[0], lat: 12.9279, lng: 77.6751, landmark: 'Near Green Glen Park Gate 2' };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        service_type: AI_DETECTION_SAMPLE.detectedCategory,
        service_icon: 'flash',
        work_details: AI_DETECTION_SAMPLE.userInput,
        address: address.address,
        landmark: address.landmark || null,
        lat: address.lat,
        lng: address.lng,
        base_amount: finalAmount,
        services: AI_DETECTION_SAMPLE.detectedServices.map((s) => ({
          name: s.name,
          price: s.totalPrice,
        })),
        // Only send a preferred worker if the ID is a real backend integer
        preferred_worker_id: typeof worker.id === 'number' ? worker.id : null,
      };

      const job = await createJob(payload);

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your service has been confirmed. OTP for starting service is ${job.otp_code}.`,
        [
          {
            text: 'Track Booking Live',
            onPress: () =>
              navigation.navigate('TrackBooking', {
                jobId: job.id,
                otp: job.otp_code,
                workerData: worker,
              }),
          },
        ],
      );
    } catch (err) {
      Alert.alert('Booking Failed', err.message || 'Could not create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking?',
      'Are you sure you want to cancel? No cancellation fee applies.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Selected Worker Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Selected Cooperative Worker</Text>
          <View style={styles.workerRow}>
            <Image source={{ uri: worker.photo }} style={styles.workerPhoto} />
            <View style={styles.workerMeta}>
              <View style={styles.workerBadgeRow}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.workerTrade}>{worker.trade}</Text>
              <View style={styles.workerRatingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.workerRatingText}>{worker.rating} • {worker.distance}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeWorkerButton}
              onPress={() => navigation.navigate('WorkerRecommendations')}
            >
              <Text style={styles.changeWorkerText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Location */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Service Location</Text>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIconBox}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.locationTextWrapper}>
              <Text style={styles.locationTypeBadge}>{address.type}</Text>
              <Text style={styles.locationAddressText}>{address.address}</Text>
              <Text style={styles.landmarkText}>Near Green Glen Park Gate 2</Text>
            </View>
          </View>
        </View>

        {/* Required Services List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Required Services</Text>
          <View style={styles.servicesList}>
            {AI_DETECTION_SAMPLE.detectedServices.map((srv) => (
              <View key={srv.id} style={styles.serviceItemRow}>
                <MaterialCommunityIcons name={srv.icon} size={18} color={COLORS.primary} />
                <View style={styles.serviceItemInfo}>
                  <Text style={styles.serviceItemName}>{srv.name}</Text>
                  <Text style={styles.serviceItemQty}>Qty: {srv.quantity}</Text>
                </View>
                <Text style={styles.serviceItemPrice}>₹{srv.totalPrice}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Service Time */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Service Time</Text>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color={COLORS.success} />
          </View>

          <View style={styles.timeSlotBox}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color={COLORS.primary} />
            <Text style={styles.timeSlotText}>{serviceTime}</Text>
          </View>
        </View>

        {/* Amount Breakdown Card: Base Amount, Extra Amount, Final Amount */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Amount</Text>
            <Text style={styles.priceVal}>₹{baseAmount}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.extraLabelWrapper}>
              <Text style={styles.priceLabel}>Extra Amount</Text>
              {hasExtra && (
                <View style={styles.extraBadge}>
                  <Text style={styles.extraBadgeText}>Approved</Text>
                </View>
              )}
            </View>
            <Text style={[styles.priceVal, hasExtra && { color: '#B45309', fontWeight: FONT_WEIGHT.bold }]}>
              ₹{extraAmount}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Convenience Fee</Text>
            <Text style={[styles.priceVal, { color: COLORS.success }]}>₹0 (Cooperative)</Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.finalTotalRow}>
            <View>
              <Text style={styles.finalAmountLabel}>Final Amount</Text>
              <Text style={styles.finalAmountSub}>Payable digitally or cash after service</Text>
            </View>
            <Text style={styles.finalAmountVal}>₹{finalAmount}</Text>
          </View>
        </View>

        {/* Action Buttons: Cancel and Confirm Booking */}
        <View style={styles.footerButtonsContainer}>
          <TouchableOpacity
            style={styles.cancelBookingButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBookingText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBookingButton, submitting && { opacity: 0.7 }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.confirmBookingText}>Confirm Booking</Text>
                <MaterialCommunityIcons name="check-bold" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  workerPhoto: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    marginRight: SPACING.md,
  },
  workerMeta: {
    flex: 1,
  },
  workerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  workerRatingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  changeWorkerButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  changeWorkerText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationTypeBadge: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  locationAddressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  landmarkText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  servicesList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  serviceItemInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  serviceItemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  serviceItemQty: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  serviceItemPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  timeSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeSlotText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  extraLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  extraBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  extraBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: '#B45309',
  },
  priceVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalAmountLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  finalAmountSub: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  finalAmountVal: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cancelBookingButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  cancelBookingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  confirmBookingButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.md,
  },
  confirmBookingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default ConfirmBookingScreen;
