import type { Language } from '../../../i18n/types.ts';

/**
 * Name of each language written in that language: the end of the accessible name of its link,
 * read by screen readers only, after the visible "FR" or "EN", and the same whatever the active
 * language.
 */
export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
} as const satisfies Record<Language, string>;

/** Width of a language link, and of the indicator sliding under the active one. */
export const LINK_WIDTH_PX = 36;
/** Height of a language link, and of the indicator sliding under the active one. */
export const LINK_HEIGHT_PX = 32;

/** `button` of a mouse event of the main button of the mouse, usually the left one. */
export const MAIN_MOUSE_BUTTON = 0;
