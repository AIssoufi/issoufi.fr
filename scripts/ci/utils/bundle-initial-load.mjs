// @ts-check
import { isBuildFile } from './bundle-files.mjs';
import { toList } from './lists.mjs';

/** @typedef {import('./bundle-files.mjs').BuildFile} BuildFile */

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
 * // {
 * //   initialScripts: [{ path: 'assets/index.js', … }],
 * //   otherScripts: [{ path: 'assets/Projects.js', … }],
 * // }
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
 * `isBudgetedScript` of `bundle-files.mjs`): a file outside the assets folder, or missing from
 * the build.
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
