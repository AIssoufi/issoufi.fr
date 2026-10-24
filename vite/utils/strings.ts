import { REGEXP_SPECIAL_CHARACTERS } from '../constants.ts';

/**
 * Escapes the characters of a text that have a meaning in a regular expression, so a regular
 * expression built from it matches the text itself.
 *
 * @param text - Text to match literally, such as a file name.
 * @returns The text with a backslash before each special character.
 *
 * @example
 * escapeRegExp('home.webp'); // 'home\\.webp'
 */
export const escapeRegExp = (text: string): string =>
  text.replace(REGEXP_SPECIAL_CHARACTERS, '\\$&');
