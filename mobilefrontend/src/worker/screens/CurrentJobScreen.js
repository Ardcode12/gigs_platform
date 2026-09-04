import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import StepperProgress from '../components/StepperProgress';
import { CURRENT_JOB, JOB_STEPS } from '../data/workerMockData';

const CurrentJobScreen = ({ navigation }) => {
  const job = CURRENT_JOB;
  const [currentStep, setCurrentStep] = useState(job.currentStep);
  const stepLabels = JOB_STEPS;
  const isCompleted = currentStep >= stepLabels.length - 1;

  const advanceStep = () => {
    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      Alert.alert('Job Completed! 🎉', 'Great work! This job has been marked as completed.');
    }
  };

  const getNextStepLabel = () => {
    if (isCompleted) return 'Job Completed';
    return `Update: ${stepLabels[currentStep + 1]}`;
  };

  const openNavigation = () => {
    const address = encodeURIComponent(job.location.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Standardized Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current Active Job</Text>
        <StatusBadge
          label={isCompleted ? 'DONE' : 'ACTIVE'}
          color={isCompleted ? 'success' : 'warning'}
          size="sm"
        />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer & Actions Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Customer Information</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {job.customer.name.split(' ').map((n) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>{job.customer.rating} Rating</Text>
              </View>
            </View>
          </View>

          {/* Direct Communication Buttons (48px targets) */}
          <View style={styles.customerContactRow}>
            <TouchableOpacity
              style={styles.contactBtnOutline}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactBtnOutlineText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactBtnFilled}
              onPress={() => Alert.alert('Call Customer', 'Connecting call via masked phone service.')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.white} />
              <Text style={styles.contactBtnFilledText}>Call Customer</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Location & Navigation Card */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Service Location</Text>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          <Text style={styles.locationLandmark}>{job.location.landmark}</Text>

          <View style={styles.locationStatsRow}>
            <View style={styles.locationStatItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} />
              <Text style={styles.locationStatText}>{job.location.distance}</Text>
            </View>
            <View style={styles.locationStatDivider} />
            <View style={styles.locationStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
              <Text style={styles.locationStatText}>{job.location.estimatedTime}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.navigateBtn}
            onPress={openNavigation}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="navigation-variant" size={20} color={COLORS.white} />
            <Text style={styles.navigateBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </Card>

        {/* Job Progress Stepper Card */}
        <Card style={styles.card}>
          <View style={styles.stepperHeaderRow}>
            <Text style={styles.cardSectionLabel}>Job Stage Stepper</Text>
            <Text style={styles.stepCounterText}>
              Step {currentStep + 1} of {stepLabels.length}
            </Text>
          </View>

          <StepperProgress steps={stepLabels} currentStep={currentStep} />
        </Card>

        {/* Services & Financial Breakdown */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionLabel}>Service Items & Payment</Text>
          {job.services.map((service, index) => (
            <View key={index} style={styles.serviceItemRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
          ))}

          <View style={styles.cardDivider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalSub}>Collect digitally or in cash</Text>
            </View>
            <Text style={styles.totalValue}>₹{job.totalAmount}</Text>
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Primary Action Button Sticky Bar: Advances Job Progress */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.advanceStepBtn,
            isCompleted && styles.completedStepBtn,
          ]}
          onPress={advanceStep}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'check-decagram' : 'arrow-right-circle'}
            size={22}
            color={COLORS.white}
          />
          <Text style={styles.advanceStepText}>{getNextStepLabel()}</Text>
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  customerMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  customerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  customerContactRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  contactBtnOutline: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
  },
  contactBtnOutlineText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  contactBtnFilled: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  contactBtnFilledText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  locationAddress: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  locationLandmark: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  locationStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  locationStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationStatText: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  locationStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  navigateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  navigateBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  serviceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  serviceName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
  },
  servicePrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalSub: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
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
  advanceStepBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 54,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  completedStepBtn: {
    backgroundColor: COLORS.success,
  },
  advanceStepText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default CurrentJobScreen;
