import React, { useState, useEffect, useCallback } from 'react';
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
import { useT } from '../../i18n/LanguageContext';
import { listExtraRequests, decideExtraAmount, getJobDetail } from '../../api/jobs';

const ExtraAmountScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const [extras, setExtras] = useState([]);

  // Fetch job detail + extra requests
  const fetchData = useCallback(async () => {
    if (!jobId) return;
    try {
      const [jobData, extraData] = await Promise.all([
        getJobDetail(jobId),
        listExtraRequests(jobId),
      ]);
      setJob(jobData);
      setExtras(extraData || []);
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Find first pending request to show, otherwise show the latest
  const pendingExtra = extras.find((e) => e.status === 'pending');
  const activeExtra = pendingExtra || extras[0];

  const workerInfo = job?.worker
    ? { name: job.worker.name, photo: job.worker.photo_url, trade: 'Cooperative Technician' }
    : { name: 'Worker', photo: null, trade: 'Cooperative Technician' };

  const baseAmount = job?.amounts?.base_amount || 0;
  const extraAmount = activeExtra ? activeExtra.amount : 0;
  const reason = activeExtra ? activeExtra.reason : 'Additional work';
  const extraStatus = activeExtra ? activeExtra.status : 'pending';
  const totalAmount = baseAmount + extraAmount;

  const isPreAccept = (reason || '').includes('[Pre-Accept Quote]');
  const cleanReason = (reason || '').replace('[Pre-Accept Quote]', '').trim() || 'Scope & material adjustment';

  const handleAccept = async () => {
    if (!activeExtra || submitting) return;
    setSubmitting(true);
    try {
      await decideExtraAmount(activeExtra.id, true);
      Alert.alert(
        'Extra Amount Approved',
        `You accepted ₹${extraAmount} for ${cleanReason}. The updated total is ₹${totalAmount}.`,
        [{ text: 'Back to Tracking', onPress: () => navigation.goBack() }],
      );
      fetchData(); // refresh
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not approve. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!activeExtra || submitting) return;
    setSubmitting(true);
    try {
      await decideExtraAmount(activeExtra.id, false);
      Alert.alert(
        'Extra Amount Rejected',
        'The worker has been notified. They will proceed only with the original scope of work.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reject. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('extra.title') || 'Price Adjustment Request'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.alertHeaderCard}>
          <View style={styles.alertIconCircle}>
            <MaterialCommunityIcons name="alert-decagram-outline" size={28} color="#D97706" />
          </View>
          <Text style={styles.alertTitle}>
            {isPreAccept ? 'Pre-Acceptance Price Proposal' : (t('extra.approvalRequired') || 'Price Approval Required')}
          </Text>
          <Text style={styles.alertSubtitle}>
            {isPreAccept
              ? 'The worker proposed a price adjustment for the requested scope prior to accepting your booking.'
              : (t('extra.approvalBody') || 'The assigned worker requested an extra amount during service.')}
          </Text>
        </View>

        {/* Worker Information Strip */}
        <View style={styles.workerStrip}>
          {workerInfo.photo ? (
            <Image source={{ uri: workerInfo.photo }} style={styles.workerAvatar} />
          ) : (
            <View style={[styles.workerAvatar, { backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name="account" size={22} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.workerMeta}>
            <Text style={styles.workerName}>{workerInfo.name}</Text>
            <Text style={styles.workerTrade}>{workerInfo.trade}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatIconBtn}
            onPress={() => navigation.navigate('CustomerChat', { worker: workerInfo })}
          >
            <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownCardHeader}>{t('extra.detailsHeader') || 'Quotation Details'}</Text>
          <View style={styles.divider} />

          {/* Base Amount */}
          <View style={styles.rowItem}>
            <View>
              <Text style={styles.rowItemTitle}>{t('customer.baseAmount') || 'Base Amount'}</Text>
              <Text style={styles.rowItemSub}>{t('extra.baseSub') || 'Original estimate'}</Text>
            </View>
            <Text style={styles.rowItemValue}>₹{baseAmount}</Text>
          </View>

          {/* Extra Amount */}
          <View style={[styles.rowItem, styles.extraRowHighlight]}>
            <View style={{ flex: 1 }}>
              <View style={styles.extraTagRow}>
                <Text style={styles.extraTagTitle}>
                  {isPreAccept ? 'Proposed Extra Quote' : (t('customer.extraAmount') || 'Extra Amount')}
                </Text>
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>
                    {extraStatus === 'pending' ? (isPreAccept ? 'PRE-ACCEPT QUOTE' : 'PENDING APPROVAL') : extraStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.extraReasonText}>Reason: {cleanReason}</Text>
            </View>
            <Text style={styles.extraValueText}>+₹{extraAmount}</Text>
          </View>

          <View style={styles.totalDivider} />

          {/* New Total */}
          <View style={styles.totalRow}>
            <View>
               <Text style={styles.totalLabel}>{t('common.total')}</Text>
               <Text style={styles.totalSub}>{t('extra.totalSub')}</Text>
            </View>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Transparent Policy Card */}
        <View style={styles.policyCard}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.primary} />
          <View style={styles.policyTextWrapper}>
             <Text style={styles.policyTitle}>{t('extra.policyTitle')}</Text>
            <Text style={styles.policyDesc}>
               {t('extra.policyBody')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {extraStatus === 'pending' ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.danger} />
               <Text style={styles.rejectButtonText}>{t('common.reject')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, submitting && { opacity: 0.7 }]}
              onPress={handleAccept}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.acceptButtonText}>{t('extra.acceptAmount', { amount: `₹${totalAmount}` })}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusResultBox}>
            <MaterialCommunityIcons
              name={extraStatus === 'approved' ? 'check-circle' : 'close-circle'}
              size={22}
              color={extraStatus === 'approved' ? COLORS.success : COLORS.danger}
            />
            <Text style={styles.statusResultText}>
              {extraStatus === 'approved' ? t('extra.acceptedAmount', { amount: `₹${totalAmount}` }) : t('extra.rejected')}
            </Text>
          </View>
        )}
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
  alertHeaderCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: SPACING.md,
  },
  alertIconCircle: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
  },
  alertSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  workerStrip: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  workerAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
  },
  workerMeta: {
    flex: 1,
  },
  workerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  breakdownCardHeader: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rowItemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  rowItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowItemValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  extraRowHighlight: {
    backgroundColor: '#FFFBEB',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  extraTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  extraTagTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: '#B45309',
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  pendingPillText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#B45309',
  },
  extraReasonText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  extraValueText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#B45309',
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  policyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  policyTextWrapper: {
    flex: 1,
  },
  policyTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  policyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    gap: 6,
    backgroundColor: COLORS.white,
  },
  rejectButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    gap: 6,
    ...SHADOWS.md,
  },
  acceptButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  statusResultBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusResultText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
});

export default ExtraAmountScreen;
