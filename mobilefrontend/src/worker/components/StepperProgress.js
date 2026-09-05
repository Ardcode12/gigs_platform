import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../theme';
import { useT } from '../../i18n/LanguageContext';

const StepperProgress = ({ steps, currentStep }) => {
  const t = useT();
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepRow}>
            {/* Step Indicator (Circle & Vertical Connecting Line) */}
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons name="check-bold" size={16} color={COLORS.white} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isCurrent && styles.circleTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.lineCompleted,
                  ]}
                />
              )}
            </View>

            {/* Step Label & Status */}
            <View style={styles.labelContainer}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.label,
                    isCompleted && styles.labelCompleted,
                    isCurrent && styles.labelCurrent,
                  ]}
                >
                  {t(step)}
                </Text>
                {isCurrent && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{t('worker.activeNow')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stepDesc}>
                {isCompleted && t('worker.completed')}
                {isCurrent && t('worker.inProgressUpdate')}
                {!isCompleted && !isCurrent && t('worker.upcomingStep')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    width: 34,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  circleCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  circleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  circleTextCurrent: {
    color: COLORS.white,
  },
  line: {
    width: 2.5,
    height: 36,
    backgroundColor: COLORS.border,
    marginVertical: 3,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  labelContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    paddingBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  labelCompleted: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  labelCurrent: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },
  activeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

export default StepperProgress;
