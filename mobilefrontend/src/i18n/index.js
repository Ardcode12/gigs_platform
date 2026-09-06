/**
 * The translation layer.
 *
 * Deliberately a plain module singleton rather than a hook-only library, because
 * two of its callers are not React components and never will be:
 *
 *   utils/format.js   — formats units, money and relative time
 *   api/client.js     — normalizeError() builds user-facing messages
 *
 * A hook-based i18n cannot reach either, so `t()` is importable anywhere.
 * LanguageContext.js wraps this for React and drives re-renders on a switch.
 *
 * Keys are flat and dotted ('job.startWork'), not nested objects — so a grep for
 * 'job.startWork' finds both the call site and the definition in all five locale
 * files at once. Across ~31 screens that matters more than tidy nesting.
 */

import en from './locales/en';
import ta from './locales/ta';
import ml from './locales/ml';
import hi from './locales/hi';
import te from './locales/te';
import { DEFAULT_LANGUAGE } from './fonts';

/**
 * The five supported languages.
 *
 * `native` is what the picker shows — a language is chosen by someone who cannot
 * necessarily read the others, so each option has to be written in its own
 * script. `locale` is only used for dates and times; money deliberately stays
 * en-IN everywhere (see utils/format.js).
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', locale: 'en-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', locale: 'ta-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', locale: 'ml-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', locale: 'hi-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', locale: 'te-IN' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export const isSupported = (code) => LANGUAGE_CODES.includes(code);

const DICTS = { en, ta, ml, hi, te };

let active = DEFAULT_LANGUAGE;
const listeners = new Set();

export const getLanguage = () => active;

/** Register a callback for language changes. Returns an unsubscribe function. */
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Switch language. Fonts are the caller's job — LanguageContext loads the new
 * faces *before* calling this, so text never renders as tofu mid-switch.
 */
export const setLanguage = (code) => {
  if (!isSupported(code) || code === active) return active;
  active = code;
  listeners.forEach((listener) => listener(code));
  return active;
};

/** The BCP-47 tag for date/time formatting in the active language. */
export const localeTag = (language = active) =>
  LANGUAGES.find((l) => l.code === language)?.locale ?? 'en-IN';

const missing = new Set();

const warnMissing = (key) => {
  if (!__DEV__ || missing.has(key)) return;
  missing.add(key);
  console.warn(`[i18n] missing key "${key}" (${active})`);
};

/**
 * Pick the right form for a count.
 *
 * All five languages share English's two-form rule (1 vs. everything else), so
 * a `_one` / `_other` suffix is the whole of it. Keys without the suffix are
 * used as-is, which keeps the common case free of ceremony.
 */
const lookup = (dict, key, vars) => {
  if (vars && typeof vars.count === 'number') {
    const form = dict[`${key}_${vars.count === 1 ? 'one' : 'other'}`];
    if (form != null) return form;
  }
  return dict[key];
};

/** Replace {{name}} with vars.name. Absent vars are left visible, not blanked. */
const interpolate = (template, vars) =>
  template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    vars[name] == null ? match : String(vars[name]),
  );

/**
 * Translate a key.
 *
 * Falls back through the active language → English → the key itself, so a
 * half-finished locale file degrades to readable English and never to a blank
 * screen. Returning the key is a visible bug in dev and merely ugly in prod —
 * both preferable to an empty label on a button someone needs to press.
 */
export const t = (key, vars) => {
  if (!key) return '';
  const dict = DICTS[active] ?? DICTS[DEFAULT_LANGUAGE];

  let template = lookup(dict, key, vars);

  if (template == null) {
    template = lookup(DICTS[DEFAULT_LANGUAGE], key, vars);
    if (template == null) {
      warnMissing(key);
      return key;
    }
  }

  return vars ? interpolate(template, vars) : template;
};

/**
 * Whether a key is defined at all, in the active language or in English.
 *
 * NotificationsScreen uses this to decide between rebuilding a row from its
 * type + data and falling back to the backend's own English title.
 */
export const hasKey = (key) =>
  (DICTS[active] ?? {})[key] != null || DICTS[DEFAULT_LANGUAGE][key] != null;

export { DEFAULT_LANGUAGE };
