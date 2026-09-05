/**
 * Globally apply Poppins to every <Text> and <TextInput> in the app.
 * Import this once in App.js AFTER fonts have been loaded via useFonts().
 */
import React from 'react';
import { Text, TextInput, Platform } from 'react-native';
import { resolveFont, withoutWeight } from './fonts';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Inject web stylesheet for fonts & full screen layout
  const styleId = 'workmat-web-global-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
      html, body, #root {
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        background-color: #F8FAFC !important;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      }
      * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(styleEl);
  }
} else {
  if (Text && Text.render) {
    const oldTextRender = Text.render;
    Text.render = function (...args) {
      const origin = oldTextRender.call(this, ...args);
      const { style } = origin ? origin.props || {} : {};
      return React.cloneElement(origin, {
        style: [{ fontFamily: resolveFont(style) }, withoutWeight(style)],
      });
    };
  }

  if (TextInput && TextInput.render) {
    const oldInputRender = TextInput.render;
    TextInput.render = function (...args) {
      const origin = oldInputRender.call(this, ...args);
      const { style } = origin ? origin.props || {} : {};
      return React.cloneElement(origin, {
        style: [{ fontFamily: resolveFont(style) }, withoutWeight(style)],
      });
    };
  }
}
