import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

/** Labelled text field with an optional leading icon and a password reveal. */
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure = false,
  error,
  hint,
  editable = true,
  autoCapitalize = 'none',
  keyboardType = 'default',
  maxLength,
  returnKeyType,
  onSubmitEditing,
  style,
  inputStyle,
  textAlign,
  letterSpacing,
}) => {
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {!!icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={focused ? COLORS.primary : COLORS.textTertiary}
            style={styles.icon}
          />
        )}

        <TextInput
          style={[styles.input, !!letterSpacing && { letterSpacing }, textAlign && { textAlign }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={hidden}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secure && (
          <TouchableOpacity
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  fieldFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  fieldError: {
    borderColor: COLORS.danger,
  },
  fieldDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  error: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDanger,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  hint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
});

export default Input;
