import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { getJobDetail, getActiveJob, getJobPayment, payInvoice } from '../../api/jobs';

const DIGITAL_PAYMENT_OPTIONS = [
  { id: 'upi_gpay', nameKey: 'customer.paymentGoogle', descKey: 'customer.paymentGoogleDesc', icon: 'google', popular: true },
  { id: 'upi_phonepe', nameKey: 'customer.paymentPhonePe', descKey: 'customer.paymentPhonePeDesc', icon: 'cellphone-wireless', popular: false },
  { id: 'upi_paytm', nameKey: 'customer.paymentPaytm', descKey: 'customer.paymentPaytmDesc', icon: 'wallet-outline', popular: false },
  { id: 'card_hdfc', nameKey: 'customer.paymentCard', descKey: 'customer.paymentCardDesc', icon: 'credit-card-outline', popular: false },
  { id: 'cash_cod', nameKey: 'customer.paymentCash', descKey: 'customer.paymentCashDesc', icon: 'cash-multiple', popular: false },
];

const PaymentScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const route = useRoute();
  const routeJobId = route.params?.jobId;

  const [job, setJob] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('upi_gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Fetch real job and payment invoice details
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let jobData = null;
        if (routeJobId) {
          jobData = await getJobDetail(routeJobId);
        } else {
          jobData = await getActiveJob();
        }

        if (!cancelled && jobData) {
          setJob(jobData);
          try {
            const payData = await getJobPayment(jobData.id);
            if (!cancelled && payData) setPaymentRecord(payData);
          } catch {
            // Payment record might not be generated if job is not marked completed yet
          }
        }
      } catch {
        // Leave payment data empty when the API cannot provide it.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [routeJobId]);

  const finalAmount =
    paymentRecord?.total_amount ??
    job?.amounts?.total_amount;

  const workerName =
    job?.worker?.name || '';
  const workerTrade =
    job?.service_type ? `${job.service_type} Specialist` : '';

  const serviceItems =
    job?.services && job.services.length > 0
      ? job.services
       : [];

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const invoiceNum = job?.id ? `INV-WM-${String(job.id).padStart(4, '0')}` : '';

  const handlePayNow = async () => {
    if (!paymentRecord?.id) {
      Alert.alert(t('error.generic'), t('notif.empty'));
      return;
    }
    setIsProcessing(true);
    try {
      await payInvoice(paymentRecord.id);
      // Simulate gateway animation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPaymentSuccess(true);
    } catch (err) {
      Alert.alert('Payment Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!job || !paymentRecord) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>{t('notif.empty')}</Text>
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
         <Text style={styles.headerTitle}>{t('customer.digitalPayment')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Amount to Pay Banner */}
        <View style={styles.amountBanner}>
           <Text style={styles.amountBannerLabel}>{t('customer.finalDue')}</Text>
            <Text style={styles.amountBannerValue}>{finalAmount == null ? '₹0' : `₹${finalAmount}`}</Text>
          <View style={styles.coopDirectTag}>
            <MaterialCommunityIcons name="handshake" size={14} color={COLORS.success} />
             <Text style={styles.coopDirectText}>{t('customer.directWorker')}</Text>
          </View>
        </View>

        {!paymentSuccess ? (
          <>
            {/* Payment Methods */}
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>{t('customer.selectPayment')}</Text>
               <Text style={styles.sectionSub}>{t('customer.secureCheckout')}</Text>
            </View>

            <View style={styles.methodsList}>
              {DIGITAL_PAYMENT_OPTIONS.map((item) => {
                const isSelected = selectedMethod === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.methodCard, isSelected && styles.methodCardActive]}
                    onPress={() => setSelectedMethod(item.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.methodIconCircle,
                        isSelected && { backgroundColor: COLORS.primaryLight },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color={isSelected ? COLORS.primary : COLORS.textSecondary}
                      />
                    </View>

                    <View style={styles.methodInfo}>
                      <View style={styles.methodTitleRow}>
                        <Text
                          style={[
                            styles.methodName,
                            isSelected && { color: COLORS.primaryDark },
                          ]}
                        >
                          {t(item.nameKey)}
                        </Text>
                        {item.popular && (
                          <View style={styles.popularBadge}>
                             <Text style={styles.popularBadgeText}>{t('customer.popular')}</Text>
                          </View>
                        )}
                      </View>
                       <Text style={styles.methodDesc}>{t(item.descKey)}</Text>
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterActive,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.payNowButton, isProcessing && styles.payButtonDisabled]}
              onPress={handlePayNow}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={isProcessing ? 'loading' : 'shield-check'}
                size={22}
                color={COLORS.white}
              />
              <Text style={styles.payNowText}>
                 {isProcessing ? t('customer.processingPayment') : t('customer.paySecurely', { amount: `₹${finalAmount}` })}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Payment Confirmation Card */
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={36} color={COLORS.white} />
            </View>

             <Text style={styles.successTitle}>{t('customer.paymentSuccessful')}</Text>
            <Text style={styles.successAmount}>₹{finalAmount}</Text>
            <Text style={styles.successSub}>
                {paymentRecord?.id ? t('customer.transactionId', { id: `WM-TXN-${paymentRecord.id}` }) : ''}
            </Text>
             <Text style={styles.successTime}>{t('customer.paymentVia', { date: '04 Sep 2026, 04:12 PM' })}</Text>

            <View style={styles.successDivider} />

            {/* Invoice & Actions */}
            <View style={styles.successButtonsRow}>
              <TouchableOpacity
                style={styles.invoiceButton}
                onPress={() => setShowReceiptModal(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="receipt" size={18} color={COLORS.primary} />
               <Text style={styles.invoiceButtonText}>{t('customer.viewReceipt')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rateServiceButton}
                onPress={() => navigation.navigate('RatingFeedback')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="star" size={18} color={COLORS.white} />
                 <Text style={styles.rateServiceButtonText}>{t('customer.rateService')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Invoice / Receipt Modal */}
      <Modal visible={showReceiptModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptBrandRow}>
                <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
                <Text style={styles.receiptBrandTitle}>{t('customer.cooperative')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptBody}>
               <Text style={styles.receiptTitle}>{t('customer.officialInvoice')}</Text>
               <Text style={styles.receiptInvoiceNo}>{t('invoice.number', { number: invoiceNum })}</Text>
               <Text style={styles.receiptDate}>{t('customer.invoiceDate', { date: todayStr })}</Text>

              <View style={styles.receiptDivider} />

               <Text style={styles.receiptSectionHeader}>{t('customer.workerDetails')}</Text>
              <Text style={styles.receiptWorker}>{workerName}</Text>
              <Text style={styles.receiptWorkerTrade}>{workerTrade}</Text>

              <View style={styles.receiptDivider} />

               <Text style={styles.receiptSectionHeader}>{t('customer.itemsCharges')}</Text>
              {serviceItems.map((it, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                   <Text style={styles.receiptItemName}>{it.name || t(it.nameKey)}</Text>
                  <Text style={styles.receiptItemPrice}>₹{it.price}</Text>
                </View>
              ))}

              <View style={styles.receiptDivider} />

              <View style={styles.receiptTotalRow}>
                 <Text style={styles.receiptTotalLabel}>{t('customer.totalPaid')}</Text>
                <Text style={styles.receiptTotalVal}>₹{finalAmount}</Text>
              </View>
               <Text style={styles.receiptPaidStatus}>{t('customer.paidVerified')}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeReceiptButton}
              onPress={() => setShowReceiptModal(false)}
            >
               <Text style={styles.closeReceiptText}>{t('common.done')}</Text>
            </TouchableOpacity>
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
  amountBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  amountBannerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountBannerValue: {
    fontSize: 40,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    marginVertical: 4,
  },
  coopDirectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  coopDirectText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  sectionSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  methodsList: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  methodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  methodIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  popularBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textSuccess,
  },
  methodDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  payNowButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payNowText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  successTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    marginTop: 4,
  },
  successSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  successTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  successDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xl,
  },
  successButtonsRow: {
    width: '100%',
    gap: SPACING.md,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 6,
  },
  invoiceButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  rateServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 6,
    ...SHADOWS.sm,
  },
  rateServiceButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  receiptContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptBrandTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  receiptBody: {
    marginVertical: SPACING.sm,
  },
  receiptTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  receiptInvoiceNo: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  receiptDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  receiptSectionHeader: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  receiptWorker: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  receiptWorkerTrade: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  receiptItemName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textPrimary,
  },
  receiptItemPrice: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTotalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  receiptTotalVal: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  receiptPaidStatus: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.success,
    marginTop: 4,
  },
  closeReceiptButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  closeReceiptText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default PaymentScreen;
