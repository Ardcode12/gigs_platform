/**
 * Which font family renders which language.
 *
 * Poppins carries the whole app in English, but it has **no Tamil, Malayalam,
 * Telugu or Devanagari glyphs** — under Poppins those four languages render as
 * tofu boxes (□□□□). So the font is a function of the active language, and
 * globalFonts.js resolves it per render rather than once at module load.
 *
 * Only the active language's faces are loaded (loadFontsFor), so a Tamil user
 * never downloads the Telugu faces. English is loaded eagerly in App.js because
 * it is the default and the first frame has to draw in something.
 *
 * Four weights per script rather than all nine: at 11–17px the difference
 * between 700Bold and 800ExtraBold in an Indic script is not visible, so 800
 * and 900 both resolve to bold. 500Medium is kept because FONT_WEIGHT.medium is
 * used heavily for body emphasis and that difference *is* visible.
 */

import * as Font from 'expo-font';

export const DEFAULT_LANGUAGE = 'en';

/**
 * A style's fontWeight, as written in a stylesheet, mapped to a semantic slot.
 *
 * theme.js stores weights as strings ('400'…'800'); String() also folds in the
 * numeric form and the `bold`/`normal` keywords that inline styles use.
 */
const WEIGHT_SLOT = {
  100: 'regular',
  200: 'regular',
  300: 'regular',
  400: 'regular',
  normal: 'regular',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
  bold: 'bold',
  800: 'bold',
  900: 'bold',
};

/** language → slot → registered family name. */
export const FONT_FAMILIES = {
  en: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  ta: {
    regular: 'NotoSansTamil_400Regular',
    medium: 'NotoSansTamil_500Medium',
    semibold: 'NotoSansTamil_600SemiBold',
    bold: 'NotoSansTamil_700Bold',
  },
  ml: {
    regular: 'NotoSansMalayalam_400Regular',
    medium: 'NotoSansMalayalam_500Medium',
    semibold: 'NotoSansMalayalam_600SemiBold',
    bold: 'NotoSansMalayalam_700Bold',
  },
  hi: {
    regular: 'NotoSansDevanagari_400Regular',
    medium: 'NotoSansDevanagari_500Medium',
    semibold: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  },
  te: {
    regular: 'NotoSansTelugu_400Regular',
    medium: 'NotoSansTelugu_500Medium',
    semibold: 'NotoSansTelugu_600SemiBold',
    bold: 'NotoSansTelugu_700Bold',
  },
};

/**
 * The .ttf assets behind each language, required lazily.
 *
 * Each entry is a thunk: Metro needs static require specifiers, but calling the
 * thunk only when a language is actually selected keeps the other four scripts
 * out of the startup path. English is absent on purpose — App.js loads Poppins
 * eagerly with Font.useFonts.
 */
const FONT_ASSETS = {
  ta: () => ({
    NotoSansTamil_400Regular: require('@expo-google-fonts/noto-sans-tamil/400Regular/NotoSansTamil_400Regular.ttf'),
    NotoSansTamil_500Medium: require('@expo-google-fonts/noto-sans-tamil/500Medium/NotoSansTamil_500Medium.ttf'),
    NotoSansTamil_600SemiBold: require('@expo-google-fonts/noto-sans-tamil/600SemiBold/NotoSansTamil_600SemiBold.ttf'),
    NotoSansTamil_700Bold: require('@expo-google-fonts/noto-sans-tamil/700Bold/NotoSansTamil_700Bold.ttf'),
  }),
  ml: () => ({
    NotoSansMalayalam_400Regular: require('@expo-google-fonts/noto-sans-malayalam/400Regular/NotoSansMalayalam_400Regular.ttf'),
    NotoSansMalayalam_500Medium: require('@expo-google-fonts/noto-sans-malayalam/500Medium/NotoSansMalayalam_500Medium.ttf'),
    NotoSansMalayalam_600SemiBold: require('@expo-google-fonts/noto-sans-malayalam/600SemiBold/NotoSansMalayalam_600SemiBold.ttf'),
    NotoSansMalayalam_700Bold: require('@expo-google-fonts/noto-sans-malayalam/700Bold/NotoSansMalayalam_700Bold.ttf'),
  }),
  hi: () => ({
    NotoSansDevanagari_400Regular: require('@expo-google-fonts/noto-sans-devanagari/400Regular/NotoSansDevanagari_400Regular.ttf'),
    NotoSansDevanagari_500Medium: require('@expo-google-fonts/noto-sans-devanagari/500Medium/NotoSansDevanagari_500Medium.ttf'),
    NotoSansDevanagari_600SemiBold: require('@expo-google-fonts/noto-sans-devanagari/600SemiBold/NotoSansDevanagari_600SemiBold.ttf'),
    NotoSansDevanagari_700Bold: require('@expo-google-fonts/noto-sans-devanagari/700Bold/NotoSansDevanagari_700Bold.ttf'),
  }),
  te: () => ({
    NotoSansTelugu_400Regular: require('@expo-google-fonts/noto-sans-telugu/400Regular/NotoSansTelugu_400Regular.ttf'),
    NotoSansTelugu_500Medium: require('@expo-google-fonts/noto-sans-telugu/500Medium/NotoSansTelugu_500Medium.ttf'),
    NotoSansTelugu_600SemiBold: require('@expo-google-fonts/noto-sans-telugu/600SemiBold/NotoSansTelugu_600SemiBold.ttf'),
    NotoSansTelugu_700Bold: require('@expo-google-fonts/noto-sans-telugu/700Bold/NotoSansTelugu_700Bold.ttf'),
  }),
};

/**
 * Resolve a language + style weight to a registered family name.
 *
 * Called on every Text render, so it stays a couple of object lookups. An
 * unknown language falls back to English rather than to undefined — a wrong
 * font is recoverable, a crashed render is not.
 */
export const familyFor = (language, fontWeight) => {
  const families = FONT_FAMILIES[language] ?? FONT_FAMILIES[DEFAULT_LANGUAGE];
  const slot = WEIGHT_SLOT[String(fontWeight)] ?? 'regular';
  return families[slot];
};

const loaded = new Set([DEFAULT_LANGUAGE]);

/** True once this language's faces are registered and safe to render with. */
export const areFontsLoaded = (language) => loaded.has(language);

/**
 * Register a language's faces. Idempotent, and resolves immediately for a
 * language already loaded (or one with no assets of its own, i.e. English).
 *
 * Never rejects: if a face fails to load the caller still has to render
 * something, and English is a readable fallback. Failing to switch language is
 * better than a blank app.
 */
export const loadFontsFor = async (language) => {
  if (loaded.has(language)) return true;

  const assets = FONT_ASSETS[language];
  if (!assets) {
    loaded.add(language);
    return true;
  }

  try {
    await Font.loadAsync(assets());
    loaded.add(language);
    return true;
  } catch (error) {
    if (__DEV__) console.warn(`[i18n] could not load fonts for "${language}"`, error);
    return false;
  }
};
