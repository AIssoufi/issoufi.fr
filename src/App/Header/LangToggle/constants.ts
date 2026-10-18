import type { Language } from '../../../i18n/types';

/**
 * Name of each language written in that language: the accessible name of its button, read
 * instead of the visible "FR" or "EN", and the same whatever the active language.
 */
export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
} as const satisfies Record<Language, string>;
