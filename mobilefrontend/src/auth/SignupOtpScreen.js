import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import Input from '../components/Input';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';

/**
 * Step two of Customer Registration:
 * Verify the phone number by entering the 6-digit OTP before the account is created.
 */
const SignupOtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { signUpCustomer, sendSignupOtp } = useAuth();

  const {
    name = '',
    phone = '',
    email = null,
    password = '',
    city = null,
    maskedPhone = '',
    devCode: initialDevCode = null,
  } = route.params ?? {};

  const [devCode, setDevCode] = useState(initialDevCode);
  const [code, setCode] = useState(initialDevCode ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const canSubmit = code.trim().length >= 4 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUpCustomer({
        name,
        phone,
        email: email || null,
        password,
        city: city || null,
        otp: code.trim(),
      });
      // Upon successful sign-up, AuthContext sets role to customer,
      // which automatically replaces the SignedOut stack with the Customer stack.
    } catch (caught) {
      setError(caught.message || 'Failed to verify code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const data = await sendSignupOtp({ phone, email });
      if (data?.dev_code) {
        setDevCode(data.dev_code);
        setCode(data.dev_code);
      }
      setCountdown(30);
    } catch (caught) {
      setError(caught.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Verify Phone"
        subtitle={maskedPhone ? `Code sent to ${maskedPhone}` : `Code sent to ${phone}`}
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
                  name="shield-check-outline"
                  size={38}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <Text style={styles.lead}>
              Please enter the 6-digit verification code sent to your mobile number to complete your
              account setup.
            </Text>

            {!!devCode && (
              <View style={styles.devBox}>
                <MaterialCommunityIcons name="flask-outline" size={18} color="#B45309" />
                <Text style={styles.devText}>
                  Dev mode: code {devCode} was automatically filled for testing.
                </Text>
              </View>
            )}

            <Input
              label="6-Digit Verification Code"
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
              placeholder="······"
              icon="numeric"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              letterSpacing={10}
              inputStyle={styles.codeInput}
              hint="The code expires in 10 minutes."
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Resend code in <Text style={styles.timerBold}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  activeOpacity={0.7}
                  style={styles.resendButton}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={16}
                    color={COLORS.primary}
                    style={styles.resendIcon}
                  />
                  <Text style={styles.resendText}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

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
              label="Verify & Create Account"
              icon="check-circle"
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.changePhoneButton}
              activeOpacity={0.7}
            >
              <Text style={styles.changePhoneText}>Need to change phone number?</Text>
            </TouchableOpacity>
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
    marginBottom: SPACING.lg,
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
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  devBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
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
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -SPACING.xs,
    marginBottom: SPACING.lg,
  },
  countdownText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  timerBold: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  resendIcon: {
    marginRight: 4,
  },
  resendText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    fontWeight: FONT_WEIGHT.medium,
  },
  submit: {
    marginTop: SPACING.xs,
  },
  changePhoneButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  changePhoneText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
});

export default SignupOtpScreen;
