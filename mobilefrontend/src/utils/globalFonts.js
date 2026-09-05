/**
 * Globally apply Poppins to every <Text> and <TextInput> in the app.
 * Import this once in App.js AFTER fonts have been loaded via useFonts().
 *
 * Each fontWeight is mapped to the matching Poppins face (see utils/fonts),
 * so `fontWeight: FONT_WEIGHT.semibold` renders Poppins_600SemiBold instead of
 * being ignored by the custom font.
 */
import React from 'react';
import { Text, TextInput } from 'react-native';
import { resolveFont, withoutWeight } from './fonts';

// React Native 0.76 / React 19 no longer support defaultProps on function
// components. The most reliable way to patch the default font without rewriting
// imports globally is to intercept the render function of Text.
if (Text.render) {
  const oldTextRender = Text.render;
  Text.render = function (...args) {
    const origin = oldTextRender.call(this, ...args);
    const { style } = origin.props || {};
    return React.cloneElement(origin, {
      style: [{ fontFamily: resolveFont(style) }, withoutWeight(style)],
    });
  };
} else {
  // Fallback for older React Native versions or if Text is still a class/has defaultProps
  if (!Text.defaultProps) Text.defaultProps = {};
  Text.defaultProps.style = [{ fontFamily: resolveFont() }];
}

if (TextInput.render) {
  const oldInputRender = TextInput.render;
  TextInput.render = function (...args) {
    const origin = oldInputRender.call(this, ...args);
    const { style } = origin.props || {};
    return React.cloneElement(origin, {
      style: [{ fontFamily: resolveFont(style) }, withoutWeight(style)],
    });
  };
} else {
  if (!TextInput.defaultProps) TextInput.defaultProps = {};
  TextInput.defaultProps.style = [{ fontFamily: resolveFont() }];
}
