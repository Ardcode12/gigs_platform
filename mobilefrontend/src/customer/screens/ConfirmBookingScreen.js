import React, { useState, useEffect } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { createJob } from '../../api/jobs';
import useLocation from '../../hooks/useLocation';
import {
  RECOMMENDED_WORKERS,
  CUSTOMER_PROFILE,
  AI_DETECTION_SAMPLE,
} from '../data/customerMockData';

const ConfirmBookingScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const { customer } = useAuth();
  const { coords, request: requestLocation } = useLocation({ reportToServer: false });
  const routeParams = useRoute().params ?? {};
  const {
    worker = null,
    hasExtra = false,
    service_type: rawServiceType,
    category: rawCategory,
    estimatedAmount: rawAmount,
    serviceBundle,
  } = routeParams;

  let derivedCategory = rawServiceType || rawCategory;
  if (!derivedCategory && serviceBundle) {
    derivedCategory = serviceBundle.category || serviceBundle.service_type;
    if (!derivedCategory && serviceBundle.detectedCategoryKey) {
      const key = String(serviceBundle.detectedCategoryKey).toLowerCase();
      if (key.includes('plumb')) derivedCategory = 'Plumbing';
      else if (key.includes('electr')) derivedCategory = 'Electrical';
      else if (key.includes('carpent')) derivedCategory = 'Carpentry';
      else if (key.includes('clean')) derivedCategory = 'Cleaning';
      else if (key.includes('paint')) derivedCategory = 'Painting';
    }
  }
  const service_type = derivedCategory || 'Plumbing';
  const baseAmount = rawAmount ?? (serviceBundle?.baseEstimatedTotal || 650);
  const extraAmount = hasExtra ? 100 : 0;
  const finalAmount = baseAmount + extraAmount;

  const workerIdNum = worker?.id ? Number(worker.id) : null;
  const validWorkerId = Number.isInteger(workerIdNum) && workerIdNum > 0 ? workerIdNum : null;

  const [serviceTime, setServiceTime] = useState(t('customer.serviceTimeSlot') || 'Within 45 mins');
  const [submitting, setSubmitting] = useState(false);

  // Address editing and live reverse geocoding state
  const [editingAddress, setEditingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [customLandmark, setCustomLandmark] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [tempLandmark, setTempLandmark] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);

  // Request GPS on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Reverse geocode live GPS coordinates when available
  useEffect(() => {
    if (coords?.latitude && coords?.longitude) {
      if (!selectedLat) setSelectedLat(coords.latitude);
      if (!selectedLng) setSelectedLng(coords.longitude);
      Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
        .then((results) => {
          if (results && results.length > 0) {
            const item = results[0];
            const parts = [
              item.name,
              item.street,
              item.district || item.subregion,
              item.city,
              item.postalCode,
            ].filter(Boolean);
            if (parts.length > 0) {
              setResolvedAddress(parts.join(', '));
            }
          }
        })
        .catch(() => {});
    }
  }, [coords]);

  const defaultSaved = customer?.saved_addresses?.[0];
  const activeLat = selectedLat ?? (coords?.latitude || defaultSaved?.lat || 28.6270);
  const activeLng = selectedLng ?? (coords?.longitude || defaultSaved?.lng || 77.3720);

  const displayAddress = customAddress
    ? customAddress
    : defaultSaved?.address
      ? defaultSaved.address
      : resolvedAddress
        ? resolvedAddress
        : (customer?.city ? `${customer.city}, Active Location` : 'Sector 62, Noida');

  const displayLandmark = customLandmark || defaultSaved?.landmark || (resolvedAddress ? 'GPS Location' : 'Near Current GPS Position');
  const displayType = customAddress ? 'Custom Service Address' : (defaultSaved?.title || 'Current Location');

  const handleOpenEdit = () => {
    setTempAddress(displayAddress);
    setTempLandmark(displayLandmark);
    setEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (tempAddress.trim()) {
      setCustomAddress(tempAddress.trim());
    }
    setCustomLandmark(tempLandmark.trim());
    setEditingAddress(false);
  };

  const handleUseCurrentGps = async () => {
    const fresh = await requestLocation();
    if (fresh) {
      setSelectedLat(fresh.latitude);
      setSelectedLng(fresh.longitude);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: fresh.latitude,
          longitude: fresh.longitude,
        });
        if (results && results.length > 0) {
          const item = results[0];
          const parts = [
            item.name,
            item.street,
            item.district || item.subregion,
            item.city,
            item.postalCode,
          ].filter(Boolean);
          if (parts.length > 0) {
            setTempAddress(parts.join(', '));
            setTempLandmark('Current GPS Fix');
            return;
          }
        }
      } catch {}
      setTempAddress(`GPS Location (${fresh.latitude.toFixed(4)}, ${fresh.longitude.toFixed(4)})`);
    }
  };

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const lineServices = (serviceBundle?.detectedServices && serviceBundle.detectedServices.length > 0)
        ? serviceBundle.detectedServices.map((s) => ({
            name: s.name || (s.nameKey ? t(s.nameKey) : `${service_type} Service`),
            price: s.totalPrice || s.price || Math.round(finalAmount / serviceBundle.detectedServices.length),
          }))
        : [
            {
              name: `${service_type || 'Service'} Standard Inspection & Labor`,
              price: finalAmount,
            },
          ];

      const payload = {
        service_type: service_type || 'Plumbing',
        service_icon: 'wrench',
        work_details: `Service booking for ${service_type || 'General Repair'}`,
        address: displayAddress,
        landmark: displayLandmark || null,
        lat: activeLat,
        lng: activeLng,
        base_amount: finalAmount,
        services: lineServices,
        preferred_worker_id: validWorkerId,
      };

      const job = await createJob(payload);

      Alert.alert(
        t('customer.bookingConfirmed') || 'Booking Confirmed',
        t('customer.bookingConfirmedBody', { name: worker?.name || 'Assigned Worker', otp: job.otp_code }) ||
          `Job ${job.id} created successfully. Your arrival OTP is ${job.otp_code}.`,
        [
          {
            text: t('customer.trackBooking') || 'Track Booking',
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
      Alert.alert(t('customer.bookingFailed') || 'Booking Error', err.message || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
       t('customer.cancelBooking'),
       t('customer.cancelBookingBody'),
      [
         { text: t('customer.keepBooking'), style: 'cancel' },
         { text: t('customer.yesCancel'), style: 'destructive', onPress: () => navigation.goBack() },
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
         <Text style={styles.headerTitle}>{t('customer.confirmBooking')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Selected Worker Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {validWorkerId ? (t('customer.selectedWorker') || 'Selected Worker') : 'Assignment Type'}
          </Text>
          <View style={styles.workerRow}>
            {validWorkerId ? (
              worker?.photo_url || worker?.photo ? (
                <Image source={{ uri: worker.photo_url || worker.photo }} style={styles.workerPhoto} />
              ) : (
                <View style={[styles.workerPhoto, { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name="account-hard-hat" size={28} color={COLORS.primary} />
                </View>
              )
            ) : (
              <View style={[styles.workerPhoto, { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialCommunityIcons name="broadcast" size={26} color={COLORS.primary} />
              </View>
            )}

            <View style={styles.workerMeta}>
              <View style={styles.workerBadgeRow}>
                <Text style={styles.workerName}>
                  {validWorkerId ? worker?.name : 'Nearest Available Worker'}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.workerTrade}>
                {validWorkerId
                  ? (worker?.skills?.length ? worker.skills.join(', ') : `${service_type} Specialist`)
                  : `Broadcast to verified ${service_type} workers`}
              </Text>
              <View style={styles.workerRatingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.workerRatingText}>
                  {validWorkerId ? `${worker?.rating_avg || worker?.rating || 4.9} • Live Co-op` : 'Cooperative Guaranteed'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.changeWorkerButton}
              onPress={() => navigation.navigate('WorkerRecommendations', { service_type, category: service_type, estimatedAmount: baseAmount })}
            >
              <Text style={styles.changeWorkerText}>{t('customer.change') || 'Change'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Service Location */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>{t('customer.serviceLocation')}</Text>
            <TouchableOpacity onPress={handleOpenEdit}>
               <Text style={styles.editLink}>{t('customer.edit') || 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIconBox}>
              <MaterialCommunityIcons name="map-marker-radius" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.locationTextWrapper}>
              <Text style={styles.locationTypeBadge}>{displayType}</Text>
              <Text style={styles.locationAddressText}>{displayAddress}</Text>
              {displayLandmark ? (
                <Text style={styles.landmarkText}>Landmark: {displayLandmark}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Required Services List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('customer.requiredServices')}</Text>
          <View style={styles.servicesList}>
            {(serviceBundle?.detectedServices || [
              {
                id: 'std_1',
                icon: 'wrench',
                name: `${service_type} Standard Inspection & Service`,
                quantity: 1,
                totalPrice: baseAmount,
              },
            ]).map((srv) => (
              <View key={String(srv.id)} style={styles.serviceItemRow}>
                <MaterialCommunityIcons name={srv.icon || 'wrench'} size={18} color={COLORS.primary} />
                <View style={styles.serviceItemInfo}>
                  <Text style={styles.serviceItemName}>
                    {srv.name || (srv.nameKey ? t(srv.nameKey) : `${service_type} Service`)}
                  </Text>
                  <Text style={styles.serviceItemQty}>
                    {t('customer.qty', { count: srv.quantity || 1 })}
                  </Text>
                </View>
                <Text style={styles.serviceItemPrice}>₹{srv.totalPrice || srv.price || baseAmount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Service Time */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>{t('customer.serviceTime')}</Text>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color={COLORS.success} />
          </View>

          <View style={styles.timeSlotBox}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color={COLORS.primary} />
            <Text style={styles.timeSlotText}>{serviceTime}</Text>
          </View>
        </View>

        {/* Amount Breakdown Card: Base Amount, Extra Amount, Final Amount */}
        <View style={styles.sectionCard}>
           <Text style={styles.sectionTitle}>{t('customer.paymentSummary')}</Text>
          <View style={styles.divider} />

          <View style={styles.priceRow}>
             <Text style={styles.priceLabel}>{t('customer.baseAmount')}</Text>
            <Text style={styles.priceVal}>₹{baseAmount}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.extraLabelWrapper}>
               <Text style={styles.priceLabel}>{t('customer.extraAmount')}</Text>
              {hasExtra && (
                <View style={styles.extraBadge}>
                   <Text style={styles.extraBadgeText}>{t('customer.approved')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.priceVal, hasExtra && { color: '#B45309', fontWeight: FONT_WEIGHT.bold }]}>
              ₹{extraAmount}
            </Text>
          </View>

          <View style={styles.priceRow}>
             <Text style={styles.priceLabel}>{t('customer.convenienceFee')}</Text>
             <Text style={[styles.priceVal, { color: COLORS.success }]}>₹0 ({t('customer.cooperative')})</Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.finalTotalRow}>
            <View>
               <Text style={styles.finalAmountLabel}>{t('customer.finalAmount')}</Text>
               <Text style={styles.finalAmountSub}>{t('customer.payAfterService')}</Text>
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
             <Text style={styles.cancelBookingText}>{t('customer.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBookingButton, submitting && { opacity: 0.7 }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={submitting}
          >
             <Text style={styles.confirmBookingText}>{t('customer.confirmBooking')}</Text>
            <MaterialCommunityIcons name="check-bold" size={18} color={COLORS.white} />
            {submitting && <ActivityIndicator size="small" color={COLORS.white} />}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Address Modal */}
      <Modal
        visible={editingAddress}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingAddress(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('customer.editLocation') || 'Set Service Location'}</Text>
              <TouchableOpacity onPress={() => setEditingAddress(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.gpsAutoBtn} onPress={handleUseCurrentGps} activeOpacity={0.8}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={COLORS.primary} />
              <Text style={styles.gpsAutoBtnText}>Use My Current GPS Position</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Full Address / House No / Street</Text>
            <TextInput
              style={styles.addressInput}
              value={tempAddress}
              onChangeText={setTempAddress}
              placeholder="e.g. Flat 302, Green Glen Layout, Bellandur, Bengaluru"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Landmark (Optional)</Text>
            <TextInput
              style={styles.landmarkInput}
              value={tempLandmark}
              onChangeText={setTempLandmark}
              placeholder="e.g. Near HDFC Bank, Opp. Tech Park"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingAddress(false)}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveAddress}
              >
                <Text style={styles.modalSaveText}>{t('common.save') || 'Confirm Location'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    ...SHADOWS.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
  },
  gpsAutoBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
  },
  addressInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: COLORS.background,
  },
  landmarkInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  modalSaveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default ConfirmBookingScreen;
