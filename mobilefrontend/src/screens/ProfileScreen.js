import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { WORKER } from '../data/mockData';

const ProfileScreen = () => {
  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<MaterialCommunityIcons key={i} name="star" size={20} color="#FBBF24" />);
      } else if (i === full && half) {
        stars.push(<MaterialCommunityIcons key={i} name="star-half-full" size={20} color="#FBBF24" />);
      } else {
        stars.push(<MaterialCommunityIcons key={i} name="star-outline" size={20} color="#D1D5DB" />);
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Profile Hero */}
      <View style={styles.heroSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {WORKER.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.heroName}>{WORKER.name}</Text>
        <View style={styles.heroSkills}>
          {WORKER.skills.map((skill, i) => (
            <View key={i} style={styles.skillPill}>
              <Text style={styles.skillPillText}>{skill}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ratingRow}>
          {renderStars(WORKER.rating)}
          <Text style={styles.ratingValue}>{WORKER.rating}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{WORKER.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{WORKER.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{WORKER.memberSince.split(' ')[1]}</Text>
            <Text style={styles.statLabel}>Since</Text>
          </Card>
        </View>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Personal Information</Text>

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
              <Text style={styles.infoLabel}>City</Text>
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

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.infoLight }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cooperative</Text>
              <Text style={styles.infoValue}>{WORKER.cooperative}</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
            <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.successLight }]}>
            <MaterialCommunityIcons name="file-document" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.menuLabel}>Documents</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.warningLight }]}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#B45309" />
          </View>
          <Text style={styles.menuLabel}>Help & Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.infoLight }]}>
            <MaterialCommunityIcons name="translate" size={20} color={COLORS.info} />
          </View>
          <Text style={styles.menuLabel}>Language</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} activeOpacity={0.7}>
          <View style={[styles.menuIcon, { backgroundColor: COLORS.dangerLight }]}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          </View>
          <Text style={[styles.menuLabel, { color: COLORS.danger }]}>Logout</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <Text style={styles.versionText}>WORKMAT Worker App v1.0.0</Text>

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
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarLargeText: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  heroName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  heroSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  skillPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  skillPillText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  ratingValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: SPACING.lg,
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  logoutItem: {
    marginTop: SPACING.md,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xxl,
  },
});

export default ProfileScreen;
