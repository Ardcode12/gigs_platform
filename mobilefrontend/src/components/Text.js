import React from 'react';
import { Text as RNText } from 'react-native';
import { resolveFont, withoutWeight } from '../utils/fonts';

/**
 * Weight-aware Text: `fontWeight` in a style selects the matching Poppins face
 * rather than being ignored by the custom family.
 */
export default function Text({ style, ...props }) {
  return (
    <RNText
      {...props}
      style={[{ fontFamily: resolveFont(style) }, withoutWeight(style)]}
    />
  );
}
