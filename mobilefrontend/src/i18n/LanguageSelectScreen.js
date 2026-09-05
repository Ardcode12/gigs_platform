import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGES } from './index';
import { useLanguageState, useT } from './LanguageContext';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOWS, SPACING } from '../theme';

const LanguageSelectScreen = () => {
  const t = useT();
  const { changeLanguage } = useLanguageState();
  const [selecting, setSelecting] = useState(false);

  const select = async (code) => {
    if (selecting) return;
    setSelecting(true);
    await changeLanguage(code);
    setSelecting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandMark}>
        <Text style={styles.brand}>WORKMAT</Text>
      </View>
      <Text style={styles.title}>{t('language.title')}</Text>
      <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
      <View style={styles.options}>
        {LANGUAGES.map((language) => (
          <Pressable
            key={language.code}
            accessibilityRole="button"
            accessibilityLabel={language.native}
            disabled={selecting}
            onPress={() => select(language.code)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            <Text style={styles.native}>{language.native}</Text>
            <Text style={styles.english}>{language.label}</Text>
            {selecting && <ActivityIndicator color={COLORS.primary} size="small" />}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  brandMark: {
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xxxl,
    ...SHADOWS.md,
  },
  brand: { color: COLORS.white, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 1 },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxl },
  options: { gap: SPACING.md },
  option: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', ...SHADOWS.sm },
  optionPressed: { backgroundColor: COLORS.primaryLight },
  native: { flex: 1, color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  english: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginRight: SPACING.md },
});

export default LanguageSelectScreen;
