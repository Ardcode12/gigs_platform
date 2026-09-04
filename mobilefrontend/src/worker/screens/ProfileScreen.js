import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { WORKER } from '../data/workerMockData';

const ProfileScreen = ({ navigation }) => {
  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<MaterialCommunityIcons key={i} name="star" size={18} color="#F59E0B" />);
      } else if (i === full && half) {
        stars.push(<MaterialCommunityIcons key={i} name="star-half-full" size={18} color="#F59E0B" />);
      } else {
        stars.push(<MaterialCommunityIcons key={i} name="star-outline" size={18} color="#D1D5DB" />);
      }
    }
    return stars;
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of WORKMAT?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Worker Profile</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          activeOpacity={0.8}
          accessibilityLabel="Settings"
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Profile Hero Card */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {WORKER.name.split(' ').map((n) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={22} color={COLORS.white} />
          </View>
        </View>

        <Text style={styles.heroName}>{WORKER.name}</Text>
        <Text style={styles.heroCoop}>{WORKER.cooperative}</Text>

        <View style={styles.heroSkills}>
          {WORKER.skills.map((skill, i) => (
            <View key={i} style={styles.skillPill}>
              <Text style={styles.skillPillText}>{skill}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.starsContainer}>
            {renderStars(WORKER.rating)}
          </View>
          <Text style={styles.ratingValue}>{WORKER.rating}</Text>
          <Text style={styles.ratingCount}>(142 reviews)</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        <View style={styles.verificationBanner}>
          <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.success} />
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>KYC Verified Worker</Text>
            <Text style={styles.bannerSubtitle}>Aadhar & Cooperative ID verified</Text>
          </View>
          <StatusBadge status="completed" label="Active" size="sm" />
        </View>

        {/* Stats Row - 3 Standardized Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="briefcase-check" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{WORKER.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </Card>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
            <Text style={styles.statValue}>{WORKER.rating}</Text>
            <Text style={styles.statLabel}>Avg. Rating</Text>
          </Card>
          <Card style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-badge" size={22} color={COLORS.info} />
            <Text style={styles.statValue}>{WORKER.memberSince.split(' ')[1]}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </Card>
        </View>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.infoTitle}>Personal Details</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.editLinkBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.primary} />
              <Text style={styles.editLinkText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="phone" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{WORKER.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location / City</Text>
              <Text style={styles.infoValue}>{WORKER.city}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#B45309" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Aadhar Number</Text>
              <Text style={styles.infoValue}>{WORKER.aadhar}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.infoLight }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cooperative Society</Text>
              <Text style={styles.infoValue}>{WORKER.cooperative}</Text>
            </View>
          </View>
        </Card>

        {/* Menu Items with Touch Targets >= 52px */}
        <Text style={styles.sectionHeader}>Preferences & Support</Text>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Work Documents</Text>
            <Text style={styles.menuSublabel}>Certificates & Trade license</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.infoLight }]}>
            <MaterialCommunityIcons name="translate" size={22} color={COLORS.info} />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>App Language / भाषा</Text>
            <Text style={styles.menuSublabel}>English (Change)</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.warningLight }]}>
            <MaterialCommunityIcons name="phone-in-talk" size={22} color="#B45309" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Text style={styles.menuSublabel}>Toll-free worker helpline</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Standardized Red Logout Action */}
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={22} color={COLORS.danger} />
          <Text style={styles.logoutLabel}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>WORKMAT Worker App • v1.0.0 (Build 42)</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: SPACING.xs,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarLargeText: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  heroName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  heroCoop: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  heroSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  skillPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  skillPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.semibold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  ratingValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginRight: 4,
  },
  ratingCount: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONT_WEIGHT.medium,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
  },
  bodyContent: {
    padding: SPACING.md,
    paddingTop: SPACING.md,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  bannerTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm + 2,
  },
  bannerTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: '#15803D',
  },
  bannerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: '#166534',
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  infoTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  editLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  editLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    marginLeft: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 4,
    minHeight: 56,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  },
  menuLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  menuSublabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    minHeight: 52,
    marginTop: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  logoutLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
  },
});

export default ProfileScreen;
