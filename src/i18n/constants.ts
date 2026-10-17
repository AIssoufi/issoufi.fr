import type { Language } from './types';

/**
 * Languages of the site, in the order the language toggle shows them. Each one needs its
 * translations in the resources of `index.ts`.
 */
export const LANGUAGES = ['fr', 'en'] as const;

/**
 * Language of a first visit, and fallback for a missing translation. Must match the language of
 * the HTML pages generated at build time, which do not read it: `lang` in `index.html` and the
 * `fr` metadata of `src/utils/pages.ts`.
 */
export const DEFAULT_LANGUAGE: Language = 'fr';
