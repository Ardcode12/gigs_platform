import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import RatingStars from '../../components/RatingStars';
import LoadingState from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { initialsOf } from '../../utils/format';
import { useLanguageState, useT } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n';

/** Spec-wide: the worker's own record, plus the way out to Ratings (#11) and Notifications (#12). */
const ProfileScreen = () => {
  const navigation = useNavigation();
  const { worker, signOut, refreshWorker } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const t = useT();
  const { language, changeLanguage } = useLanguageState();

  const reload = async () => {
    setRefreshing(true);
    try {
      await refreshWorker();
    } catch {
      // Nothing to say — the cached profile is still on screen.
    } finally {
      setRefreshing(false);
    }
  };

  const confirmLogout = () =>
    Alert.alert(t('worker.logoutTitle'), t('worker.logoutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('worker.logout'), style: 'destructive', onPress: () => signOut() },
    ]);

  if (!worker) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('worker.profile')}</Text>
        </View>
        <LoadingState message={t('worker.loadingProfile')} />
      </View>
    );
  }

  const memberYear = worker.member_since ? new Date(worker.member_since).getFullYear() : t('worker.notSet');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('worker.profile')}</Text>
        <StatusBadge
          label={worker.is_available ? t('worker.availableShort') : t('worker.offline')}
          color={worker.is_available ? 'success' : 'neutral'}
          size="sm"
        />
      </View>

      {/* Profile Hero */}
      <View style={styles.heroSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{initialsOf(worker.name)}</Text>
        </View>
        <Text style={styles.heroName}>{worker.name}</Text>
        <Text style={styles.heroCode}>{worker.worker_code}</Text>
        {worker.skills.length > 0 && (
          <View style={styles.heroSkills}>
            {worker.skills.map((skill) => (
              <View key={skill} style={styles.skillPill}>
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.ratingRow}>
          <RatingStars
            rating={worker.rating_avg}
            size={20}
            showValue
            valueStyle={{ color: COLORS.white }}
          />
             <Text style={styles.ratingCount}>
             ({t(worker.rating_count === 1 ? 'worker.review_one' : 'worker.review_other', { count: worker.rating_count })})
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={COLORS.primary} />
        }
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{worker.completed_jobs}</Text>
            <Text style={styles.statLabel}>{t('worker.jobsDone')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{worker.rating_avg.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('worker.rating')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{memberYear}</Text>
            <Text style={styles.statLabel}>{t('worker.since')}</Text>
          </Card>
        </View>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('worker.personalInfo')}</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialCommunityIcons name="phone" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('worker.phone')}</Text>
              <Text style={styles.infoValue}>{worker.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.successLight }]}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('worker.city')}</Text>
              <Text style={styles.infoValue}>{worker.city ?? t('worker.notSet')}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warningLight }]}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#B45309" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('worker.aadhaar')}</Text>
              <Text style={styles.infoValue}>{worker.aadhaar_masked ?? t('worker.notOnFile')}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.infoLight }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('worker.society')}</Text>
              <Text style={styles.infoValue}>{worker.society_name ?? t('worker.notSet')}</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.infoNote}>
          {t('worker.profileNote')}
        </Text>

        {/* Language Selection */}
        <Card style={styles.languageCard}>
          <View style={styles.languageTitleRow}>
            <MaterialCommunityIcons name="translate" size={20} color={COLORS.primary} />
            <Text style={styles.languageTitle}>{t('language.settingTitle')}</Text>
          </View>
          <View style={styles.languagePillsRow}>
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langPill, isSelected && styles.langPillActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={[styles.langText, isSelected && styles.langTextActive]}>
                    {lang.native}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Ratings')}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.warningLight }]}>
            <MaterialCommunityIcons name="star" size={20} color="#B45309" />
          </View>
          <Text style={styles.menuLabel}>{t('worker.ratings')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Notifications live on the Home stack — that's where its tap targets are. */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.infoLight }]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.info} />
          </View>
          <Text style={styles.menuLabel}>{t('worker.notifications')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
            <MaterialCommunityIcons name="lock-reset" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuLabel}>{t('worker.changePassword')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          activeOpacity={0.7}
          onPress={confirmLogout}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.dangerLight }]}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
          </View>
          <Text style={[styles.menuLabel, { color: COLORS.danger }]}>{t('worker.logout')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('worker.appVersion')}</Text>

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
  heroCode: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 1,
    marginTop: 2,
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
  ratingCount: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONT_WEIGHT.medium,
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
    marginBottom: SPACING.md,
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
  infoNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    lineHeight: 17,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  languageCard: {
    marginBottom: SPACING.lg,
  },
  languageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  languageTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  languagePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  langPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  langText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  langTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
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
