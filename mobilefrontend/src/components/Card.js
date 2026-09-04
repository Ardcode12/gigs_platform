import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../theme';

const Card = ({ children, style, variant = 'default', noPadding = false }) => {
  const variantStyles = {
    default: {},
    primary: { backgroundColor: COLORS.primary },
    success: { backgroundColor: COLORS.successLight, borderColor: COLORS.success, borderWidth: 1 },
    warning: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning, borderWidth: 1 },
    danger: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger, borderWidth: 1 },
    info: { backgroundColor: COLORS.infoLight, borderColor: COLORS.info, borderWidth: 1 },
  };

  return (
    <View
      style={[
        styles.card,
        !noPadding && styles.padding,
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  padding: {
    padding: SPACING.lg,
  },
});

export default Card;
