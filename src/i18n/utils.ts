import { LANGUAGES } from './constants';
import type { Language } from './types';

/**
 * Tells whether a value is the code of one of the site's {@link LANGUAGES}. Codes are matched
 * exactly, as i18next does: `'EN'` and `'en-US'` are not languages of the site.
 *
 * @param value - Any value, typically one read from outside the code, such as the storage.
 *
 * @example
 * isLanguage('en'); // true
 * isLanguage('de'); // false
 * isLanguage(null); // false
 */
export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(language => language === value);
