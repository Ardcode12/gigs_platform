import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';
import { AI_DETECTION_SAMPLE } from '../data/customerMockData';

const AIRequirementScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const route = useRoute();
  const initialText =
    route?.params?.userInput || t('customer.searchPrompt1');
  const [inputText, setInputText] = useState(initialText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedData, setDetectedData] = useState(AI_DETECTION_SAMPLE);

  const handleReprocess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 600);
  };

  const handleConfirmUnderstanding = () => {
    navigation.navigate('CostEstimate', {
      aiData: detectedData,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.aiBreakdown')}</Text>
        <View style={styles.coopAIPill}>
          <MaterialCommunityIcons name="robot" size={14} color={COLORS.primary} />
          <Text style={styles.coopAIPillText}>{t('customer.aiBrand')}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer Input Card */}
        <View style={styles.inputCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>{t('customer.serviceRequirement')}</Text>
            <TouchableOpacity onPress={handleReprocess}>
              <Text style={styles.reAnalyseLink}>{t('customer.reanalyze')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputBoxWrapper}>
            <TextInput
              style={styles.textInputBox}
              multiline
              value={inputText}
              onChangeText={setInputText}
               placeholder={t('customer.requirementPlaceholder')}
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.nlpStatusRow}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.success} />
            <Text style={styles.nlpStatusText}>
               {t('customer.parsedTasks', { count: 3 })}
            </Text>
          </View>
        </View>

        {/* AI Detection Banner */}
        <View style={styles.detectionBanner}>
          <View style={styles.sparkleIconBox}>
            <MaterialCommunityIcons name="creation" size={24} color={COLORS.white} />
          </View>
          <View style={styles.bannerTextWrap}>
             <Text style={styles.bannerTitle}>{t('customer.identifiedCategory')}</Text>
            <Text style={styles.bannerCategory}>{t(detectedData.detectedCategoryKey)}</Text>
          </View>
          <View style={styles.confidenceBadge}>
             <Text style={styles.confidenceText}>{t('customer.match', { value: '99.4' })}</Text>
          </View>
        </View>

        {/* Individual Detected Services */}
        <View style={styles.servicesSection}>
           <Text style={styles.servicesSectionTitle}>{t('customer.detectedServices')}</Text>
          <Text style={styles.servicesSectionSub}>
             {t('customer.reviewDetected')}
          </Text>

          {detectedData.detectedServices.map((service, index) => (
            <View key={service.id} style={styles.serviceItemCard}>
              <View style={styles.serviceNumberCircle}>
                <Text style={styles.serviceNumberText}>{index + 1}</Text>
              </View>

              <View style={styles.serviceDetails}>
                <View style={styles.serviceNameRow}>
                <Text style={styles.serviceNameText}>{t(service.nameKey)}</Text>
                  <View style={styles.qtyBadge}>
                     <Text style={styles.qtyBadgeText}>{t('customer.qty', { count: service.quantity })}</Text>
                  </View>
                </View>

                <Text style={styles.serviceDetailText}>{t(service.detailKey)}</Text>

                <View style={styles.servicePriceRow}>
                   <Text style={styles.coopRateLabel}>{t('customer.coopRate')}</Text>
                  <Text style={styles.servicePriceValue}>₹{service.totalPrice}</Text>
                </View>
              </View>

              <MaterialCommunityIcons
                name="check-circle"
                size={22}
                color={COLORS.success}
                style={styles.verifiedCheck}
              />
            </View>
          ))}
        </View>

        {/* AI Understanding Confirmation Summary Box */}
        <View style={styles.confirmationSummaryBox}>
          <View style={styles.summaryTopRow}>
            <View>
               <Text style={styles.summaryTotalLabel}>{t('customer.baseEstimated')}</Text>
              <Text style={styles.summaryTotalValue}>
                ₹{detectedData.baseEstimatedTotal}
              </Text>
            </View>
            <View style={styles.savingsPill}>
              <MaterialCommunityIcons name="tag-outline" size={14} color={COLORS.success} />
               <Text style={styles.savingsPillText}>{t('customer.coopPricing')}</Text>
            </View>
          </View>
          <Text style={styles.pricingNote}>
             {t('customer.pricingNote')}
          </Text>
        </View>

        {/* Action Button: Customer can confirm AI's understanding */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmUnderstanding}
          activeOpacity={0.85}
        >
          <View style={styles.buttonContentRow}>
             <Text style={styles.confirmButtonText}>{t('customer.confirmUnderstanding')}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </View>
          <Text style={styles.confirmButtonSub}>
             {t('customer.proceedEstimate')}
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
  coopAIPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  coopAIPillText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 60,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardHeaderTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reAnalyseLink: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  inputBoxWrapper: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  textInputBox: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
    minHeight: 48,
  },
  nlpStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  nlpStatusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSuccess,
    fontWeight: FONT_WEIGHT.medium,
  },
  detectionBanner: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  sparkleIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
  },
  bannerCategory: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: '#4ADE80',
  },
  servicesSection: {
    marginBottom: SPACING.lg,
  },
  servicesSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  servicesSectionSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  serviceItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  serviceNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  serviceNumberText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  serviceNameText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  qtyBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 6,
  },
  qtyBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  serviceDetailText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginVertical: 4,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  coopRateLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  servicePriceValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  verifiedCheck: {
    marginLeft: SPACING.xs,
    marginTop: 2,
  },
  confirmationSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  savingsPillText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  pricingNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  confirmButtonSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});

export default AIRequirementScreen;
