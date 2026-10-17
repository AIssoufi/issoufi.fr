// @ts-check
import { ASSETS_SUBDIR, IMAGE_FILE_PATTERN, SCRIPT_FILE_PATTERN } from '../constants.mjs';
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
 * Parameters of {@link checkScriptBudget}.
 * @typedef {object} CheckScriptBudgetParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Defaults to none,
 * `null` included.
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
 * @throws {RangeError} When the budget is not a positive number, since every build would then
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
 * @property {BuildFile[]} [files] - Files of the build, of any type. Defaults to none, `null`
 * included.
 * @property {number} limitBytes - Size above which an image is listed. An image of exactly this
 * size is not.
 */

/**
 * Lists the images of the build that are bigger than a size limit, the biggest first.
 * @param {FindLargeImagesParams} params
 * @returns {BuildFile[]} The images over the limit.
 * @throws {RangeError} When the limit is not a positive number, since no image would then be
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
 * Parameters of {@link renderScriptsTable}.
 * @typedef {object} RenderScriptsTableParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Defaults to none,
 * `null` included.
 * @property {number} [totalGzipBytes] - Total gzip size shown on the last row, from
 * {@link checkScriptBudget}. Defaults to 0, and an invalid size is shown as 0.
 */

/**
 * Writes the Markdown table of the scripts and style sheets of the build: the size and the gzip
 * size of each one, then the total. Entries that are not build files (see {@link isBuildFile})
 * are left out.
 * @param {RenderScriptsTableParams} params
 * @returns {string} The table, without a final line break.
 * @example
 * renderScriptsTable({
 *   scripts: [{ path: 'assets/index.js', bytes: 788_320, gzipBytes: 224_940 }],
 *   totalGzipBytes: 224_940,
 * });
 * // | File | Size | Gzip |
 * // | --- | ---: | ---: |
 * // | `assets/index.js` | 788.3 kB | 224.9 kB |
 * // | **Total** | | **224.9 kB** |
 */
export const renderScriptsTable = ({ scripts, totalGzipBytes = 0 }) => {
  const rows = toList(scripts)
    .filter(isBuildFile)
    .map(
      ({ path, bytes, gzipBytes }) =>
        `| \`${path}\` | ${formatKilobytes(bytes)} | ${formatKilobytes(gzipBytes)} |`,
    );

  return [
    '| File | Size | Gzip |',
    '| --- | ---: | ---: |',
    ...rows,
    `| **Total** | | **${formatKilobytes(totalGzipBytes)}** |`,
  ].join('\n');
};

/**
 * Parameters of {@link renderLargeImagesSection}.
 * @typedef {object} RenderLargeImagesSectionParams
 * @property {BuildFile[]} [largeImages] - Images over the limit, from {@link findLargeImages}.
 * Defaults to none, `null` included.
 * @property {number} largeImageBytes - Size limit used to find them, shown in the heading.
 */

/**
 * Writes the Markdown section of the images over the size limit: a heading with the limit, then
 * the size of each image. Entries that are not build files (see {@link isBuildFile}) are left
 * out.
 * @param {RenderLargeImagesSectionParams} params
 * @returns {string} The section, without a final line break, or an empty string when no image is
 * listed.
 * @throws {RangeError} When the limit is not a positive number, even without images, like
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
 * Parameters of {@link renderBundleReport}.
 * @typedef {object} RenderBundleReportParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Defaults to none,
 * `null` included.
 * @property {number} budgetBytes - Maximum total gzip size of the scripts.
 * @property {BuildFile[]} [largeImages] - Images over the limit, from {@link findLargeImages}.
 * Defaults to none, `null` included.
 * @property {number} largeImageBytes - Size limit used to find the large images.
 */

/**
 * Writes the size report of the build as Markdown, for the job summary: the table of the scripts
 * and style sheets ({@link renderScriptsTable}), the total against the budget, and the images
 * over the size limit ({@link renderLargeImagesSection}). Entries that are not build files (see
 * {@link isBuildFile}) are left out, of the total too.
 * @param {RenderBundleReportParams} params
 * @returns {string} The Markdown report.
 * @throws {RangeError} When the budget or the image size limit is not a positive number, like
 * {@link checkScriptBudget} and {@link findLargeImages}.
 * @example
 * renderBundleReport({
 *   scripts: [{ path: 'assets/index.js', bytes: 788_320, gzipBytes: 224_940 }],
 *   budgetBytes: 250_000,
 *   largeImages: [{ path: 'chess.png', bytes: 928_988 }],
 *   largeImageBytes: 500_000,
 * });
 * // A table with the row '| `assets/index.js` | 788.3 kB | 224.9 kB |' and the total, then
 * // '✅ Within budget: 224.9 kB gzip for a budget of 250.0 kB.', then the images over 500.0 kB
 */
export const renderBundleReport = ({ scripts, budgetBytes, largeImages, largeImageBytes }) => {
  const imagesSection = renderLargeImagesSection({ largeImages, largeImageBytes });
  const listedScripts = toList(scripts).filter(isBuildFile);
  const { totalGzipBytes, isOverBudget } = checkScriptBudget({
    scripts: listedScripts,
    budgetBytes,
  });
  const verdict = isOverBudget ? '❌ Over budget' : '✅ Within budget';

  const lines = [
    '## Bundle size',
    '',
    renderScriptsTable({ scripts: listedScripts, totalGzipBytes }),
    '',
    `${verdict}: ${formatKilobytes(totalGzipBytes)} gzip for a budget of ${formatKilobytes(budgetBytes)}.`,
  ];

  const hasImagesSection = imagesSection !== '';
  if (hasImagesSection) lines.push('', imagesSection);

  return `${lines.join('\n')}\n`;
};
