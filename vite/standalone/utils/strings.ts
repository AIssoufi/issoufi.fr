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

/**
 * Tells whether a value is the name of a file: a string that is not empty or blank.
 *
 * @param value - Value to check, from a list or a parameter that may hold anything.
 * @returns `true` for a string with at least one character other than a space.
 *
 * @example
 * isFileName('home.webp'); // true
 * isFileName('  '); // false
 */
export const isFileName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';
