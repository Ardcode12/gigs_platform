import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';
import IconButton from './IconButton';

/**
 * Empty and error states share a shape: an icon, an explanation, and at most one
 * thing to do about it. `tone="error"` turns the icon red and is what screens
 * render when a fetch failed.
 */
const EmptyState = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral', // neutral | error
  style,
}) => {
  const isError = tone === 'error';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, isError && styles.iconCircleError]}>
        <MaterialCommunityIcons
          name={isError ? 'wifi-off' : icon}
          size={36}
          color={isError ? COLORS.danger : COLORS.textTertiary}
        />
      </View>

      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}

      {!!actionLabel && !!onAction && (
        <IconButton
          icon={isError ? 'refresh' : undefined}
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          size="md"
          style={styles.action}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxl,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircleError: {
    backgroundColor: COLORS.dangerLight,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  action: {
    marginTop: SPACING.xl,
  },
});

export default EmptyState;
