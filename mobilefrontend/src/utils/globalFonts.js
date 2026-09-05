/**
 * Give every Text and TextInput the right font for the active language.
 *
 * Poppins carries the app in English. It has **no Tamil, Malayalam, Telugu or
 * Devanagari glyphs**, so the family cannot be a constant: with five languages
 * this patch is the single place that decides which script's face to use, and
 * getting it wrong renders four of the five languages as tofu boxes (□□□□).
 * See i18n/fonts.js for the language → family map.
 *
 * Three earlier attempts at patching Text failed, and each ruled something out:
 *
 * 1. `Text.render = ...` — RN 0.86 `Text` is a *function component*
 *    (`const TextImpl: component(...)`), so there is no `.render` to patch.
 *    A silent no-op, which is why Poppins never appeared.
 *
 * 2. Patching `StyleSheet/flattenStyle` — reaches Text, but is far too broad:
 *    ScrollView, Image, TouchableOpacity and ReactNativeAttributePayload (the
 *    diff path for *every* native view) all run styles through it, so
 *    `fontFamily` would leak into non-text views.
 *
 * 3. Assigning `require('.../Text').default = ...` — works in a production
 *    bundle, but the dev bundle Metro serves defines `default` as a
 *    getter-only property, so it throws:
 *      "Cannot assign to property 'default' which has only a getter"
 *
 * What actually works in both dev and production: redefine `Text`/`TextInput`
 * on the `react-native` module object itself. index.js builds a plain object
 * literal of lazy getters and never freezes it — RN even calls
 * `Object.defineProperty(module.exports, ...)` on it for its own deprecations —
 * and `_reactNative.Text` is exactly what every screen's compiled JSX reads.
 * `defineProperty` replaces the accessor outright, so nothing is ever assigned
 * to a getter-only slot.
 *
 * RN ignores `fontWeight` once a custom `fontFamily` is set, and these families
 * ship each weight as its own face, so we resolve the weight to the matching
 * face and drop the raw weight — otherwise the platform synthesizes a fake bold
 * on top of a face that is already bold.
 *
 * An explicit `fontFamily` is always left alone. Two things depend on that:
 * @expo/vector-icons draws its glyphs as
 * `<Text style={{fontFamily: 'MaterialCommunityIcons'}}>` and overriding it
 * would turn every icon in the app into tofu, and LanguageSelectScreen sets a
 * per-option family so it can show all five scripts at once.
 *
 * Imported once from App.js, before any screen module evaluates.
 */
import React from 'react';
import { familyFor } from '../i18n/fonts';
import { useLanguage } from '../i18n/LanguageContext';

// Call flattenStyle rather than patching it — see note 2 above.
// eslint-disable-next-line no-undef
const flattenStyle = require('react-native/Libraries/StyleSheet/flattenStyle').default;

/**
 * Resolve a style's weight to the matching face for this language.
 *
 * The family is looked up *per call* rather than baked into a module-level map,
 * because the answer changes when the language does.
 */
const applyFont = (style, language) => {
  const flat = flattenStyle(style);

  if (flat == null) return { fontFamily: familyFor(language, '400') };

  // Icon fonts and any deliberate family win outright.
  if (flat.fontFamily != null) return flat;

  const family = familyFor(language, flat.fontWeight);
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: family };
};

/**
 * Wrap a component so its style always carries the active language's face.
 *
 * Reading the language from context (rather than from the i18n module directly)
 * is what makes a language switch repaint text that is already mounted — a
 * module-level read would leave every visible label on the old script's font
 * until it happened to re-render for some other reason.
 */
const withLanguageFont = (Original) => {
  const Wrapped = (props) => {
    const language = useLanguage();
    // React 19 passes `ref` through props, so plain forwarding is enough.
    return React.createElement(Original, { ...props, style: applyFont(props.style, language) });
  };

  Wrapped.displayName = Original.displayName || Original.name || 'WithLanguageFont';

  // Carry over statics (TextInput.State, propTypes, …).
  Object.keys(Original).forEach((key) => {
    if (Wrapped[key] === undefined) Wrapped[key] = Original[key];
  });

  return Wrapped;
};

/**
 * Replace one lazy getter on the `react-native` export object.
 *
 * The original getter is read once, here, then swapped for a plain value —
 * defineProperty rather than assignment, because the slot is accessor-only.
 */
const patchExport = (rn, name) => {
  const Original = rn[name];
  if (typeof Original !== 'function') return false;

  Object.defineProperty(rn, name, {
    value: withLanguageFont(Original),
    writable: true,
    configurable: true,
    enumerable: true,
  });

  return true;
};

// eslint-disable-next-line no-undef
const ReactNative = require('react-native');

if (!ReactNative.__workmatFontsPatched) {
  patchExport(ReactNative, 'Text');
  patchExport(ReactNative, 'TextInput');

  Object.defineProperty(ReactNative, '__workmatFontsPatched', {
    value: true,
    configurable: true,
  });
}
