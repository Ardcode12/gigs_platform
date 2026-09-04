import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import { NEW_JOB_REQUEST } from '../data/mockData';

const RequestExtraAmountScreen = ({ navigation }) => {
  const baseAmount = NEW_JOB_REQUEST.baseAmount;
  const [extraAmount, setExtraAmount] = useState('');
  const [reason, setReason] = useState('');

  const numericExtra = parseInt(extraAmount) || 0;
  const requestedTotal = baseAmount + numericExtra;

  const handleSend = () => {
    if (numericExtra <= 0) {
      Alert.alert('Enter Amount', 'Please enter an extra amount to request.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Enter Reason', 'Please provide a reason for the extra amount.');
      return;
    }
    Alert.alert(
      'Request Sent!',
      `Extra amount of ₹${numericExtra} has been sent for customer approval.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Extra Amount</Text>
        <View style={{ width: 40 }} />
      </View>

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
              <Text style={styles.amountLabel}>Base Estimated Amount</Text>
              <Text style={styles.amountValue}>₹{baseAmount}</Text>
            </View>
          </View>
        </Card>

        {/* Extra Amount Input */}
        <Card style={styles.card}>
          <Text style={styles.inputLabel}>Extra Amount (₹)</Text>
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
            {[100, 200, 300, 500].map((amt) => (
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
          <Text style={styles.inputLabel}>Reason for Extra Amount</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="E.g., Extra materials needed, additional repair work..."
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
            <Text style={styles.summaryLabel}>Base Amount</Text>
            <Text style={styles.summaryValue}>₹{baseAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Extra Amount</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              +₹{numericExtra}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Requested Total</Text>
            <Text style={styles.totalValue}>₹{requestedTotal}</Text>
          </View>
        </Card>

        {/* Approval Notice */}
        <View style={styles.noticeCard}>
          <MaterialCommunityIcons name="information" size={22} color={COLORS.info} />
          <Text style={styles.noticeText}>
            Customer approval is required for the extra amount. The customer will be notified and must accept before the total changes.
          </Text>
        </View>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>

      {/* Send Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!numericExtra || !reason.trim()) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={!numericExtra || !reason.trim()}
        >
          <MaterialCommunityIcons name="send" size={22} color={COLORS.white} />
          <Text style={styles.sendBtnText}>Send Request to Customer</Text>
        </TouchableOpacity>
      </View>
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
