/**
 * The active language, and the fonts that go with it.
 *
 * Shaped after AuthContext: an AsyncStorage-backed value with a `restoring` flag
 * covering the first frame before storage has been read. App.js gates on both.
 *
 * Two contexts rather than one, deliberately. Every Text in the app subscribes to
 * the language (globalFonts.js patches Text to pick its font family from it), so
 * that context must carry *only* the language string — otherwise an unrelated
 * change to `restoring` or a new `changeLanguage` identity would re-render every
 * piece of text in the app.
 *
 * `useLanguage()` never throws and works with no provider mounted, because the
 * patched Text calls it — including on the splash screen, before any provider
 * exists. A missing provider means English, not a crash.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_CODES,
  getLanguage,
  isSupported,
  setLanguage as setModuleLanguage,
  t,
} from './index';
import { loadFontsFor } from './fonts';

const LANGUAGE_KEY = 'workmat.language';

/** Just the active code. Every Text reads this — keep it minimal. */
const LanguageContext = createContext(DEFAULT_LANGUAGE);

/** Everything else. Only app code reads this. */
const LanguageApiContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // null means "not chosen yet" — App.js shows the picker on that.
  const [language, setLanguageState] = useState(null);
  // `restoring` covers the first frame, before AsyncStorage has been read.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);

        if (isSupported(stored)) {
          // Fonts first: a frame drawn before the faces register is tofu.
          await loadFontsFor(stored);
          if (cancelled) return;
          setModuleLanguage(stored);
          setLanguageState(stored);
        }
      } catch {
        // Unreadable storage — fall through to the picker rather than guessing.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Switch language, from the first-launch picker or from Profile.
   *
   * Loads the faces *before* committing, so text never flashes as tofu between
   * the language changing and its font arriving.
   */
  const changeLanguage = useCallback(async (code) => {
    if (!isSupported(code)) return false;

    await loadFontsFor(code);

    setModuleLanguage(code);
    setLanguageState(code);

    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      // The choice still applies to this session; it just won't survive a restart.
    }

    return true;
  }, []);

  const api = useMemo(
    () => ({ language, restoring, needsChoice: !restoring && !language, changeLanguage }),
    [language, restoring, changeLanguage],
  );

  // Fall back to English for rendering until a choice exists, so the app always
  // draws in *something* readable while the picker is up.
  const active = language ?? DEFAULT_LANGUAGE;

  return (
    <LanguageContext.Provider value={active}>
      <LanguageApiContext.Provider value={api}>{children}</LanguageApiContext.Provider>
    </LanguageContext.Provider>
  );
};

/**
 * The active language code. Safe with no provider — returns the module's current
 * language, which is English until something sets it.
 */
export const useLanguage = () => useContext(LanguageContext) ?? getLanguage();

/** The full API. Throws without a provider, like useAuth. */
export const useLanguageState = () => {
  const context = useContext(LanguageApiContext);
  if (!context) throw new Error('useLanguageState must be used inside LanguageProvider');
  return context;
};

/**
 * The translate function, re-identified on each language change so memoized
 * children re-render. The returned function is the module-level `t` — this hook
 * exists to subscribe the component, not to build a different translator.
 */
export const useT = () => {
  const language = useLanguage();
  return useMemo(() => (key, vars) => t(key, vars), [language]);
};

export { LANGUAGE_KEY, LANGUAGE_CODES };
