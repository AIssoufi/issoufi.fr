// @ts-check
// Readers of the JSON data of the CV, so that a missing or misspelled field gives an empty value
// instead of a crash.

/**
 * Reads a text of the data.
 * @param {unknown} value - Value to read.
 * @returns {string} The value, or `''` when it is not a string.
 */
export const toText = value => (typeof value === 'string' ? value : '');

/**
 * Tells whether a text holds more than spaces.
 * @param {string} text - Text to check.
 * @returns {boolean} False for `''` and `'  '`.
 */
export const isFilled = text => text.trim() !== '';

/**
 * Tells whether a value of the data is an object other than a list, as an entry is.
 * @param {unknown} value - Value to check.
 * @returns {value is Record<string, any>} True for an object that is not a list.
 */
export const isEntry = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Keeps the entries of a list of the data.
 * @param {unknown} value - List to read.
 * @returns {Record<string, any>[]} Its objects, or none when it is not a list.
 */
export const toEntries = value => (Array.isArray(value) ? value.filter(isEntry) : []);

/**
 * Keeps the filled texts of a list of the data, such as technologies.
 * @param {unknown} value - List to read.
 * @returns {string[]} Its texts that hold more than spaces, or none when it is not a list.
 */
export const toTexts = value => (Array.isArray(value) ? value.map(toText).filter(isFilled) : []);
