// @ts-check
import { BYTES_PER_KILOBYTE } from '../constants.mjs';

/**
 * Turns a size or a count read from a file or a report into a number that can be added up and
 * compared.
 * @param {unknown} value - Size or count to read.
 * @returns {number} The value, or 0 when it is negative, not a number or not finite.
 */
export const toNonNegativeNumber = value => {
  const isValidNumber = typeof value === 'number' && Number.isFinite(value) && value > 0;
  return isValidNumber ? value : 0;
};

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
 */
export const formatPercent = percent => {
  const isPercent = typeof percent === 'number' && Number.isFinite(percent);
  return isPercent ? `${percent.toFixed(1)}%` : 'n/a';
};
