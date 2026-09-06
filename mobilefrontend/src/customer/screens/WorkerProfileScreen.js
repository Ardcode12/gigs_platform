import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { useT } from '../../i18n/LanguageContext';
import { RECOMMENDED_WORKERS } from '../data/customerMockData';

const WorkerProfileScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const routeParams = useRoute().params ?? {};
  const worker = routeParams.worker || RECOMMENDED_WORKERS[0];
  const service_type = routeParams.service_type || (worker.skills && worker.skills[0]) || 'General Repair';
  const estimatedAmount = routeParams.estimatedAmount || worker.estimatedAmount || 500;

  const handleProtectedCall = () => {
    Alert.alert(
       t('customer.protectedCall'),
       t('customer.connectingCall', { name: worker.name }),
       [{ text: t('customer.startCall') }, { text: t('common.cancel'), style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.workerProfile')}</Text>
        <TouchableOpacity style={styles.shareButton}>
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: worker.photo }} style={styles.avatarImage} />
            <View style={styles.verifiedBadgeCircle}>
              <MaterialCommunityIcons name="check-decagram" size={22} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerTrade}>{t(worker.tradeKey)}</Text>
          <Text style={styles.coopBranchText}>{worker.coopBranch}</Text>

          {/* Privacy Notice on Profile */}
          <View style={styles.privacyPill}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={COLORS.success} />
             <Text style={styles.privacyPillText}>{t('customer.identityVerified')}</Text>
          </View>

          {/* Key Stats Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <MaterialCommunityIcons name="star" size={18} color="#F59E0B" />
                <Text style={styles.statNumber}>{worker.rating}</Text>
              </View>
               <Text style={styles.statLabel}>{worker.reviewsCount} {t('customer.reviews')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{worker.completedJobs}</Text>
               <Text style={styles.statLabel}>{t('customer.completedJobs')}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumber}>{worker.experience}</Text>
               <Text style={styles.statLabel}>{t('customer.experience')}</Text>
            </View>
          </View>

          {/* Contact Action Buttons (Chat & Call through platform) */}
          <View style={styles.contactActionsRow}>
            <TouchableOpacity
              style={styles.chatActionButton}
              onPress={() => navigation.navigate('CustomerChat', { worker })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-processing-outline" size={20} color={COLORS.primary} />
               <Text style={styles.chatActionText}>{t('customer.chatWorker')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callActionButton}
              onPress={handleProtectedCall}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="phone-shield" size={20} color={COLORS.white} />
               <Text style={styles.callActionText}>{t('customer.callPlatform')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Bio */}
        <View style={styles.sectionCard}>
           <Text style={styles.sectionTitle}>{t('customer.workerBio')}</Text>
          <Text style={styles.bioText}>{worker.bio}</Text>

          <View style={styles.maskedNumberBox}>
            <MaterialCommunityIcons name="lock" size={16} color={COLORS.textSecondary} />
            <Text style={styles.maskedNumberText}>{worker.phoneMasked}</Text>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.sectionCard}>
           <Text style={styles.sectionTitle}>{t('customer.skills')}</Text>
          <View style={styles.skillsGrid}>
            {worker.skills.map((skill, index) => (
              <View key={index} style={styles.skillBadge}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.skillBadgeText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cooperative Transparency Notice */}
        <View style={styles.coopNoticeCard}>
          <MaterialCommunityIcons name="handshake" size={24} color={COLORS.primary} />
          <View style={styles.coopNoticeTextWrap}>
             <Text style={styles.coopNoticeTitle}>{t('customer.wageGuarantee')}</Text>
            <Text style={styles.coopNoticeDesc}>
               {t('customer.wageDescription')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Booking Sticky Bar */}
      <View style={styles.bottomBar}>
        <View>
           <Text style={styles.barAmountLabel}>{t('customer.estimatedTotal')}</Text>
          <Text style={styles.barAmountValue}>₹{worker.estimatedAmount}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookWorkerButton}
          onPress={() => navigation.navigate('ConfirmBooking', {
            worker,
            service_type,
            estimatedAmount,
          })}
          activeOpacity={0.85}
        >
           <Text style={styles.bookWorkerButtonText}>{t('customer.bookWorker')}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    padding: 2,
  },
  workerName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  workerTrade: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginTop: 2,
  },
  coopBranchText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  privacyPillText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSuccess,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCol: {
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  contactActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  chatActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 6,
  },
  chatActionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  callActionButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 6,
    ...SHADOWS.sm,
  },
  callActionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  bioText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  maskedNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  maskedNumberText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  skillBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  coopNoticeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  coopNoticeTextWrap: {
    flex: 1,
  },
  coopNoticeTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  coopNoticeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  barAmountLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  barAmountValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  bookWorkerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  bookWorkerButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
});

export default WorkerProfileScreen;
