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
 * Adds up the gzip sizes of the scripts and style sheets of the build and compares the total
 * with the budget. A file with an invalid size counts as 0.
 * @param {object} params
 * @param {BuildFile[]} [params.scripts] - Scripts and style sheets of the build. Defaults to none.
 * @param {number} params.budgetBytes - Maximum total gzip size. The total may equal it.
 * @returns {{ totalGzipBytes: number, isOverBudget: boolean }} The total and whether it exceeds
 * the budget.
 * @throws {RangeError} When the budget is not a positive number, since every build would then
 * pass or fail whatever its size.
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
 * Lists the images of the build that are bigger than a size limit, the biggest first.
 * @param {object} params
 * @param {BuildFile[]} [params.files] - Files of the build, of any type. Defaults to none.
 * @param {number} params.limitBytes - Size above which an image is listed.
 * @returns {BuildFile[]} The images over the limit.
 */
export const findLargeImages = ({ files = [], limitBytes }) => {
  const isLargeImage = (/** @type {BuildFile} */ file) =>
    IMAGE_FILE_PATTERN.test(file?.path ?? '') && toNonNegativeNumber(file.bytes) > limitBytes;

  return files.filter(isLargeImage).sort((a, b) => b.bytes - a.bytes);
};

/**
 * Writes the size report of the build as Markdown, for the job summary: the gzip size of each
 * script and style sheet, the total against the budget, and the images over the size limit.
 * @param {object} params
 * @param {BuildFile[]} [params.scripts] - Scripts and style sheets of the build. Defaults to none.
 * @param {number} params.budgetBytes - Maximum total gzip size of the scripts.
 * @param {BuildFile[]} [params.largeImages] - Images over the limit, from {@link findLargeImages}.
 * Defaults to none.
 * @param {number} params.largeImageBytes - Size limit used to find the large images.
 * @returns {string} The Markdown report.
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
