import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../theme';

const StepperProgress = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepRow}>
            {/* Circle + Line */}
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
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

            {/* Label */}
            <Text
              style={[
                styles.label,
                isCompleted && styles.labelCompleted,
                isCurrent && styles.labelCurrent,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: COLORS.success,
  },
  circleCurrent: {
    backgroundColor: COLORS.primary,
  },
  circleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textTertiary,
  },
  circleTextCurrent: {
    color: COLORS.white,
  },
  line: {
    width: 2,
    height: 28,
    backgroundColor: COLORS.border,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHT.medium,
    paddingTop: 4,
    paddingBottom: 20,
  },
  labelCompleted: {
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.semibold,
  },
  labelCurrent: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});

export default StepperProgress;
