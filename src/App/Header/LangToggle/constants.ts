import type { Language } from '../../../i18n/types.ts';

/**
 * Name of each language written in that language: the end of the accessible name of its button,
 * read by screen readers only, after the visible "FR" or "EN", and the same whatever the active
 * language.
 */
export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
} as const satisfies Record<Language, string>;

/** Width of a language button, and of the indicator sliding under the active one. */
export const BUTTON_WIDTH_PX = 36;
/** Height of a language button, and of the indicator sliding under the active one. */
export const BUTTON_HEIGHT_PX = 32;
