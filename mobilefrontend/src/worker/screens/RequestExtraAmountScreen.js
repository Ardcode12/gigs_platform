import React, { useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import useApi from '../../hooks/useApi';
import { useSocketEvent, WS_EVENTS } from '../../context/SocketContext';
import { getJob, requestExtraAmount } from '../../api/jobs';
import { formatRupees, formatDate } from '../../utils/format';
import { useT } from '../../i18n/LanguageContext';

const QUICK_AMOUNTS = [100, 200, 300, 500];

/** How a past request reads once the customer has decided (spec #6). */
const DECISION_META = {
  pending: { icon: 'clock-outline', color: COLORS.warning, label: 'Awaiting approval' },
  approved: { icon: 'check-circle', color: COLORS.success, label: 'Approved' },
  rejected: { icon: 'close-circle', color: COLORS.danger, label: 'Rejected' },
};

const RequestExtraAmountScreen = () => {
  const navigation = useNavigation();
  const jobId = useRoute().params?.jobId;
  const [extraAmount, setExtraAmount] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const t = useT();

  const request = useApi(useCallback(() => getJob(jobId), [jobId]), [jobId]);
  const job = request.data;

  // The customer's decision arrives from outside this app, so listen for it.
  useSocketEvent([WS_EVENTS.EXTRA_AMOUNT_DECISION, WS_EVENTS.JOB_UPDATE], (event) => {
    if (event.payload?.job_id === jobId) request.refetch();
  });

  const numericExtra = parseInt(extraAmount, 10) || 0;
  const baseAmount = job?.amounts.base_amount ?? 0;
  const requestedTotal = baseAmount + numericExtra;

  const history = job?.extra_requests ?? [];
  const pending = history.find((item) => item.status === 'pending');

  const handleSend = async () => {
    if (numericExtra <= 0) {
      Alert.alert(t('worker.enterAmount'), t('worker.enterAmountBody'));
      return;
    }
    if (!reason.trim()) {
      Alert.alert(t('worker.enterReason'), t('worker.enterReasonBody'));
      return;
    }

    setSending(true);
    try {
      await requestExtraAmount(jobId, numericExtra, reason.trim());
      Alert.alert(
        t('worker.requestSent'),
        t('worker.requestSentBody', { amount: formatRupees(numericExtra) }),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      // 409 = the job isn't in progress, or another request is already pending.
      Alert.alert(t('worker.couldNotCall'), error.message);
      request.refetch();
    } finally {
      setSending(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('worker.requestExtra')}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  if (request.loading && !job) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        {header}
        <LoadingState />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        {header}
        <EmptyState
          tone="error"
          title={t('job.loadFailed')}
          message={request.error?.message}
          actionLabel={t('common.tryAgain')}
          onAction={request.reload}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      {header}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Base Amount */}
        <Card style={styles.card}>
          <View style={styles.amountRow}>
            <View style={[styles.amountIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="receipt" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.amountLabel}>{t('worker.baseEstimated')}</Text>
              <Text style={styles.amountValue}>{formatRupees(baseAmount)}</Text>
            </View>
          </View>
        </Card>

        {pending ? (
          /* One request at a time — the form is replaced while a decision is due. */
          <Card style={[styles.card, styles.pendingCard]}>
            <View style={styles.pendingHead}>
              <MaterialCommunityIcons name="clock-alert-outline" size={26} color="#B45309" />
              <Text style={styles.pendingTitle}>{t('worker.waitingCustomer')}</Text>
            </View>
            <Text style={styles.pendingAmount}>{formatRupees(pending.amount)}</Text>
            <Text style={styles.pendingReason}>{pending.reason}</Text>
            <Text style={styles.pendingHint}>
               {t('worker.extraHint')}
            </Text>
          </Card>
        ) : (
          <>
            {/* Extra Amount Input */}
            <Card style={styles.card}>
              <Text style={styles.inputLabel}>{t('worker.extraInput')}</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.rupeeSign}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  value={extraAmount}
                  onChangeText={(text) => setExtraAmount(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.quickAmountBtn,
                      numericExtra === amt && styles.quickAmountBtnActive,
                    ]}
                    onPress={() => setExtraAmount(String(amt))}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        numericExtra === amt && styles.quickAmountTextActive,
                      ]}
                    >
                      +₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Reason Input */}
            <Card style={styles.card}>
              <Text style={styles.inputLabel}>{t('worker.reasonExtra')}</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder={t('worker.reasonPlaceholder')}
                placeholderTextColor={COLORS.textTertiary}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{reason.length}/200</Text>
            </Card>

            {/* Total Summary */}
            <Card style={[styles.card, styles.totalCard]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('job.baseAmount')}</Text>
                <Text style={styles.summaryValue}>{formatRupees(baseAmount)}</Text>
              </View>
              {job.amounts.extra_amount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('worker.alreadyApproved')}</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    +{formatRupees(job.amounts.extra_amount)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('job.extraAmount')}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                  +{formatRupees(numericExtra)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t('worker.requestedTotal')}</Text>
                <Text style={styles.totalValue}>
                  {formatRupees(requestedTotal + job.amounts.extra_amount)}
                </Text>
              </View>
            </Card>

            {/* Approval Notice */}
            <View style={styles.noticeCard}>
              <MaterialCommunityIcons name="information" size={22} color={COLORS.info} />
              <Text style={styles.noticeText}>
                Customer approval is required for the extra amount. The customer will be notified
                and must accept before the total changes.
              </Text>
            </View>
          </>
        )}

        {/* Earlier requests on this job */}
        {history.filter((item) => item.status !== 'pending').length > 0 && (
          <View style={styles.historyBlock}>
             <Text style={styles.historyTitle}>{t('worker.earlierRequests')}</Text>
            {history
              .filter((item) => item.status !== 'pending')
              .map((item) => {
                const meta = DECISION_META[item.status] ?? DECISION_META.pending;
                return (
                  <Card key={item.id} style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                      <Text style={styles.historyAmount}>{formatRupees(item.amount)}</Text>
                      <Text style={[styles.historyStatus, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={styles.historyReason}>{item.reason}</Text>
                    <Text style={styles.historyDate}>
                      {formatDate(item.decided_at ?? item.created_at)}
                    </Text>
                  </Card>
                );
              })}
          </View>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>

      {/* Send Button */}
      {!pending && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!numericExtra || !reason.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!numericExtra || !reason.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={22} color={COLORS.white} />
                 <Text style={styles.sendBtnText}>{t('worker.sendCustomer')}</Text>
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
  card: {
    marginBottom: SPACING.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  amountLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  amountValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  pendingCard: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
    marginLeft: SPACING.sm,
  },
  pendingAmount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#92400E',
    marginTop: SPACING.md,
  },
  pendingReason: {
    fontSize: FONT_SIZE.md,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 21,
  },
  pendingHint: {
    fontSize: FONT_SIZE.sm,
    color: '#B45309',
    marginTop: SPACING.md,
    lineHeight: 19,
  },
  inputLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
  },
  rupeeSign: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAmountBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  quickAmountText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  quickAmountTextActive: {
    color: COLORS.primary,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: SPACING.sm,
  },
  totalCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  noticeText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#0369A1',
    marginLeft: SPACING.md,
    lineHeight: 20,
  },
  historyBlock: {
    marginTop: SPACING.xl,
  },
  historyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  historyCard: {
    marginBottom: SPACING.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAmount: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  historyStatus: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  historyReason: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 19,
  },
  historyDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  bottomBar: {
    padding: SPACING.xl,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    ...SHADOWS.lg,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    minHeight: 56,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  sendBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
});

export default RequestExtraAmountScreen;
