/**
 * Resolve an RN-style fontWeight to a Poppins family name.
 *
 * React Native ignores `fontWeight` when a custom font is loaded: to get real
 * 500/600/700/800 weight you must select the matching font *face* (Poppins ships
 * each weight as a separate family), and `fontWeight` left in the style would
 * ask the OS to synthesize a weight on top of a face that already has one.
 * So this maps the weight to a family, and the callers drop the raw `fontWeight`.
 */
import { StyleSheet } from 'react-native';
import { FONTS } from '../theme';

const WEIGHT_TO_FAMILY = {
  // numeric styles (StyleSheet.web / JSON) come through as numbers
  400: FONTS.regular,
  500: FONTS.medium,
  600: FONTS.semibold,
  700: FONTS.bold,
  800: FONTS.extrabold,
  // some callers write strings or keywords
  normal: FONTS.regular,
  bold: FONTS.bold,
};

/**
 * Resolve any incoming style to a Poppins family. Defaults to 400 when no weight
 * is present. `style` may be a single object or an array of objects.
 */
export const resolveFont = (style) => {
  const flat = StyleSheet.flatten(style) || {};
  const weight = flat.fontWeight;
  return WEIGHT_TO_FAMILY[weight] ?? WEIGHT_TO_FAMILY[String(weight)] ?? FONTS.regular;
};

/**
 * Return the style with `fontWeight` removed — the weight now lives in the
 * family, and leaving it would cause a synthesized-bold-on-custom-face artifact.
 */
export const withoutWeight = (style) => {
  const flat = StyleSheet.flatten(style) || {};
  const { fontWeight, ...rest } = flat;
  return rest;
};
