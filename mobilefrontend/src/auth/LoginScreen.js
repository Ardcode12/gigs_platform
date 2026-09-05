import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '../theme';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/LanguageContext';

/**
 * Spec #1 — the single login for both roles.
 *
 * The two roles are deliberately asymmetric, and the toggle at the top is what
 * makes that legible in one screen:
 *
 *   Worker   — no registration at all. The society issues a worker code and sets
 *              the password, so the field accepts the code *or* the registered
 *              phone and the backend resolves whichever it matches.
 *   Customer — self-service, so it keeps a Sign up tab.
 *
 * There is no customer backend yet, so customer sign-in opens the customer app
 * against its mock data (see AuthContext.signInCustomer).
 */

const ROLE_TABS = [
  { key: 'worker', label: 'Worker', icon: 'tools' },
  { key: 'customer', label: 'Customer', icon: 'account' },
];

const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn, signInCustomer, sendSignupOtp } = useAuth();
  const t = useT();

  const [role, setRole] = useState('worker');
  // Customer-only: registration is not offered to workers.
  const [isRegister, setIsRegister] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isWorker = role === 'worker';

  const switchRole = (next) => {
    if (next === role) return;
    setRole(next);
    setIsRegister(false);
    setError(null);
    setPassword('');
  };

  const canSubmit =
    !submitting &&
    identifier.trim().length >= 3 &&
    password.length > 0 &&
    (!isRegister ||
      (fullName.trim().length >= 2 && identifier.trim().length >= 10 && password.length >= 6));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (isWorker) {
        await signIn(identifier.trim(), password);
      } else if (isRegister) {
        const data = await sendSignupOtp({
          phone: identifier.trim(),
          email: email.trim() || null,
        });
        navigation.navigate('SignupOtp', {
          name: fullName.trim(),
          phone: identifier.trim(),
          email: email.trim() || null,
          password,
          maskedPhone: data?.masked_phone,
          devCode: data?.dev_code ?? null,
        });
      } else {
        await signInCustomer(identifier.trim(), password);
      }
      // Nothing to navigate for sign in: the auth gate swaps the whole stack out.
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <MaterialCommunityIcons
                name={isWorker ? 'tools' : 'account-hard-hat'}
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.brand}>WORKMAT</Text>
            <Text style={styles.tagline}>{isWorker ? t('auth.roleWorker') : t('auth.roleCustomer')}</Text>
          </View>

          <View style={styles.roleSwitch}>
            {ROLE_TABS.map((tab) => {
              const active = tab.key === role;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.rolePill, active && styles.rolePillActive]}
                  onPress={() => switchRole(tab.key)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={active ? COLORS.primary : 'rgba(255,255,255,0.85)'}
                  />
                  <Text style={[styles.roleText, active && styles.roleTextActive]}>
                    {tab.key === 'worker' ? t('auth.roleWorker') : t('auth.roleCustomer')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.card}>
            {/* Workers cannot self-register, so the Sign in / Sign up tabs only
                exist on the customer side. */}
            {isWorker ? (
              <>
                <Text style={styles.title}>{t('auth.signIn')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.signInHintWorker')}
                </Text>
              </>
            ) : (
              <View style={styles.modeTabs}>
                <TouchableOpacity
                  style={[styles.modeTab, !isRegister && styles.modeTabActive]}
                  onPress={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeText, !isRegister && styles.modeTextActive]}>
                    {t('auth.signIn')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, isRegister && styles.modeTabActive]}
                  onPress={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeText, isRegister && styles.modeTextActive]}>
                    {t('auth.signUp')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isRegister && (
              <Input
                label={t('auth.fullName')}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.fullNamePlaceholder')}
                icon="account-outline"
                autoCapitalize="words"
                maxLength={64}
                returnKeyType="next"
              />
            )}

            <Input
              label={isWorker ? t('auth.workerIdOrPhone') : t('auth.mobileNumber')}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={isWorker ? t('auth.workerIdPlaceholder') : t('auth.mobilePlaceholder')}
              icon={isWorker ? 'account-outline' : 'phone-outline'}
              keyboardType={isWorker ? 'default' : 'phone-pad'}
              maxLength={32}
              returnKeyType="next"
            />

            {isRegister && (
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                icon="email-outline"
                keyboardType="email-address"
                maxLength={120}
                returnKeyType="next"
              />
            )}

            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder={isRegister ? t('auth.passwordCreatePlaceholder') : t('auth.passwordPlaceholder')}
              icon="lock-outline"
              secure
              maxLength={128}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {!!error && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={COLORS.danger}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <IconButton
              label={isRegister ? t('auth.continueVerification') : t('auth.signInAction')}
              icon={isRegister ? 'arrow-right-circle' : 'login'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            {/* Reset codes go to the registered phone, which only workers have on
                file — the customer flow has no backend to reset against yet. */}
            {isWorker && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgot}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.note}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.noteText}>
              {isWorker
                ? t('auth.noteWorker')
                : t('auth.noteCustomer')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxxl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  brand: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textWhite,
    letterSpacing: 2,
    marginTop: SPACING.lg,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  roleSwitch: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  rolePillActive: {
    backgroundColor: COLORS.white,
  },
  roleText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.85)',
  },
  roleTextActive: {
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    lineHeight: 19,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  modeTabActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  modeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  modeTextActive: {
    color: COLORS.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDanger,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 18,
  },
  submit: {
    marginTop: SPACING.xs,
  },
  forgot: {
    alignSelf: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  forgotText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  noteText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
});

export default LoginScreen;
