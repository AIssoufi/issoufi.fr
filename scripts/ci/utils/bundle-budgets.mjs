// @ts-check
import { splitInitialLoad } from './bundle-initial-load.mjs';
import { toList } from './lists.mjs';
import { isPositiveNumber, toNonNegativeNumber } from './numbers.mjs';

/** @typedef {import('./bundle-files.mjs').BuildFile} BuildFile */

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
 * `isBuildFile` of `bundle-files.mjs`) are left out.
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
