import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { AI_DETECTION_SAMPLE } from '../data/customerMockData';

const CostEstimateScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const aiData = useRoute().params?.aiData || AI_DETECTION_SAMPLE;

  const handleProceedToWorkers = () => {
    navigation.navigate('WorkerRecommendations', {
      serviceBundle: aiData,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.costEstimate')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cooperative Transparency Notice */}
        <View style={styles.trustBanner}>
          <View style={styles.trustIconCircle}>
            <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.success} />
          </View>
          <View style={styles.trustTextWrapper}>
            <Text style={styles.trustTitle}>{t('customer.standardRates')}</Text>
            <Text style={styles.trustSub}>
              {t('customer.directPricing')}
            </Text>
          </View>
        </View>

        {/* Itemized Price Breakdown Card */}
        <View style={styles.estimateCard}>
          <View style={styles.estimateCardHeader}>
            <Text style={styles.estimateCardTitle}>{t('customer.costBreakdown')}</Text>
            <Text style={styles.estimateCardMeta}>{t('customer.matchedServices', { count: aiData.detectedServices.length })}</Text>
          </View>

          <View style={styles.divider} />

          {/* Line Items */}
          {aiData.detectedServices.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemIconCircle}>
                <MaterialCommunityIcons name={item.icon} size={20} color={COLORS.primary} />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{t(item.nameKey)}</Text>
                <Text style={styles.itemQtyDetail}>
                   {item.quantity > 1 ? t('customer.unitPrice', { amount: item.unitPrice, count: item.quantity }) : t('customer.standardLabor')}
                </Text>
              </View>

              <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Subtotal & Cooperative Fee */}
          <View style={styles.calcRow}>
             <Text style={styles.calcLabel}>{t('customer.subtotal')}</Text>
            <Text style={styles.calcValue}>₹{aiData.baseEstimatedTotal}</Text>
          </View>

          <View style={styles.calcRow}>
            <View style={styles.coopFeeLabelRow}>
               <Text style={styles.calcLabel}>{t('customer.coopPlatformFee')}</Text>
              <View style={styles.freeBadge}>
                 <Text style={styles.freeBadgeText}>{t('customer.free')}</Text>
              </View>
            </View>
            <Text style={[styles.calcValue, { color: COLORS.success }]}>₹0</Text>
          </View>

          <View style={styles.calcRow}>
             <Text style={styles.calcLabel}>{t('customer.insurance')}</Text>
             <Text style={[styles.calcValue, { color: COLORS.success }]}>{t('customer.included')}</Text>
          </View>

          <View style={styles.totalDivider} />

          {/* Grand Estimated Total */}
          <View style={styles.totalRow}>
            <View>
               <Text style={styles.totalLabel}>{t('customer.estimatedTotal')}</Text>
               <Text style={styles.totalNote}>{t('customer.fixedBase')}</Text>
            </View>
            <Text style={styles.totalAmount}>₹{aiData.baseEstimatedTotal}</Text>
          </View>
        </View>

        {/* Protection Assurance Card */}
        <View style={styles.assuranceCard}>
           <Text style={styles.assuranceTitle}>{t('customer.guarantee')}</Text>
          <View style={styles.assuranceList}>
            <View style={styles.assuranceItem}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
               <Text style={styles.assuranceText}>{t('customer.noSurprise')}</Text>
            </View>
            <View style={styles.assuranceItem}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
               <Text style={styles.assuranceText}>{t('customer.rework')}</Text>
            </View>
            <View style={styles.assuranceItem}>
              <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
               <Text style={styles.assuranceText}>{t('customer.protectedCalls')}</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.findWorkersButton}
          onPress={handleProceedToWorkers}
          activeOpacity={0.85}
        >
          <View style={styles.findWorkersContent}>
             <Text style={styles.findWorkersText}>{t('customer.showWorkers')}</Text>
            <MaterialCommunityIcons name="account-search" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.findWorkersSub}>
             {t('customer.findWorkers', { amount: `₹${aiData.baseEstimatedTotal}` })}
          </Text>
        </TouchableOpacity>
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
  trustBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: SPACING.md,
  },
  trustIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextWrapper: {
    flex: 1,
  },
  trustTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  trustSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  estimateCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  estimateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  estimateCardMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  itemQtyDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  calcLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  calcValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  coopFeeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  freeBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
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
  totalNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  assuranceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  assuranceTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  assuranceList: {
    gap: 8,
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assuranceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  findWorkersButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  findWorkersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findWorkersText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  findWorkersSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});

export default CostEstimateScreen;
