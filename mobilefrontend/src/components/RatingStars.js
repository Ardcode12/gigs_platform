import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';

/**
 * Five stars with half-star support.
 *
 * Replaces the `renderStars` helper that was copy-pasted into NewJobRequestScreen
 * and ProfileScreen.
 */
const RatingStars = ({
  rating = 0,
  size = 16,
  showValue = false,
  showCount = false,
  count = 0,
  color = COLORS.warning,
  valueStyle,
}) => {
  const value = Number(rating) || 0;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        let name = 'star-outline';
        if (value >= star) name = 'star';
        else if (value >= star - 0.5) name = 'star-half-full';

        return <MaterialCommunityIcons key={star} name={name} size={size} color={color} />;
      })}

      {showValue && (
        <Text style={[styles.value, { fontSize: size * 0.85 }, valueStyle]}>
          {value.toFixed(1)}
        </Text>
      )}
      {showCount && (
        <Text style={[styles.count, { fontSize: size * 0.8 }]}>
          ({count})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    marginLeft: SPACING.xs,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  count: {
    marginLeft: 3,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default RatingStars;
