import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import { resetPassword } from '../api/auth';
import { useT } from '../i18n/LanguageContext';

/** Step two of the reset flow: the 6-digit code plus the new password. */
const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const { identifier: initialIdentifier = '', maskedPhone, devCode } = useRoute().params ?? {};

  const [identifier, setIdentifier] = useState(initialIdentifier);
  // In DEV_MODE the backend hands the code back, so it is pre-filled here.
  const [code, setCode] = useState(devCode ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    identifier.trim().length >= 3 &&
    code.trim().length >= 4 &&
    password.length >= 6 &&
    !mismatch &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(identifier.trim(), code.trim(), password);
      setDone(true);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
         <ScreenHeader title={t('auth.passwordReset')} />
        <View style={styles.success}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="check-bold" size={44} color={COLORS.white} />
          </View>
           <Text style={styles.successTitle}>{t('auth.passwordUpdated')}</Text>
          <Text style={styles.successBody}>
             {t('auth.signInNewPassword')}
          </Text>
          <IconButton
             label={t('auth.backSignIn')}
            icon="login"
            onPress={() => navigation.navigate('Login')}
            size="lg"
            fullWidth
            style={styles.successButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('auth.resetTitle')}
        subtitle={maskedPhone ? t('auth.codeSent', { phone: maskedPhone }) : t('auth.enterCode')}
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView style={styles.flex} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!!devCode && (
              <View style={styles.devBox}>
                <MaterialCommunityIcons name="flask-outline" size={18} color="#B45309" />
                <Text style={styles.devText}>
                  Dev mode: the server returned code {devCode}, so it is filled in for you. With
                  SMS wired up this box disappears.
                </Text>
              </View>
            )}

            {!initialIdentifier && (
              <Input
                label={t('auth.workerIdOrPhone')}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t('auth.workerIdPlaceholder')}
                icon="account-outline"
                maxLength={32}
              />
            )}

            <Input
              label={t('auth.code')}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
              placeholder={t('auth.codePlaceholder')}
              icon="numeric"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              letterSpacing={10}
              inputStyle={styles.codeInput}
              hint={t('auth.codeHint')}
            />

            <Input
              label={t('auth.newPassword')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordCreatePlaceholder')}
              icon="lock-outline"
              secure
              maxLength={128}
            />

            <Input
              label={t('auth.confirmPassword')}
              value={confirm}
              onChangeText={setConfirm}
              placeholder={t('auth.confirmPlaceholder')}
              icon="lock-check-outline"
              secure
              maxLength={128}
               error={mismatch ? t('auth.passwordMismatch') : undefined}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <IconButton
               label={t('auth.setPassword')}
              icon="lock-reset"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: SPACING.xl,
  },
  devBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  devText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: '#92400E',
    lineHeight: 16,
  },
  codeInput: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  error: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDanger,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.lg,
  },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
  },
  successBody: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  successButton: {
    marginTop: SPACING.xxl,
  },
});

export default ResetPasswordScreen;
