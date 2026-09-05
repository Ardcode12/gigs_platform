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
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { useT } from '../i18n/LanguageContext';

/**
 * Two jobs in one screen:
 *   - `forced` (no back button): shown by the navigator when the society-issued
 *     password has never been changed, and there is no way past it but through;
 *   - voluntary, opened from Profile.
 */
const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const t = useT();
  const { mustChangePassword, completePasswordChange, signOut } = useAuth();
  const forced = useRoute().params?.forced ?? mustChangePassword;

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const sameAsOld = password.length > 0 && password === current;
  const canSubmit =
    current.length > 0 && password.length >= 6 && !mismatch && !sameAsOld && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      if (forced) {
        // Clears the flag in context, which lets the navigator show the tabs.
        await completePasswordChange(current, password);
      } else {
        await changePassword(current, password);
        navigation.goBack();
      }
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={forced ? t('auth.choosePassword') : t('auth.changePassword')}
        subtitle={forced ? t('auth.changePasswordSubtitle') : undefined}
        onBack={forced ? undefined : () => navigation.goBack()}
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
            {forced && (
              <View style={styles.notice}>
                <MaterialCommunityIcons name="shield-key-outline" size={20} color={COLORS.primary} />
                <Text style={styles.noticeText}>
                  {t('auth.firstPasswordNotice')}
                </Text>
              </View>
            )}

            <Input
              label={forced ? t('auth.societyPassword') : t('auth.currentPassword')}
              value={current}
              onChangeText={setCurrent}
              placeholder={t('auth.currentPasswordPlaceholder')}
              icon="lock-outline"
              secure
              maxLength={128}
            />

            <Input
              label={t('auth.newPassword')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordCreatePlaceholder')}
              icon="lock-plus-outline"
              secure
              maxLength={128}
               error={sameAsOld ? t('auth.differentPassword') : undefined}
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
              label={forced ? t('auth.saveContinue') : t('auth.updatePassword')}
              icon="check"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
            />

            {forced && (
              <IconButton
                 label={t('auth.signOutInstead')}
                onPress={signOut}
                variant="ghost"
                color={COLORS.textSecondary}
                size="md"
                fullWidth
                style={styles.secondary}
              />
            )}
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  noticeText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    lineHeight: 19,
  },
  error: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textDanger,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.lg,
  },
  secondary: {
    marginTop: SPACING.md,
  },
});

export default ChangePasswordScreen;
