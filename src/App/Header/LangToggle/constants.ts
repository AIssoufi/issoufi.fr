/** Languages offered by the toggle, in display order; the first one is the fallback slot. */
export const LANGS = ['fr', 'en'] as const;

/**
 * Name of each language written in that language: the accessible name of its button, read
 * instead of the visible "FR" or "EN", and the same whatever the active language.
 */
export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
} as const satisfies Record<(typeof LANGS)[number], string>;

/** Width of a language button, and of the indicator sliding under the active one. */
export const BUTTON_WIDTH_PX = 36;
/** Height of a language button, and of the indicator sliding under the active one. */
export const BUTTON_HEIGHT_PX = 32;
