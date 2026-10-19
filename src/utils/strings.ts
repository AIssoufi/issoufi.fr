/**
 * Tells whether a value is a string with something else than white space in it, such as a URL
 * worth writing in a page.
 *
 * @param value - Any value.
 * @returns `false` for an empty or blank string and for a value that is not a string.
 *
 * @example
 * isNonBlankString('/home.webp'); // true
 * isNonBlankString(' \n'); // false
 */
export const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';
