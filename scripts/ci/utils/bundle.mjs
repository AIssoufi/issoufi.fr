// @ts-check
import {
  ASSETS_SUBDIR,
  EXTERNAL_URL_PATTERN,
  HOME_PAGE_FILE,
  HREF_ATTRIBUTE_PATTERN,
  HTML_COMMENT_PATTERN,
  IMAGE_FILE_PATTERN,
  INITIAL_LOAD_LINK_RELATIONS,
  LINK_RELATION_SEPARATOR_PATTERN,
  LINK_TAG_PATTERN,
  REL_ATTRIBUTE_PATTERN,
  ROOT_URL_PREFIX_PATTERN,
  SCRIPT_FILE_PATTERN,
  SCRIPT_TAG_PATTERN,
  SRC_ATTRIBUTE_PATTERN,
  URL_QUERY_AND_HASH_PATTERN,
} from '../constants.mjs';
import { toList } from './lists.mjs';
import { formatKilobytes, isPositiveNumber, toNonNegativeNumber } from './numbers.mjs';

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
 * {@link toNonNegativeNumber} or {@link formatKilobytes}, which turn a bad size into 0.
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
 * Turns a URL that a page of the build references into the path of the file it serves, relative
 * to the build folder, as the build files name it.
 * @param {unknown} url - URL of a `src` or `href` attribute, e.g. `/assets/index-B7cJ.js`.
 * @returns {string} The path without its query string or fragment, e.g. `assets/index-B7cJ.js`,
 * or an empty string for a URL of another site, a `data:` URL, a URL without a path and a value
 * that is not a string.
 * @example
 * toBuildPath('/assets/index-B7cJ.js?v=2'); // 'assets/index-B7cJ.js'
 * toBuildPath('https://fonts.googleapis.com/css2'); // ''
 */
export const toBuildPath = url => {
  if (typeof url !== 'string') return '';

  const trimmedUrl = url.trim();
  const isExternal = EXTERNAL_URL_PATTERN.test(trimmedUrl);
  if (isExternal) return '';

  return trimmedUrl.replace(URL_QUERY_AND_HASH_PATTERN, '').replace(ROOT_URL_PREFIX_PATTERN, '');
};

/**
 * Tells whether a link tag makes the browser load its file with the page: a module preload or a
 * style sheet ({@link INITIAL_LOAD_LINK_RELATIONS}), whatever the other relations it lists.
 * @param {string} tag - Link tag, from `<link` to `>`.
 * @returns {boolean} False for a tag without a `rel` attribute, or with other relations only, such
 * as `icon` or `preconnect`.
 */
const isInitialLoadLink = tag => {
  const relations = tag.match(REL_ATTRIBUTE_PATTERN)?.[1] ?? '';
  return relations
    .toLowerCase()
    .split(LINK_RELATION_SEPARATOR_PATTERN)
    .some(relation => INITIAL_LOAD_LINK_RELATIONS.includes(relation));
};

/**
 * Lists the files of the build that an HTML page makes the browser load before it renders: the
 * scripts of its `script` tags, and the module preloads and style sheets of its `link` tags.
 * Tags in comments, inline scripts, tags without a URL and files of other sites are left out, like
 * attributes without double quotes, which Vite never writes.
 * @param {unknown} html - Content of the page, e.g. `dist/index.html`.
 * @returns {string[]} The paths relative to the build folder (see {@link toBuildPath}), each one
 * once, scripts first. Empty for a value that is not a string.
 * @example
 * readInitialLoadPaths(
 *   '<script type="module" src="/assets/index-B7cJ.js"></script>' +
 *     '<link rel="stylesheet" href="https://fonts.googleapis.com/css2">',
 * ); // ['assets/index-B7cJ.js']
 */
export const readInitialLoadPaths = html => {
  const text = typeof html === 'string' ? html.replace(HTML_COMMENT_PATTERN, '') : '';
  const scriptUrls = (text.match(SCRIPT_TAG_PATTERN) ?? []).map(
    tag => tag.match(SRC_ATTRIBUTE_PATTERN)?.[1],
  );
  const linkUrls = (text.match(LINK_TAG_PATTERN) ?? [])
    .filter(isInitialLoadLink)
    .map(tag => tag.match(HREF_ATTRIBUTE_PATTERN)?.[1]);

  const paths = [...scriptUrls, ...linkUrls].map(toBuildPath).filter(path => path !== '');
  return [...new Set(paths)];
};

/**
 * Parameters of {@link splitInitialLoad} and {@link findUncountedPaths}.
 * @typedef {object} InitialLoadParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Any value that is
 * not an array counts as none.
 * @property {string[]} [initialPaths] - Files the home page loads before it renders, from
 * {@link readInitialLoadPaths}. Any value that is not an array counts as none.
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

/**
 * Writes the Markdown rows of scripts and style sheets of the build, with the size and the gzip
 * size of each one. Entries that are not build files (see {@link isBuildFile}) are left out.
 * @param {BuildFile[]} [scripts] - Scripts and style sheets to list. Any value that is not an
 * array counts as none.
 * @returns {string[]} One row per file.
 */
const renderScriptRows = scripts =>
  toList(scripts)
    .filter(isBuildFile)
    .map(
      ({ path, bytes, gzipBytes }) =>
        `| \`${path}\` | ${formatKilobytes(bytes)} | ${formatKilobytes(gzipBytes)} |`,
    );

/**
 * Parameters of {@link renderScriptsTable}.
 * @typedef {object} RenderScriptsTableParams
 * @property {BuildFile[]} [initialScripts] - Scripts and style sheets of the initial load, from
 * {@link splitInitialLoad}. Any value that is not an array counts as none.
 * @property {BuildFile[]} [otherScripts] - The other scripts and style sheets of the build, from
 * {@link splitInitialLoad}. Any value that is not an array counts as none.
 * @property {number} [initialLoadGzipBytes] - Gzip size of the initial load, shown on the row after
 * its files, from {@link checkScriptBudget}. Defaults to 0, and an invalid size is shown as 0.
 * @property {number} [totalGzipBytes] - Total gzip size shown on the last row, from
 * {@link checkScriptBudget}. Defaults to 0, and an invalid size is shown as 0.
 */

/**
 * Writes the Markdown table of the scripts and style sheets of the build: the size and the gzip
 * size of each one, the files of the initial load first, followed by their subtotal, then the
 * others and the total. Entries that are not build files (see {@link isBuildFile}) are left out.
 * @param {RenderScriptsTableParams} params
 * @returns {string} The table, without a final line break.
 * @example
 * renderScriptsTable({
 *   initialScripts: [{ path: 'assets/index.js', bytes: 403_180, gzipBytes: 131_860 }],
 *   otherScripts: [{ path: 'assets/Projects.js', bytes: 14_140, gzipBytes: 4_520 }],
 *   initialLoadGzipBytes: 131_860,
 *   totalGzipBytes: 136_380,
 * });
 * // | File | Size | Gzip |
 * // | --- | ---: | ---: |
 * // | `assets/index.js` | 403.2 kB | 131.9 kB |
 * // | **Initial load** (`index.html`) | | **131.9 kB** |
 * // | `assets/Projects.js` | 14.1 kB | 4.5 kB |
 * // | **Total** | | **136.4 kB** |
 */
export const renderScriptsTable = ({
  initialScripts,
  otherScripts,
  initialLoadGzipBytes = 0,
  totalGzipBytes = 0,
}) =>
  [
    '| File | Size | Gzip |',
    '| --- | ---: | ---: |',
    ...renderScriptRows(initialScripts),
    `| **Initial load** (\`${HOME_PAGE_FILE}\`) | | **${formatKilobytes(initialLoadGzipBytes)}** |`,
    ...renderScriptRows(otherScripts),
    `| **Total** | | **${formatKilobytes(totalGzipBytes)}** |`,
  ].join('\n');

/**
 * Parameters of {@link renderLargeImagesSection}.
 * @typedef {object} RenderLargeImagesSectionParams
 * @property {BuildFile[]} [largeImages] - Images over the limit, from {@link findLargeImages}.
 * Any value that is not an array counts as none.
 * @property {number} largeImageBytes - Size limit used to find them, shown in the heading.
 */

/**
 * Writes the Markdown section of the images over the size limit: a heading with the limit, then
 * the size of each image. Entries that are not build files (see {@link isBuildFile}) are left
 * out.
 * @param {RenderLargeImagesSectionParams} params
 * @returns {string} The section, without a final line break, or an empty string when no image is
 * listed.
 * @throws {RangeError} When the limit is not a finite number above 0, even without images, like
 * {@link findLargeImages}.
 * @example
 * renderLargeImagesSection({
 *   largeImages: [{ path: 'chess.png', bytes: 928_988 }],
 *   largeImageBytes: 500_000,
 * });
 * // ### Images over 500.0 kB
 * //
 * // | Image | Size |
 * // | --- | ---: |
 * // | `chess.png` | 929.0 kB |
 */
export const renderLargeImagesSection = ({ largeImages, largeImageBytes }) => {
  const isValidLimit = isPositiveNumber(largeImageBytes);
  if (!isValidLimit) throw new RangeError(`Invalid image size limit: ${largeImageBytes}`);

  const listedImages = toList(largeImages).filter(isBuildFile);
  const hasLargeImages = listedImages.length > 0;
  if (!hasLargeImages) return '';

  return [
    `### Images over ${formatKilobytes(largeImageBytes)}`,
    '',
    '| Image | Size |',
    '| --- | ---: |',
    ...listedImages.map(({ path, bytes }) => `| \`${path}\` | ${formatKilobytes(bytes)} |`),
  ].join('\n');
};

/**
 * Parameters of {@link renderBudgetVerdict}.
 * @typedef {object} RenderBudgetVerdictParams
 * @property {string} name - Name of the budget, e.g. `Total`.
 * @property {number} totalGzipBytes - Gzip size checked, from {@link checkScriptBudget}.
 * @property {boolean} isOverBudget - Whether the size exceeds the budget, from
 * {@link checkScriptBudget}.
 * @property {number} budgetBytes - Budget the size was checked against.
 */

/**
 * Writes the verdict of a script budget, for the job summary.
 * @param {RenderBudgetVerdictParams} params
 * @returns {string} The verdict, e.g. `✅ Total within budget: 188.9 kB gzip for a budget of
 * 210.0 kB.`
 */
const renderBudgetVerdict = ({ name, totalGzipBytes, isOverBudget, budgetBytes }) => {
  const verdict = isOverBudget ? `❌ ${name} over budget` : `✅ ${name} within budget`;
  return `${verdict}: ${formatKilobytes(totalGzipBytes)} gzip for a budget of ${formatKilobytes(budgetBytes)}.`;
};

/**
 * Parameters of {@link renderBundleReport}.
 * @typedef {object} RenderBundleReportParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Any value that is
 * not an array counts as none.
 * @property {string[]} [initialPaths] - Files the home page loads before it renders, from
 * {@link readInitialLoadPaths}. Any value that is not an array counts as none.
 * @property {number} budgetBytes - Maximum total gzip size of the scripts.
 * @property {number} initialLoadBudgetBytes - Maximum gzip size of the scripts of the initial
 * load.
 * @property {BuildFile[]} [largeImages] - Images over the limit, from {@link findLargeImages}.
 * Any value that is not an array counts as none.
 * @property {number} largeImageBytes - Size limit used to find the large images.
 */

/**
 * Writes the size report of the build as Markdown, for the job summary: the table of the scripts
 * and style sheets ({@link renderScriptsTable}), the initial load and the total against their
 * budgets, and the images over the size limit ({@link renderLargeImagesSection}). Entries that
 * are not build files (see {@link isBuildFile}) are left out, of the sizes too.
 * @param {RenderBundleReportParams} params
 * @returns {string} The Markdown report.
 * @throws {RangeError} When a budget or the image size limit is not a finite number above 0, like
 * {@link checkScriptBudget} and {@link findLargeImages}.
 * @example
 * renderBundleReport({
 *   scripts: [{ path: 'assets/index.js', bytes: 403_180, gzipBytes: 131_860 }],
 *   initialPaths: ['assets/index.js'],
 *   budgetBytes: 210_000,
 *   initialLoadBudgetBytes: 150_000,
 *   largeImages: [{ path: 'chess.png', bytes: 928_988 }],
 *   largeImageBytes: 500_000,
 * });
 * // A table with the row '| `assets/index.js` | 403.2 kB | 131.9 kB |', the initial load and
 * // the total, then '✅ Initial load within budget: 131.9 kB gzip for a budget of 150.0 kB.',
 * // '✅ Total within budget: 131.9 kB gzip for a budget of 210.0 kB.', then the images over
 * // 500.0 kB
 */
export const renderBundleReport = ({
  scripts,
  initialPaths,
  budgetBytes,
  initialLoadBudgetBytes,
  largeImages,
  largeImageBytes,
}) => {
  const imagesSection = renderLargeImagesSection({ largeImages, largeImageBytes });
  const { initialScripts, otherScripts } = splitInitialLoad({ scripts, initialPaths });
  const initialLoad = checkScriptBudget({
    scripts: initialScripts,
    budgetBytes: initialLoadBudgetBytes,
  });
  const total = checkScriptBudget({ scripts: [...initialScripts, ...otherScripts], budgetBytes });

  const lines = [
    '## Bundle size',
    '',
    renderScriptsTable({
      initialScripts,
      otherScripts,
      initialLoadGzipBytes: initialLoad.totalGzipBytes,
      totalGzipBytes: total.totalGzipBytes,
    }),
    '',
    renderBudgetVerdict({
      ...initialLoad,
      name: 'Initial load',
      budgetBytes: initialLoadBudgetBytes,
    }),
    '',
    renderBudgetVerdict({ ...total, name: 'Total', budgetBytes }),
  ];

  const hasImagesSection = imagesSection !== '';
  if (hasImagesSection) lines.push('', imagesSection);

  return `${lines.join('\n')}\n`;
};
