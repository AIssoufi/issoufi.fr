// @ts-check
import { BYTES_PER_KILOBYTE } from '../constants.mjs';

/**
 * Turns a size or a count read from a file or a report into a number that can be added up and
 * compared.
 * @param {unknown} value - Size or count to read.
 * @returns {number} The value, or 0 when it is negative, not a number or not finite.
 * @example
 * toNonNegativeNumber(2473); // 2473
 * toNonNegativeNumber('2473'); // 0
 */
export const toNonNegativeNumber = value => {
  const isValidNumber = typeof value === 'number' && Number.isFinite(value) && value > 0;
  return isValidNumber ? value : 0;
};

/**
 * Tells whether a limit read from a constant or a parameter is usable: a finite number above 0.
 * @param {unknown} value - Limit to check, such as a budget or a size in bytes.
 * @returns {boolean} False for 0, a negative number, `NaN`, `Infinity` and a value that is not a
 * number.
 * @example
 * isPositiveNumber(500_000); // true
 * isPositiveNumber('500000'); // false
 */
export const isPositiveNumber = value => toNonNegativeNumber(value) > 0;

/**
 * Tells whether an identifier read from an answer of the GitHub API or a parameter is usable: a
 * whole number above 0, such as the number of a pull request or the identifier of a run.
 * @param {unknown} value - Value to check.
 * @returns {value is number} False for 0, a negative or decimal number, a number too large to be
 * exact, `NaN` and a value that is not a number.
 * @example
 * isPositiveInteger(162); // true
 * isPositiveInteger('162'); // false
 */
export const isPositiveInteger = value =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/**
 * Formats a size in kilobytes with one decimal, the unit of Vite's build report.
 * @param {unknown} bytes - Size in bytes. An invalid size is shown as `0.0 kB`.
 * @returns {string} The formatted size, e.g. `224.9 kB`.
 * @example
 * formatKilobytes(224_940); // '224.9 kB'
 */
export const formatKilobytes = bytes =>
  `${(toNonNegativeNumber(bytes) / BYTES_PER_KILOBYTE).toFixed(1)} kB`;

/**
 * Formats a coverage percentage with one decimal.
 * @param {unknown} percent - Percentage from the coverage report.
 * @returns {string} The percentage, e.g. `97.7%`, or `n/a` when the report gives no number.
 * @example
 * formatPercent(97.66); // '97.7%'
 * formatPercent('Unknown'); // 'n/a'
 */
export const formatPercent = percent => {
  const isPercent = typeof percent === 'number' && Number.isFinite(percent);
  return isPercent ? `${percent.toFixed(1)}%` : 'n/a';
};
