/**
 * Longest path, in characters, that the not found page names: a longer one is cut and ends with
 * {@link ELLIPSIS}. Any path of the site, and a link shared by mail, fit, while a forged link
 * cannot fill the page with text.
 */
export const MAX_DISPLAYED_PATH_LENGTH_CHARS = 100;

/** Character that ends a path cut to {@link MAX_DISPLAYED_PATH_LENGTH_CHARS}. */
export const ELLIPSIS = '…';

/**
 * Stands in for the path when i18next translates the not found message, which then gets the path
 * in its place (`getNotFoundMessage`), so that i18next never reads the path, which anyone can type
 * in a URL: it would take a `$t(` in it for the start of a nested translation. A character of the
 * Unicode private use area, which no translation holds.
 */
export const PATH_PLACEHOLDER = '\uE000';

/**
 * Control and format characters of Unicode, such as a line break, a zero width space or a
 * right-to-left override: once decoded, they would hide part of a path or reorder it.
 */
export const INVISIBLE_CHARACTER_PATTERN = /[\p{Cc}\p{Cf}]/gu;
