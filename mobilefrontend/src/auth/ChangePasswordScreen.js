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

/**
 * Two jobs in one screen:
 *   - `forced` (no back button): shown by the navigator when the society-issued
 *     password has never been changed, and there is no way past it but through;
 *   - voluntary, opened from Profile.
 */
const ChangePasswordScreen = () => {
  const navigation = useNavigation();
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
        title={forced ? 'Choose a Password' : 'Change Password'}
        subtitle={forced ? 'Required before you can start working' : undefined}
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
                  Your society set your first password. Choose one only you know before you start
                  taking jobs.
                </Text>
              </View>
            )}

            <Input
              label={forced ? 'Password from your society' : 'Current Password'}
              value={current}
              onChangeText={setCurrent}
              placeholder="Enter your current password"
              icon="lock-outline"
              secure
              maxLength={128}
            />

            <Input
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              icon="lock-plus-outline"
              secure
              maxLength={128}
              error={sameAsOld ? 'Choose a password different from the current one.' : undefined}
            />

            <Input
              label="Confirm New Password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Type it again"
              icon="lock-check-outline"
              secure
              maxLength={128}
              error={mismatch ? 'The two passwords do not match.' : undefined}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <IconButton
              label={forced ? 'Save & Continue' : 'Update Password'}
              icon="check"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
            />

            {forced && (
              <IconButton
                label="Sign out instead"
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
