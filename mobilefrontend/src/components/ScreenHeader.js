import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../theme';

/**
 * The blue back-header repeated across NewJobRequest, CurrentJob, Chat and
 * RequestExtraAmount, extracted so the four stay in step.
 */
const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  right,
  variant = 'primary', // primary | plain
  children,
}) => {
  const insets = useSafeAreaInsets();
  const isPrimary = variant === 'primary';

  const tint = isPrimary ? COLORS.textWhite : COLORS.textPrimary;
  const subTint = isPrimary ? 'rgba(255,255,255,0.85)' : COLORS.textSecondary;

  return (
    <View
      style={[
        styles.header,
        isPrimary ? styles.primary : styles.plain,
        { paddingTop: insets.top + SPACING.md },
      ]}
    >
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={tint} />
          </TouchableOpacity>
        )}

        <View style={styles.titles}>
          <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: subTint }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {right ?? <View style={styles.rightSpacer} />}
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  plain: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  rightSpacer: {
    width: 40,
  },
});

export default ScreenHeader;
