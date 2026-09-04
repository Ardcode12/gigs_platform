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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import { NEW_JOB_REQUEST } from '../data/workerMockData';

const QUICK_REASONS = [
  'Additional wiring needed',
  'Burnt switch replacement',
  'Spare capacitor part',
  'Extra ceiling drill work',
];

const RequestExtraAmountScreen = ({ navigation }) => {
  const baseAmount = NEW_JOB_REQUEST.baseAmount;
  const [extraAmount, setExtraAmount] = useState('100');
  const [reason, setReason] = useState('Additional wiring needed');

  const numericExtra = parseInt(extraAmount, 10) || 0;
  const requestedTotal = baseAmount + numericExtra;

  const handleSend = () => {
    if (numericExtra <= 0) {
      Alert.alert('Enter Amount', 'Please enter an extra amount.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Enter Reason', 'Please select or type a reason.');
      return;
    }
    Alert.alert(
      'Request Sent! 📤',
      `Extra amount request of ₹${numericExtra} for "${reason}" has been sent to the customer for approval.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Standard Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Extra Amount</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Base Amount Summary */}
        <Card style={styles.card}>
          <View style={styles.amountRow}>
            <View style={styles.amountIconWrap}>
              <MaterialCommunityIcons name="receipt" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.amountLabel}>Initial Agreed Amount</Text>
              <Text style={styles.amountValue}>₹{baseAmount}</Text>
            </View>
          </View>
        </Card>

        {/* Extra Amount Numeric Input Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Extra Amount Needed (₹)</Text>
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

          {/* Quick Amount Buttons (48px Touch Targets) */}
          <Text style={styles.quickSubhead}>Tap to quick-add amount:</Text>
          <View style={styles.quickAmountsGrid}>
            {[100, 200, 300, 500].map((amt) => {
              const isSelected = numericExtra === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountBtn, isSelected && styles.quickAmountBtnActive]}
                  onPress={() => setExtraAmount(String(amt))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextActive]}>
                    +₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Reason Card with Tap-to-Select Chips */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Reason for Extra Work</Text>

          <View style={styles.reasonChipsWrap}>
            {QUICK_REASONS.map((r, idx) => {
              const isSelected = reason === r;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.reasonChip, isSelected && styles.reasonChipActive]}
                  onPress={() => setReason(r)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'check' : 'plus'}
                    size={14}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.reasonInput}
            placeholder="Or type custom reason here..."
            placeholderTextColor={COLORS.textTertiary}
            value={reason}
            onChangeText={setReason}
          />
        </Card>

        {/* Calculated Total Box */}
        <View style={styles.totalPreviewBox}>
          <View style={styles.totalPreviewRow}>
            <Text style={styles.totalPreviewLabel}>New Total for Customer</Text>
            <Text style={styles.totalPreviewAmount}>₹{requestedTotal}</Text>
          </View>
          <Text style={styles.totalPreviewNotice}>
            Customer will receive an instant approval notification with these details.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Standardized Bottom Send Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.sendRequestBtn}
          onPress={handleSend}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
          <Text style={styles.sendRequestText}>Send Request (Total: ₹{requestedTotal})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  rupeeSign: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  quickSubhead: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickAmountBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  quickAmountText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  quickAmountTextActive: {
    color: COLORS.primary,
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  reasonChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  reasonChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  reasonChipTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  totalPreviewBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.md,
  },
  totalPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPreviewLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  totalPreviewAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  totalPreviewNotice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  sendRequestBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  sendRequestText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default RequestExtraAmountScreen;
