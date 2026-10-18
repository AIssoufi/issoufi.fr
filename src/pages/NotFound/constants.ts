/**
 * Longest path, in characters, that the not found page names: a longer one is cut and ends with
 * {@link ELLIPSIS}. Any path of the site, and a link shared by mail, fit, while a forged link
 * cannot fill the page with text.
 */
export const MAX_DISPLAYED_PATH_LENGTH_CHARS = 100;

/** Character that ends a path cut to {@link MAX_DISPLAYED_PATH_LENGTH_CHARS}. */
export const ELLIPSIS = '…';

/**
 * Control and format characters of Unicode, such as a line break, a zero width space or a
 * right-to-left override: once decoded, they would hide part of a path or reorder it.
 */
export const INVISIBLE_CHARACTER_PATTERN = /[\p{Cc}\p{Cf}]/gu;
