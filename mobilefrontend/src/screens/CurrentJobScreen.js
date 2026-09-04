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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import StepperProgress from '../components/StepperProgress';
import { CURRENT_JOB, JOB_STEPS } from '../data/mockData';

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
    return `Mark as: ${stepLabels[currentStep + 1]}`;
  };

  const openNavigation = () => {
    const address = encodeURIComponent(job.location.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current Job</Text>
        <StatusBadge
          label={isCompleted ? 'COMPLETED' : 'ACTIVE'}
          color={isCompleted ? 'success' : 'warning'}
          size="sm"
        />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Card */}
        <Card style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {job.customer.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.customerName}>{job.customer.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
                <Text style={styles.ratingText}>{job.customer.rating}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: COLORS.primaryLight }]}
                onPress={() => navigation.navigate('Chat')}
              >
                <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: COLORS.successLight }]}
              >
                <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Location Card */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Service Location</Text>
          </View>
          <Text style={styles.locationAddress}>{job.location.address}</Text>
          <Text style={styles.locationLandmark}>{job.location.landmark}</Text>

          <View style={styles.locationMeta}>
            <View style={styles.locationMetaItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.primary} />
              <Text style={styles.locationMetaText}>{job.location.distance}</Text>
            </View>
            <View style={styles.locationMetaItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
              <Text style={styles.locationMetaText}>{job.location.estimatedTime}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.navigateBtn} onPress={openNavigation} activeOpacity={0.8}>
            <MaterialCommunityIcons name="navigation-variant" size={22} color={COLORS.white} />
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
        </Card>

        {/* Services & Amount */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="wrench" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Services & Amount</Text>
          </View>
          {job.services.map((service, index) => (
            <View key={index} style={styles.serviceRow}>
              <View style={styles.serviceDot} />
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>₹{service.price}</Text>
            </View>
          ))}
          <View style={styles.amountBreakdown}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Base Amount</Text>
              <Text style={styles.amountValue}>₹{job.baseAmount}</Text>
            </View>
            {job.extraAmount > 0 && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Extra Amount</Text>
                <Text style={[styles.amountValue, { color: COLORS.warning }]}>+₹{job.extraAmount}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.amountRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{job.totalAmount}</Text>
            </View>
          </View>
        </Card>

        {/* Job Progress */}
        <Card style={styles.card}>
          <View style={styles.sectionLabel}>
            <MaterialCommunityIcons name="progress-check" size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionLabelText}>Job Progress</Text>
          </View>
          <StepperProgress steps={stepLabels} currentStep={currentStep} />
        </Card>

        {/* Update Status Button */}
        <TouchableOpacity
          style={[
            styles.updateStatusBtn,
            isCompleted && styles.updateStatusBtnCompleted,
          ]}
          onPress={advanceStep}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isCompleted ? 'check-circle' : 'arrow-right-circle'}
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.updateStatusText}>{getNextStepLabel()}</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="chat-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="phone-in-talk" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionLabel}>Protected{'\n'}Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('RequestExtraAmount')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="cash-plus" size={24} color="#B45309" />
            </View>
            <Text style={styles.quickActionLabel}>Extra{'\n'}Amount</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  customerName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionLabelText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  locationLandmark: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  locationMeta: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },
  locationMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMetaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.sm,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  navigateBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  serviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  serviceName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  servicePrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  amountBreakdown: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  amountLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.success,
  },
  updateStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
    minHeight: 60,
    ...SHADOWS.md,
  },
  updateStatusBtnCompleted: {
    backgroundColor: COLORS.success,
  },
  updateStatusText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  quickActionBtn: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CurrentJobScreen;
