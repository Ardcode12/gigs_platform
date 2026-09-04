import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Avatar from '../components/Avatar';
import RatingStars from '../components/RatingStars';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import useApi from '../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../context/SocketContext';
import { getJob, acceptJob, rejectJob } from '../api/jobs';
import { requestCall } from '../api/chat';
import { formatRupees, formatDistance, formatEta, timeAgo } from '../utils/format';
import { JOB_STATUS, STATUS_LABEL, STATUS_TONE } from '../constants/jobSteps';

/**
 * Spec #3, #7 and #9 in one screen.
 *
 * For a `requested` job this is the offer — accept or reject at the bottom. For
 * any other status the same layout is the read-only job detail view, so there is
 * one place that renders a job and it always looks the same.
 */
const NewJobRequestScreen = () => {
  const navigation = useNavigation();
  const { jobId } = useRoute().params ?? {};
  const [acting, setActing] = useState(null); // 'accept' | 'reject' | 'call'

  const request = useApi(useCallback(() => getJob(jobId), [jobId]), [jobId]);

  useSocketEvent([WS_EVENTS.JOB_UPDATE, WS_EVENTS.EXTRA_AMOUNT_DECISION], (event) => {
    if (event.payload?.job_id === jobId) request.refetch();
  });

  const job = request.data;
  const isOffer = job?.status === JOB_STATUS.REQUESTED;

  const handleAccept = async () => {
    setActing('accept');
    try {
      await acceptJob(jobId);
      navigation.replace('CurrentJob', { jobId });
    } catch (error) {
      // 409 here means another worker claimed it first — worth saying plainly.
      Alert.alert('Could not accept', error.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setActing(null);
    }
  };

  const confirmReject = () => {
    Alert.alert(
      'Reject this job?',
      'It will be removed from your requests.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: doReject },
      ],
      { cancelable: true },
    );
  };

  const doReject = async () => {
    setActing('reject');
    try {
      await rejectJob(jobId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not reject', error.message);
    } finally {
      setActing(null);
    }
  };

  const handleRequestCall = async () => {
    setActing('call');
    try {
      await requestCall(jobId);
      Alert.alert(
        'Call requested',
        'The customer has been asked to call you. Your number stays private — the app never shares either side’s number.',
      );
    } catch (error) {
      Alert.alert('Could not send the request', error.message);
    } finally {
      setActing(null);
    }
  };

  if (request.loading && !job) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoadingState message="Loading job…" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState
          tone="error"
          title="Couldn't load this job"
          message={request.error?.message}
          actionLabel="Try again"
          onAction={request.reload}
        />
      </View>
    );
  }

  const distance = formatDistance(job.location.distance_km);
  const eta = formatEta(job.location.eta_min);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isOffer ? 'New Job Request' : 'Job Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={request.refreshing}
            onRefresh={request.refetch}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Service Type */}
        <View style={styles.serviceTypeRow}>
          <View style={styles.serviceIconWrap}>
            <MaterialCommunityIcons
              name={job.service_icon || 'wrench'}
              size={28}
              color={COLORS.primary}
            />
          </View>
          <View style={{ marginLeft: SPACING.md, flex: 1 }}>
            <Text style={styles.serviceType}>{job.service_type}</Text>
            <Text style={styles.requestTime}>Requested {timeAgo(job.requested_at)}</Text>
          </View>
          {!isOffer && (
            <StatusBadge
              label={STATUS_LABEL[job.status] ?? job.status}
              color={STATUS_TONE[job.status] ?? 'neutral'}
            />
          )}
        </View>

        {/* Customer Info */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="account" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Customer</Text>
          </View>
          <View style={styles.customerRow}>
            <Avatar name={job.customer.name} uri={job.customer.photo_url} size={48} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                <RatingStars
                  rating={job.customer.rating_avg}
                  size={16}
                  showValue
                  showCount
                  count={job.customer.rating_count}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Work details (spec #3) */}
        {!!job.work_details && (
          <Card style={styles.card}>
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={18}
                color={COLORS.textSecondary}
              />
              <Text style={styles.sectionLabelText}>Work Details</Text>
            </View>
            <Text style={styles.workDetails}>{job.work_details}</Text>
          </Card>
        )}

        {/* Location */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Service Location</Text>
          </View>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          {!!job.location.landmark && (
            <Text style={styles.locationLandmark}>{job.location.landmark}</Text>
          )}

          {/* Tapping opens the real map (spec #4) */}
          <TouchableOpacity
            style={styles.mapPreview}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('JobLocation', { jobId })}
          >
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="map" size={40} color={COLORS.primary} />
              <Text style={styles.mapText}>Open map & navigate</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.distanceRow}>
            <View style={styles.distanceItem}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.distanceValue}>{distance ?? '—'}</Text>
              <Text style={styles.distanceLabel}>Distance</Text>
            </View>
            <View style={styles.distanceDivider} />
            <View style={styles.distanceItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.distanceValue}>{eta ?? '—'}</Text>
              <Text style={styles.distanceLabel}>Est. Time</Text>
            </View>
          </View>
        </Card>

        {/* Required Services */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="wrench" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Required Services</Text>
          </View>
          {job.services.map((service) => (
            <View key={service.id} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{formatRupees(service.price)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isOffer ? 'Base Estimated Amount' : 'Base Amount'}
            </Text>
            <Text style={styles.totalValue}>{formatRupees(job.amounts.base_amount)}</Text>
          </View>
          {job.amounts.extra_amount > 0 && (
            <View style={styles.extraRow}>
              <Text style={styles.extraLabel}>Approved extra</Text>
              <Text style={styles.extraValue}>+{formatRupees(job.amounts.extra_amount)}</Text>
            </View>
          )}
          {job.amounts.extra_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatRupees(job.amounts.total_amount)}</Text>
            </View>
          )}
        </Card>

        {/* Communicate before booking (spec #5) */}
        <Card style={styles.card}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Chat', { jobId })}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <MaterialCommunityIcons name="chat-outline" size={22} color={COLORS.primary} />
                {job.unread_messages > 0 && (
                  <View style={styles.unreadDot}>
                    <Text style={styles.unreadText}>{job.unread_messages}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleRequestCall}
              disabled={acting === 'call'}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.successLight }]}>
                {acting === 'call' ? (
                  <ActivityIndicator size="small" color={COLORS.success} />
                ) : (
                  <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.success} />
                )}
              </View>
              <Text style={styles.actionLabel}>Request{'\n'}Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, isOffer && styles.actionDisabled]}
              disabled={isOffer}
              onPress={() => navigation.navigate('RequestExtraAmount', { jobId })}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: COLORS.warningLight }]}>
                <MaterialCommunityIcons name="cash-plus" size={22} color="#B45309" />
              </View>
              <Text style={styles.actionLabel}>Extra{'\n'}Amount</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.privacyNote}>
            <MaterialCommunityIcons name="shield-lock-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.privacyText}>
              Phone numbers stay hidden. Chat here, or ask the customer to call you.
            </Text>
          </View>
        </Card>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Accept / Reject (spec #7) — only while the job is still an offer */}
      {isOffer && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.rejectBtn]}
            onPress={confirmReject}
            disabled={!!acting}
            activeOpacity={0.8}
          >
            {acting === 'reject' ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.danger} />
                <Text style={styles.rejectText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.acceptBtn]}
            onPress={handleAccept}
            disabled={!!acting}
            activeOpacity={0.8}
          >
            {acting === 'accept' ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={22} color={COLORS.white} />
                <Text style={styles.acceptText}>Accept Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  serviceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceType: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  requestTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionLabelText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  workDetails: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  locationAddress: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  locationLandmark: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mapPreview: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  mapText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  distanceValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  distanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  serviceName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  servicePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  extraLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  extraValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSuccess,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  privacyText: {
    flex: 1,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.xl,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.md,
    minHeight: 56,
  },
  rejectBtn: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
    flex: 1.5,
  },
  rejectText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  acceptText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
});

export default NewJobRequestScreen;
