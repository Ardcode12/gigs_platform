import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../theme';

const StatusBadge = ({ label, color = 'primary', size = 'md', icon }) => {
  const colorMap = {
    primary: { bg: COLORS.primaryLight, text: COLORS.primary },
    success: { bg: COLORS.successLight, text: COLORS.textSuccess },
    warning: { bg: COLORS.warningLight, text: '#B45309' },
    danger: { bg: COLORS.dangerLight, text: COLORS.textDanger },
    info: { bg: COLORS.infoLight, text: '#0369A1' },
    neutral: { bg: COLORS.borderLight, text: COLORS.textSecondary },
  };

  const sizeMap = {
    sm: { fontSize: FONT_SIZE.xs, paddingH: SPACING.sm, paddingV: 3 },
    md: { fontSize: FONT_SIZE.sm, paddingH: SPACING.md, paddingV: 5 },
    lg: { fontSize: FONT_SIZE.md, paddingH: SPACING.lg, paddingV: 7 },
  };

  const { bg, text } = colorMap[color] || colorMap.primary;
  const { fontSize, paddingH, paddingV } = sizeMap[size] || sizeMap.md;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: paddingH, paddingVertical: paddingV }]}>
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text style={[styles.label, { color: text, fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});

export default StatusBadge;
