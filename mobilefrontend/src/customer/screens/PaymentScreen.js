import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { ONGOING_BOOKING } from '../data/customerMockData';

const DIGITAL_PAYMENT_OPTIONS = [
  { id: 'upi_gpay', name: 'Google Pay UPI', desc: 'Fastest via @okhdfcbank', icon: 'google', popular: true },
  { id: 'upi_phonepe', name: 'PhonePe UPI', desc: 'Instant UPI transfer', icon: 'cellphone-wireless', popular: false },
  { id: 'upi_paytm', name: 'Paytm UPI', desc: 'Wallet or Bank UPI', icon: 'wallet-outline', popular: false },
  { id: 'card_hdfc', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: 'credit-card-outline', popular: false },
  { id: 'cash_cod', name: 'Cash to Cooperative Worker', desc: 'Direct currency hand-over', icon: 'cash-multiple', popular: false },
];

const PaymentScreen = ({ navigation, route }) => {
  const finalAmount = route?.params?.amount || 650;
  const [selectedMethod, setSelectedMethod] = useState('upi_gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Amount to Pay Banner */}
        <View style={styles.amountBanner}>
          <Text style={styles.amountBannerLabel}>Final Amount Due</Text>
          <Text style={styles.amountBannerValue}>₹{finalAmount}</Text>
          <View style={styles.coopDirectTag}>
            <MaterialCommunityIcons name="handshake" size={14} color={COLORS.success} />
            <Text style={styles.coopDirectText}>100% Goes Directly to Worker Account</Text>
          </View>
        </View>

        {!paymentSuccess ? (
          <>
            {/* Payment Methods */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              <Text style={styles.sectionSub}>Secured 256-bit encrypted checkout</Text>
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
                          {item.name}
                        </Text>
                        {item.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.methodDesc}>{item.desc}</Text>
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
                {isProcessing ? 'Processing Payment...' : `Pay ₹${finalAmount} Securely`}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Payment Confirmation Card */
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check-bold" size={36} color={COLORS.white} />
            </View>

            <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
            <Text style={styles.successAmount}>₹{finalAmount}</Text>
            <Text style={styles.successSub}>
              Transaction ID: WM-TXN-2026-981249
            </Text>
            <Text style={styles.successTime}>04 Sep 2026, 04:12 PM via UPI</Text>

            <View style={styles.successDivider} />

            {/* Invoice & Actions */}
            <View style={styles.successButtonsRow}>
              <TouchableOpacity
                style={styles.invoiceButton}
                onPress={() => setShowReceiptModal(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="receipt" size={18} color={COLORS.primary} />
                <Text style={styles.invoiceButtonText}>View Invoice / Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rateServiceButton}
                onPress={() => navigation.navigate('RatingFeedback')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="star" size={18} color={COLORS.white} />
                <Text style={styles.rateServiceButtonText}>Rate & Review Service</Text>
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
                <Text style={styles.receiptBrandTitle}>WORKMAT COOPERATIVE</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptBody}>
              <Text style={styles.receiptTitle}>OFFICIAL SERVICE INVOICE</Text>
              <Text style={styles.receiptInvoiceNo}>Invoice #: INV-WM-2026-9812</Text>
              <Text style={styles.receiptDate}>Date: 04 September 2026</Text>

              <View style={styles.receiptDivider} />

              <Text style={styles.receiptSectionHeader}>Worker Details</Text>
              <Text style={styles.receiptWorker}>{ONGOING_BOOKING.worker.name}</Text>
              <Text style={styles.receiptWorkerTrade}>{ONGOING_BOOKING.worker.trade}</Text>

              <View style={styles.receiptDivider} />

              <Text style={styles.receiptSectionHeader}>Items & Charges</Text>
              {ONGOING_BOOKING.items.map((it, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName}>{it.name}</Text>
                  <Text style={styles.receiptItemPrice}>₹{it.price}</Text>
                </View>
              ))}

              <View style={styles.receiptDivider} />

              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                <Text style={styles.receiptTotalVal}>₹{finalAmount}</Text>
              </View>
              <Text style={styles.receiptPaidStatus}>STATUS: PAID (VERIFIED)</Text>
            </View>

            <TouchableOpacity
              style={styles.closeReceiptButton}
              onPress={() => setShowReceiptModal(false)}
            >
              <Text style={styles.closeReceiptText}>Done</Text>
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
