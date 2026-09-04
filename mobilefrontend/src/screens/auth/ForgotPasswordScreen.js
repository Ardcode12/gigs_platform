import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../theme';
import ScreenHeader from '../../components/ScreenHeader';
import Input from '../../components/Input';
import IconButton from '../../components/IconButton';
import { forgotPassword } from '../../api/auth';

/**
 * Step one of the reset flow: identify the account, receive a code on the phone
 * the society registered.
 *
 * The server answers identically whether or not the worker exists, so a wrong
 * ID here looks the same as a right one — it just never yields a working code.
 */
const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = identifier.trim().length >= 3 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await forgotPassword(identifier.trim());
      navigation.navigate('ResetPassword', {
        identifier: identifier.trim(),
        maskedPhone: data.masked_phone,
        // Present only while the backend runs with DEV_MODE on.
        devCode: data.dev_code ?? null,
      });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Forgot Password"
        subtitle="We'll send a code to your registered phone"
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
            <View style={styles.iconRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="cellphone-message"
                  size={34}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.lead}>
              Enter your worker ID or phone number. We&apos;ll send a 6-digit code to the phone
              number your society has on file.
            </Text>

            <Input
              label="Worker ID or Phone"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="WM1042 or 9876543210"
              icon="account-outline"
              maxLength={32}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <IconButton
              label="Send Reset Code"
              icon="send"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
            />

            <IconButton
              label="I already have a code"
              onPress={() =>
                navigation.navigate('ResetPassword', { identifier: identifier.trim() })
              }
              variant="ghost"
              size="md"
              fullWidth
              style={styles.secondary}
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
  iconRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lead: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
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

export default ForgotPasswordScreen;
