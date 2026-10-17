// @ts-check
import { IMAGE_FILE_PATTERN } from '../constants.mjs';
import { formatKilobytes, toNonNegativeNumber } from './numbers.mjs';

/**
 * A file of the build and its sizes.
 * @typedef {object} BuildFile
 * @property {string} path - Path relative to the build folder, e.g. `assets/index-B7cJ.js`.
 * @property {number} bytes - Size on disk.
 * @property {number} [gzipBytes] - Size once compressed with gzip, for scripts and style sheets.
 */

/**
 * Parameters of {@link checkScriptBudget}.
 * @typedef {object} CheckScriptBudgetParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Defaults to none.
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
export const checkScriptBudget = ({ scripts = [], budgetBytes }) => {
  const isValidBudget = toNonNegativeNumber(budgetBytes) > 0;
  if (!isValidBudget) throw new RangeError(`Invalid script budget: ${budgetBytes}`);

  const totalGzipBytes = scripts.reduce(
    (total, file) => total + toNonNegativeNumber(file?.gzipBytes),
    0,
  );
  return { totalGzipBytes, isOverBudget: totalGzipBytes > budgetBytes };
};

/**
 * Parameters of {@link findLargeImages}.
 * @typedef {object} FindLargeImagesParams
 * @property {BuildFile[]} [files] - Files of the build, of any type. Defaults to none.
 * @property {number} limitBytes - Size above which an image is listed.
 */

/**
 * Lists the images of the build that are bigger than a size limit, the biggest first.
 * @param {FindLargeImagesParams} params
 * @returns {BuildFile[]} The images over the limit.
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
export const findLargeImages = ({ files = [], limitBytes }) => {
  const isLargeImage = (/** @type {BuildFile} */ file) =>
    IMAGE_FILE_PATTERN.test(file?.path ?? '') && toNonNegativeNumber(file.bytes) > limitBytes;

  return files.filter(isLargeImage).sort((a, b) => b.bytes - a.bytes);
};

/**
 * Parameters of {@link renderBundleReport}.
 * @typedef {object} RenderBundleReportParams
 * @property {BuildFile[]} [scripts] - Scripts and style sheets of the build. Defaults to none.
 * @property {number} budgetBytes - Maximum total gzip size of the scripts.
 * @property {BuildFile[]} [largeImages] - Images over the limit, from {@link findLargeImages}.
 * Defaults to none.
 * @property {number} largeImageBytes - Size limit used to find the large images.
 */

/**
 * Writes the size report of the build as Markdown, for the job summary: the gzip size of each
 * script and style sheet, the total against the budget, and the images over the size limit.
 * @param {RenderBundleReportParams} params
 * @returns {string} The Markdown report.
 * @throws {RangeError} When the budget is not a positive number, like {@link checkScriptBudget}.
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
export const renderBundleReport = ({
  scripts = [],
  budgetBytes,
  largeImages = [],
  largeImageBytes,
}) => {
  const { totalGzipBytes, isOverBudget } = checkScriptBudget({ scripts, budgetBytes });
  const verdict = isOverBudget ? '❌ Over budget' : '✅ Within budget';
  const hasLargeImages = largeImages.length > 0;

  const lines = [
    '## Bundle size',
    '',
    '| File | Size | Gzip |',
    '| --- | ---: | ---: |',
    ...scripts.map(
      ({ path, bytes, gzipBytes }) =>
        `| \`${path}\` | ${formatKilobytes(bytes)} | ${formatKilobytes(gzipBytes)} |`,
    ),
    `| **Total** | | **${formatKilobytes(totalGzipBytes)}** |`,
    '',
    `${verdict}: ${formatKilobytes(totalGzipBytes)} gzip for a budget of ${formatKilobytes(budgetBytes)}.`,
  ];

  if (hasLargeImages) {
    lines.push(
      '',
      `### Images over ${formatKilobytes(largeImageBytes)}`,
      '',
      '| Image | Size |',
      '| --- | ---: |',
      ...largeImages.map(({ path, bytes }) => `| \`${path}\` | ${formatKilobytes(bytes)} |`),
    );
  }

  return `${lines.join('\n')}\n`;
};
