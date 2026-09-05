import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import StepperProgress from '../components/StepperProgress';
import Avatar from '../../components/Avatar';
import RatingStars from '../../components/RatingStars';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { getJob, getCurrentJob, updateJobStatus } from '../../api/jobs';
import { requestCall } from '../../api/chat';
import { formatRupees, formatDistance, formatEta } from '../../utils/format';
import { JOB_STEPS, JOB_STATUS, NEXT_ACTION, STATUS_LABEL } from '../../constants/jobSteps';
import { useT } from '../../i18n/LanguageContext';

/**
 * Spec #8 — the job in progress: on the way → arrived → start work → complete.
 *
 * The button always offers exactly one transition, taken from NEXT_ACTION, and the
 * server is the one that decides whether it's legal. Nothing advances locally.
 */
const CurrentJobScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const jobId = useRoute().params?.jobId;
  const [advancing, setAdvancing] = useState(false);
  const [calling, setCalling] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(null);

  // Reached from the tab bar there is no id yet — ask the server which job is live.
  const request = useApi(
    useCallback(() => (jobId ? getJob(jobId) : getCurrentJob()), [jobId]),
    [jobId],
  );

  const job = request.data;

  useSocketEvent(
    [WS_EVENTS.JOB_UPDATE, WS_EVENTS.EXTRA_AMOUNT_DECISION, WS_EVENTS.PAYMENT_UPDATE],
    (event) => {
      if (!job || event.payload?.job_id === job.id) request.refetch();
    },
  );

  const nextAction = job ? NEXT_ACTION[job.status] : undefined;
  const isCompleted = job?.status === JOB_STATUS.COMPLETED;
  const currentStep = job?.current_step ?? 0;
  const pendingExtra = job?.extra_requests?.find((r) => r.status === 'pending');

  const submitStatus = async (code = null) => {
    if (!nextAction) return;
    setAdvancing(true);
    try {
      const updated = await updateJobStatus(job.id, nextAction.status, code);
      request.setData(updated);
      setOtp('');
      setOtpStep(null);
      if (nextAction.status === JOB_STATUS.COMPLETED) {
         Alert.alert(t('job.completedTitle'), t('job.completedBody', { amount: formatRupees(updated.amounts.total_amount) }));
      }
    } catch (error) {
      Alert.alert(t('job.updateFailed'), error.message);
    } finally {
      setAdvancing(false);
    }
  };

  const advance = () => {
    if (!nextAction || advancing) return;
    if (nextAction.status === JOB_STATUS.ARRIVED || nextAction.status === JOB_STATUS.COMPLETED) {
      setOtpStep(nextAction.status);
      return;
    }
    submitStatus();
  };

  const handleRequestCall = async () => {
    setCalling(true);
    try {
      await requestCall(job.id);
       Alert.alert(t('job.callRequested'), t('job.callRequestedBodyPrivate'));
    } catch (error) {
      Alert.alert(t('job.callRequestFailed'), error.message);
    } finally {
      setCalling(false);
    }
  };

  const chrome = (children) => (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
         <Text style={styles.headerTitle}>{t('job.currentJob')}</Text>
        <View style={{ width: 40 }} />
      </View>
      {children}
    </View>
  );

  if (request.loading && !job) return chrome(<LoadingState message={t('job.loading')} />);

  if (request.error && !job) {
    return chrome(
      <EmptyState
        tone="error"
        title={t('job.loadFailed')}
        message={request.error.message}
        actionLabel={t('common.tryAgain')}
        onAction={request.reload}
      />,
    );
  }

  if (!job) {
    return chrome(
      <EmptyState
        icon="clipboard-check-outline"
        title={t('job.none')}
        message={t('job.noneBody')}
      />,
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
         <Text style={styles.headerTitle}>{t('job.currentJob')}</Text>
        <StatusBadge
           label={t(STATUS_LABEL[job.status] ?? 'common.unknown').toUpperCase()}
          color={isCompleted ? 'success' : 'warning'}
          size="sm"
        />
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
        {/* Customer Card */}
        <Card style={styles.card}>
          <View style={styles.customerRow}>
            <Avatar name={job.customer.name} uri={job.customer.photo_url} size={52} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                <RatingStars rating={job.customer.rating_avg} size={14} showValue />
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: COLORS.primaryLight }]}
                onPress={() => navigation.navigate('Chat', { jobId: job.id })}
              >
                <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
                {job.unread_messages > 0 && <View style={styles.dot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: COLORS.successLight }]}
                onPress={handleRequestCall}
                disabled={calling}
              >
                {calling ? (
                  <ActivityIndicator size="small" color={COLORS.success} />
                ) : (
                  <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Pending extra amount (spec #6) */}
        {!!pendingExtra && (
          <Card variant="warning" style={styles.card}>
            <View style={styles.pendingRow}>
              <MaterialCommunityIcons name="clock-alert-outline" size={22} color="#B45309" />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={styles.pendingTitle}>
                  {formatRupees(pendingExtra.amount)} extra — waiting for approval
                </Text>
                <Text style={styles.pendingBody}>{pendingExtra.reason}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Location Card */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textSecondary} />
             <Text style={styles.sectionLabelText}>{t('job.serviceLocation')}</Text>
          </View>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          {!!job.location.landmark && (
            <Text style={styles.locationLandmark}>{job.location.landmark}</Text>
          )}

          <View style={styles.locationMeta}>
            <View style={styles.locationMetaItem}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.locationMetaText}>
                 {formatDistance(job.location.distance_km) ?? t('job.distanceUnknown')}
              </Text>
            </View>
            <View style={styles.locationMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
              <Text style={styles.locationMetaText}>
                {formatEta(job.location.eta_min) ?? '—'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={() => navigation.navigate('JobLocation', { jobId: job.id })}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="navigation-variant" size={22} color={COLORS.white} />
             <Text style={styles.navigateBtnText}>{t('job.mapAndNavigate')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Services & Amount */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="wrench" size={18} color={COLORS.textSecondary} />
           <Text style={styles.sectionLabelText}>{t('job.servicesAndAmount')}</Text>
          </View>
          {job.services.map((service) => (
            <View key={service.id} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{formatRupees(service.price)}</Text>
            </View>
          ))}
          <View style={styles.amountBreakdown}>
            <View style={styles.amountRow}>
               <Text style={styles.amountLabel}>{t('job.baseAmount')}</Text>
              <Text style={styles.amountValue}>{formatRupees(job.amounts.base_amount)}</Text>
            </View>
            {job.amounts.extra_amount > 0 && (
              <View style={styles.amountRow}>
                 <Text style={styles.amountLabel}>{t('job.extraAmount')}</Text>
                <Text style={[styles.amountValue, { color: COLORS.warning }]}>
                  +{formatRupees(job.amounts.extra_amount)}
                </Text>
              </View>
            )}
            {job.amounts.pending_extra_amount > 0 && (
              <View style={styles.amountRow}>
                 <Text style={styles.amountLabel}>{t('job.awaitingApproval')}</Text>
                <Text style={[styles.amountValue, { color: COLORS.textTertiary }]}>
                  {formatRupees(job.amounts.pending_extra_amount)}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.amountRow}>
               <Text style={styles.totalLabel}>{t('job.totalAmount')}</Text>
              <Text style={styles.totalValue}>{formatRupees(job.amounts.total_amount)}</Text>
            </View>
          </View>
        </Card>

        {/* Job Progress */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="progress-check" size={18} color={COLORS.textSecondary} />
                 <Text style={styles.sectionLabelText}>{t('job.progress')}</Text>
          </View>
          <StepperProgress steps={JOB_STEPS} currentStep={currentStep} />
        </Card>

        {/* The one legal next transition */}
        <TouchableOpacity
          style={[
            styles.updateStatusBtn,
            (isCompleted || !nextAction) && styles.updateStatusBtnCompleted,
          ]}
          onPress={advance}
          disabled={!nextAction || advancing}
          activeOpacity={0.8}
        >
          {advancing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={nextAction?.icon ?? 'check-circle'}
                size={24}
                color={COLORS.white}
              />
              <Text style={styles.updateStatusText}>
                 {t(nextAction?.label ?? 'job.completedLabel')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Chat', { jobId: job.id })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="chat-outline" size={24} color={COLORS.primary} />
            </View>
           <Text style={styles.quickActionLabel}>{t('job.chat')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleRequestCall}
            disabled={calling}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="phone-in-talk" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionLabel}>Request{'\n'}Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, isCompleted && styles.quickActionDisabled]}
            disabled={isCompleted}
            onPress={() => navigation.navigate('RequestExtraAmount', { jobId: job.id })}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="cash-plus" size={24} color="#B45309" />
            </View>
            <Text style={styles.quickActionLabel}>Extra{'\n'}Amount</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('ReportCustomer', { jobId: job.id })}
        >
           <Text style={styles.reportButtonText}>{t('worker.reportProblem')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={!!otpStep} transparent animationType="fade" onRequestClose={() => setOtpStep(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>
               {otpStep === JOB_STATUS.ARRIVED ? t('worker.confirmArrival') : t('worker.confirmCompleted')}
            </Text>
            <Text style={styles.otpDescription}>
              {t('worker.otpDescription', { type: t(otpStep === JOB_STATUS.ARRIVED ? 'worker.arrival' : 'worker.completion') })}
            </Text>
            <TextInput
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
               placeholder={t('worker.otpPlaceholder')}
              placeholderTextColor={COLORS.textTertiary}
              style={styles.otpInput}
              autoFocus
            />
            <View style={styles.otpActions}>
              <TouchableOpacity style={styles.otpCancel} onPress={() => { setOtp(''); setOtpStep(null); }}>
                 <Text style={styles.otpCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.otpSubmit, (!otp || advancing) && styles.otpSubmitDisabled]}
                onPress={() => submitStatus(otp)}
                disabled={!otp || advancing}
              >
                 {advancing ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.otpSubmitText}>{t('worker.verifyOtp')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    marginBottom: SPACING.lg,
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
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pendingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
  },
  pendingBody: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 19,
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
  locationMeta: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },
  locationMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMetaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  navigateBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
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
  amountBreakdown: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  amountLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.success,
  },
  updateStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
    minHeight: 60,
    ...SHADOWS.md,
  },
  updateStatusBtnCompleted: {
    backgroundColor: COLORS.success,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  otpCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  otpTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  otpDescription: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  otpInput: {
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.xl,
    letterSpacing: 5,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  otpActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  otpCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  otpCancelText: {
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
  },
  otpSubmit: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  otpSubmitDisabled: {
    opacity: 0.5,
  },
  otpSubmitText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
  },
  reportButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  reportButtonText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  updateStatusText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionDisabled: {
    opacity: 0.4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CurrentJobScreen;
