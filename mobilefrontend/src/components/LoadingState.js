import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';
import { useT } from '../i18n/LanguageContext';

const LoadingState = ({ message, style }) => {
  const t = useT();
  return <View style={[styles.container, style]}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.text}>{message ?? t('shared.loading')}</Text></View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  text: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
});

export default LoadingState;
