import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

const Card = ({ children, style, variant = 'default', noPadding = false }) => {
  const variantStyles = {
    default: {},
    primary: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 1.5 },
    success: { backgroundColor: COLORS.successLight, borderColor: COLORS.success, borderWidth: 1.5 },
    warning: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning, borderWidth: 1.5 },
    danger: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger, borderWidth: 1.5 },
    info: { backgroundColor: COLORS.infoLight, borderColor: COLORS.info, borderWidth: 1.5 },
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, // 16px standardized
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  padding: {
    padding: SPACING.md, // 16px standardized padding
  },
});

export default Card;
