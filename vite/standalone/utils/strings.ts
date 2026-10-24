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
