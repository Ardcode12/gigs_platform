import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';

const IconButton = ({
  icon,
  label,
  onPress,
  color = COLORS.primary,
  bgColor,
  size = 'md',
  variant = 'filled', // filled | outline | ghost
  fullWidth = false,
  disabled = false,
  iconPack, // optional override
}) => {
  const sizeMap = {
    sm: { iconSize: 18, fontSize: FONT_SIZE.sm, padding: SPACING.sm, minH: 36 },
    md: { iconSize: 22, fontSize: FONT_SIZE.md, padding: SPACING.md, minH: 48 },
    lg: { iconSize: 26, fontSize: FONT_SIZE.lg, padding: SPACING.lg, minH: 56 },
    xl: { iconSize: 30, fontSize: FONT_SIZE.xl, padding: SPACING.xl, minH: 64 },
  };

  const { iconSize, fontSize, padding, minH } = sizeMap[size] || sizeMap.md;

  const getVariantStyle = () => {
    if (disabled) {
      return {
        container: { backgroundColor: COLORS.border },
        text: COLORS.textTertiary,
        iconColor: COLORS.textTertiary,
      };
    }
    switch (variant) {
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color },
          text: color,
          iconColor: color,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: color,
          iconColor: color,
        };
      default:
        return {
          container: { backgroundColor: bgColor || color },
          text: COLORS.textWhite,
          iconColor: COLORS.textWhite,
        };
    }
  };

  const vs = getVariantStyle();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { minHeight: minH, paddingHorizontal: padding * 1.5, paddingVertical: padding },
        vs.container,
        fullWidth && styles.fullWidth,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={vs.iconColor}
          style={label ? { marginRight: SPACING.sm } : {}}
        />
      )}
      {label && (
        <Text style={[styles.label, { color: vs.text, fontSize }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});

export default IconButton;
