// @ts-check
import { ASSETS_SUBDIR, SCRIPT_FILE_PATTERN } from '../constants.mjs';

/**
 * A file of the build and its sizes.
 * @typedef {object} BuildFile
 * @property {string} path - Path relative to the build folder, e.g. `assets/index-B7cJ.js`.
 * @property {number} bytes - Size on disk.
 * @property {number} [gzipBytes] - Size once compressed with gzip, for scripts and style sheets.
 */

/**
 * Tells whether an entry of a list of build files can be reported: an object with a path.
 * Only the path is checked: the sizes may still be invalid, so read them with
 * `toNonNegativeNumber` or `formatKilobytes` of `numbers.mjs`, which turn a bad size into 0.
 * @param {unknown} value - Entry to check.
 * @returns {value is BuildFile} False for `null`, a value that is not an object, and an object
 * without a path or with an empty one.
 * @example
 * isBuildFile({ path: 'chess.png', bytes: 928_988 }); // true
 * isBuildFile({ bytes: 928_988 }); // false
 */
export const isBuildFile = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return false;

  const hasPath = 'path' in value && typeof value.path === 'string' && value.path !== '';
  return hasPath;
};

/**
 * Tells whether a file of the build counts in the script budget: a script or a style sheet of
 * the assets folder, where Vite writes the bundles. Source maps and other files do not count.
 * @param {unknown} path - Path relative to the build folder, e.g. `assets/index-B7cJ.js`.
 * @returns {boolean} Whether the file counts, false for a path that is not a string.
 * @example
 * isBudgetedScript('assets/index-B7cJ.css'); // true
 * isBudgetedScript('assets/index-B7cJ.js.map'); // false
 */
export const isBudgetedScript = path => {
  if (typeof path !== 'string') return false;

  const isInAssets = path.startsWith(`${ASSETS_SUBDIR}/`);
  return isInAssets && SCRIPT_FILE_PATTERN.test(path);
};
