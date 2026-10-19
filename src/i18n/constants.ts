import type { Language } from './types';

/**
 * Languages of the site, in the order the language toggle shows them. Each one needs its
 * translations in the resources of `index.ts`.
 */
export const LANGUAGES = ['fr', 'en'] as const;

/**
 * Language of the URLs without a language prefix, such as `/` and `/projects`, and fallback for a
 * missing translation. Every other language is served under its own prefix, such as `/en/`
 * (see `getLanguagePrefix` in `utils.ts`).
 */
export const DEFAULT_LANGUAGE: Language = 'fr';

/**
 * `localStorage` key holding the language chosen with the toggle. On the next visit, the home
 * page of the default language opens in it.
 */
export const LANGUAGE_STORAGE_KEY = 'language';

/** Locale of each language in the `og:locale` tags of the HTML pages generated at build time. */
export const OPEN_GRAPH_LOCALES = {
  fr: 'fr_FR',
  en: 'en_US',
} as const satisfies Record<Language, string>;

/**
 * Direction of the text of each language, the `dir` of its web app manifest: every language of the
 * site is written from left to right.
 */
export const TEXT_DIRECTIONS = {
  fr: 'ltr',
  en: 'ltr',
} as const satisfies Record<Language, 'ltr' | 'rtl'>;

/** Separator of the segments of a URL path. */
export const PATH_SEPARATOR = '/';

/** Path of the home page of the default language, the root of the site. */
export const ROOT_PATH = '/';

/**
 * Separator of the parts of a translation key, e.g. `exp.sewan.name`: the default `keySeparator`
 * of i18next.
 */
export const KEY_SEPARATOR = '.';
