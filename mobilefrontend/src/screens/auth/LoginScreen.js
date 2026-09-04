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
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '../../theme';
import Input from '../../components/Input';
import IconButton from '../../components/IconButton';
import { useAuth } from '../../context/AuthContext';

/**
 * Spec #1. Workers do not self-register: the society issues a worker code and a
 * password, so this screen accepts the code *or* the registered phone number and
 * the backend resolves whichever it matches.
 */
const LoginScreen = () => {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = identifier.trim().length >= 3 && password.length > 0 && !submitting;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(identifier.trim(), password);
      // Nothing to navigate: the auth gate swaps the whole stack out.
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
              <MaterialCommunityIcons name="tools" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.brand}>WORKMAT</Text>
            <Text style={styles.tagline}>Worker App</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Use the worker ID your society gave you, or your registered phone number.
            </Text>

            <Input
              label="Worker ID or Phone"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="WM1042 or 9876543210"
              icon="account-outline"
              maxLength={32}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              icon="lock-outline"
              secure
              maxLength={128}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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
              label="Sign In"
              icon="login"
              onPress={handleLogin}
              disabled={!canSubmit}
              loading={submitting}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgot}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.note}>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.noteText}>
              Accounts are created by your society. Contact your society office if you don&apos;t
              have a worker ID.
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
    marginBottom: SPACING.xxl,
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
