// @ts-check
import { ASSETS_SUBDIR, IMAGE_FILE_PATTERN, SCRIPT_FILE_PATTERN } from '../constants.mjs';
import { toList } from './lists.mjs';
import { isPositiveNumber, toNonNegativeNumber } from './numbers.mjs';

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
 * {@link toNonNegativeNumber} or `formatKilobytes` of `numbers.mjs`, which turn a bad size into 0.
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

/**
 * Parameters of {@link splitInitialLoad} and {@link findUncountedPaths}.
 * @typedef {object} InitialLoadParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Any value that is
 * not an array counts as none.
 * @property {string[]} [initialPaths] - Files the home page loads before it renders, from
 * `readInitialLoadPaths` of `html.mjs`. Any value that is not an array counts as none.
 */

/**
 * Scripts and style sheets of the build, split by {@link splitInitialLoad}.
 * @typedef {object} InitialLoadSplit
 * @property {BuildFile[]} initialScripts - Those the home page loads before it renders.
 * @property {BuildFile[]} otherScripts - The others, loaded later or by other pages.
 */

/**
 * Splits the scripts and style sheets of the build into those of the initial load, which the
 * home page references, and the others, each in the order of the list. Entries that are not build
 * files (see {@link isBuildFile}) are left out of both.
 * @param {InitialLoadParams} params
 * @returns {InitialLoadSplit} The scripts of the initial load and the others.
 * @example
 * splitInitialLoad({
 *   scripts: [
 *     { path: 'assets/index.js', bytes: 403_180, gzipBytes: 131_860 },
 *     { path: 'assets/Projects.js', bytes: 14_140, gzipBytes: 4_520 },
 *   ],
 *   initialPaths: ['assets/index.js'],
 * });
 * // { initialScripts: [{ path: 'assets/index.js', … }], otherScripts: [{ path: 'assets/Projects.js', … }] }
 */
export const splitInitialLoad = ({ scripts, initialPaths }) => {
  const paths = toList(initialPaths);
  const listedScripts = toList(scripts).filter(isBuildFile);
  const isInitialScript = (/** @type {BuildFile} */ file) => paths.includes(file.path);

  return {
    initialScripts: listedScripts.filter(isInitialScript),
    otherScripts: listedScripts.filter(file => !isInitialScript(file)),
  };
};

/**
 * Lists the files that the home page loads before it renders but that the initial load cannot
 * count, since they are not among the scripts and style sheets of the build (see
 * {@link isBudgetedScript}): a file outside the assets folder, or missing from the build.
 * @param {InitialLoadParams} params
 * @returns {string[]} The paths left out of the initial load, empty when every one is counted.
 * Entries that are not paths are ignored.
 * @example
 * findUncountedPaths({
 *   scripts: [{ path: 'assets/index.js', bytes: 403_180, gzipBytes: 131_860 }],
 *   initialPaths: ['assets/index.js', 'register-sw.js'],
 * }); // ['register-sw.js']
 */
export const findUncountedPaths = ({ scripts, initialPaths }) => {
  const scriptPaths = toList(scripts)
    .filter(isBuildFile)
    .map(({ path }) => path);
  const isUncountedPath = (/** @type {unknown} */ path) => {
    const isPath = typeof path === 'string' && path !== '';
    return isPath && !scriptPaths.includes(path);
  };

  return toList(initialPaths).filter(isUncountedPath);
};

/**
 * Parameters of {@link checkScriptBudget}.
 * @typedef {object} CheckScriptBudgetParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Any value that is
 * not an array counts as none.
 * @property {number} budgetBytes - Maximum total gzip size. The total may equal it.
 */

/**
 * Result of {@link checkScriptBudget}.
 * @typedef {object} ScriptBudgetCheck
 * @property {number} totalGzipBytes - Total gzip size of the scripts and style sheets.
 * @property {boolean} isOverBudget - Whether the total exceeds the budget.
 */

/**
 * Adds up the gzip sizes of the scripts and style sheets of the build and compares the total
 * with the budget. A file with an invalid size counts as 0.
 * @param {CheckScriptBudgetParams} params
 * @returns {ScriptBudgetCheck} The total and whether it exceeds the budget.
 * @throws {RangeError} When the budget is not a finite number above 0, since every build would then
 * pass or fail whatever its size.
 * @example
 * checkScriptBudget({
 *   scripts: [{ path: 'assets/index.js', bytes: 788_320, gzipBytes: 224_940 }],
 *   budgetBytes: 250_000,
 * }); // { totalGzipBytes: 224_940, isOverBudget: false }
 */
export const checkScriptBudget = ({ scripts, budgetBytes }) => {
  const isValidBudget = isPositiveNumber(budgetBytes);
  if (!isValidBudget) throw new RangeError(`Invalid script budget: ${budgetBytes}`);

  const totalGzipBytes = toList(scripts).reduce(
    (total, file) => total + toNonNegativeNumber(file?.gzipBytes),
    0,
  );
  return { totalGzipBytes, isOverBudget: totalGzipBytes > budgetBytes };
};

/**
 * Parameters of {@link checkBundleBudgets}.
 * @typedef {object} CheckBundleBudgetsParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Any value that is
 * not an array counts as none.
 * @property {string[]} [initialPaths] - Files the home page loads before it renders, from
 * `readInitialLoadPaths` of `html.mjs`. Any value that is not an array counts as none.
 * @property {number} budgetBytes - Maximum total gzip size of the scripts. The total may equal it.
 * @property {number} initialLoadBudgetBytes - Maximum gzip size of the scripts of the initial
 * load. Their size may equal it.
 */

/**
 * Result of {@link checkBundleBudgets}.
 * @typedef {object} BundleBudgetsCheck
 * @property {BuildFile[]} initialScripts - Scripts and style sheets of the initial load.
 * @property {BuildFile[]} otherScripts - The other scripts and style sheets of the build.
 * @property {boolean} hasInitialLoad - Whether the home page references at least one of the
 * scripts. It always loads the main chunk, so none means that its HTML is no longer read right
 * and that the initial load cannot be checked: report it as a failure.
 * @property {ScriptBudgetCheck} initialLoad - Gzip size of the initial load against its budget.
 * @property {ScriptBudgetCheck} total - Gzip size of all the scripts against the total budget.
 */

/**
 * Checks the scripts and style sheets of the build against both budgets: those of the initial
 * load ({@link splitInitialLoad}) against the initial load budget, and all of them, the initial
 * load included, against the total budget. Entries that are not build files (see
 * {@link isBuildFile}) are left out.
 * @param {CheckBundleBudgetsParams} params
 * @returns {BundleBudgetsCheck} The scripts of the initial load and the others, and both checks.
 * @throws {RangeError} When a budget is not a finite number above 0, like
 * {@link checkScriptBudget}.
 * @example
 * checkBundleBudgets({
 *   scripts: [
 *     { path: 'assets/index.js', bytes: 403_180, gzipBytes: 131_860 },
 *     { path: 'assets/Projects.js', bytes: 14_140, gzipBytes: 4_520 },
 *   ],
 *   initialPaths: ['assets/index.js'],
 *   budgetBytes: 210_000,
 *   initialLoadBudgetBytes: 150_000,
 * });
 * // {
 * //   initialScripts: [{ path: 'assets/index.js', … }],
 * //   otherScripts: [{ path: 'assets/Projects.js', … }],
 * //   hasInitialLoad: true,
 * //   initialLoad: { totalGzipBytes: 131_860, isOverBudget: false },
 * //   total: { totalGzipBytes: 136_380, isOverBudget: false },
 * // }
 */
export const checkBundleBudgets = ({
  scripts,
  initialPaths,
  budgetBytes,
  initialLoadBudgetBytes,
}) => {
  const { initialScripts, otherScripts } = splitInitialLoad({ scripts, initialPaths });

  return {
    initialScripts,
    otherScripts,
    hasInitialLoad: initialScripts.length > 0,
    initialLoad: checkScriptBudget({
      scripts: initialScripts,
      budgetBytes: initialLoadBudgetBytes,
    }),
    total: checkScriptBudget({ scripts: [...initialScripts, ...otherScripts], budgetBytes }),
  };
};

/**
 * Parameters of {@link findLargeImages}.
 * @typedef {object} FindLargeImagesParams
 * @property {BuildFile[]} [files] - Files of the build, of any type. Any value that is not an array
 * counts as none.
 * @property {number} limitBytes - Size above which an image is listed. An image of exactly this
 * size is not.
 */

/**
 * Lists the images of the build that are bigger than a size limit, the biggest first.
 * @param {FindLargeImagesParams} params
 * @returns {BuildFile[]} The images over the limit.
 * @throws {RangeError} When the limit is not a finite number above 0, since no image would then be
 * reported, or every one.
 * @example
 * findLargeImages({
 *   files: [
 *     { path: 'assets/index.js', bytes: 788_320 },
 *     { path: 'small.png', bytes: 100 },
 *     { path: 'chess.png', bytes: 928_988 },
 *   ],
 *   limitBytes: 500_000,
 * }); // [{ path: 'chess.png', bytes: 928_988 }]
 */
export const findLargeImages = ({ files, limitBytes }) => {
  const isValidLimit = isPositiveNumber(limitBytes);
  if (!isValidLimit) throw new RangeError(`Invalid image size limit: ${limitBytes}`);

  const isLargeImage = (/** @type {unknown} */ file) =>
    isBuildFile(file) &&
    IMAGE_FILE_PATTERN.test(file.path) &&
    toNonNegativeNumber(file.bytes) > limitBytes;

  return toList(files)
    .filter(isLargeImage)
    .sort((a, b) => b.bytes - a.bytes);
};
