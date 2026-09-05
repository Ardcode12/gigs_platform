import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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

const ExtraAmountScreen = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState('pending'); // 'pending' | 'accepted' | 'rejected'
  const worker = ONGOING_BOOKING.worker;
  const baseAmount = 650;
  const extraAmount = 100;
  const reason = 'Additional wiring';
  const totalAmount = baseAmount + extraAmount;

  const handleAccept = () => {
    setStatus('accepted');
    Alert.alert(
      'Extra Amount Approved',
      `You accepted ₹${extraAmount} for ${reason}. The updated final total is ₹${totalAmount}.`,
      [
        {
          text: 'View Updated Booking',
          onPress: () => navigation.navigate('ConfirmBooking', { totalAmount, hasExtra: true }),
        },
      ]
    );
  };

  const handleReject = () => {
    setStatus('rejected');
    Alert.alert(
      'Extra Amount Rejected',
      'The worker has been notified. They will proceed only with the original scope of work.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extra Amount Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Worker Request Card */}
        <View style={styles.alertHeaderCard}>
          <View style={styles.alertIconCircle}>
            <MaterialCommunityIcons name="alert-decagram-outline" size={28} color="#D97706" />
          </View>
          <Text style={styles.alertTitle}>Worker Approval Required</Text>
          <Text style={styles.alertSubtitle}>
            Your assigned cooperative worker has requested an adjustment due to additional on-site materials or work.
          </Text>
        </View>

        {/* Worker Information Strip */}
        <View style={styles.workerStrip}>
          <Image source={{ uri: worker.photo }} style={styles.workerAvatar} />
          <View style={styles.workerMeta}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerTrade}>{worker.trade}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatIconBtn}
            onPress={() => navigation.navigate('CustomerChat', { worker })}
          >
            <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownCardHeader}>Price Adjustment Details</Text>
          <View style={styles.divider} />

          {/* Base Amount */}
          <View style={styles.rowItem}>
            <View>
              <Text style={styles.rowItemTitle}>Base Amount</Text>
              <Text style={styles.rowItemSub}>Initial agreed service estimate</Text>
            </View>
            <Text style={styles.rowItemValue}>₹{baseAmount}</Text>
          </View>

          {/* Extra Amount */}
          <View style={[styles.rowItem, styles.extraRowHighlight]}>
            <View style={{ flex: 1 }}>
              <View style={styles.extraTagRow}>
                <Text style={styles.extraTagTitle}>Extra Amount</Text>
                <View style={styles.pendingPill}>
                  <Text style={styles.pendingPillText}>REQUIRES CONSENT</Text>
                </View>
              </View>
              <Text style={styles.extraReasonText}>Reason: {reason}</Text>
            </View>
            <Text style={styles.extraValueText}>+₹{extraAmount}</Text>
          </View>

          <View style={styles.totalDivider} />

          {/* New Total */}
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalSub}>New payable on job completion</Text>
            </View>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Transparent Policy Card */}
        <View style={styles.policyCard}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.primary} />
          <View style={styles.policyTextWrapper}>
            <Text style={styles.policyTitle}>Worker Cooperative Protection Policy</Text>
            <Text style={styles.policyDesc}>
              Cooperative technicians must seek customer digital approval before initiating any extra paid labor. If rejected, they will perform only the baseline task without penalty.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {status === 'pending' ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={20} color={COLORS.danger} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Accept ₹{totalAmount}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusResultBox}>
            <Text style={styles.statusResultText}>
              {status === 'accepted' ? '✓ Accepted ₹' + totalAmount : '✕ Request Rejected'}
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
