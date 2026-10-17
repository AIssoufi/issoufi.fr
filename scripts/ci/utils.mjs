// @ts-check
import { appendFileSync } from 'node:fs';

import { BYTES_PER_KILOBYTE, COVERAGE_METRICS, IMAGE_FILE_PATTERN } from './constants.mjs';

/**
 * A file of the build and its sizes.
 * @typedef {object} BuildFile
 * @property {string} path - Path relative to the build folder, e.g. `assets/index-B7cJ.js`.
 * @property {number} bytes - Size on disk.
 * @property {number} [gzipBytes] - Size once compressed with gzip, for scripts and style sheets.
 */

/**
 * Turns a size or a count read from a file or a report into a number that can be added up and
 * compared.
 * @param {unknown} value - Size or count to read.
 * @returns {number} The value, or 0 when it is negative, not a number or not finite.
 */
const toNonNegativeNumber = value => {
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

/**
 * Formats a coverage percentage with one decimal.
 * @param {unknown} percent - Percentage from the coverage report.
 * @returns {string} The percentage, e.g. `97.7%`, or `n/a` when the report gives no number.
 */
const formatPercent = percent => {
  const isPercent = typeof percent === 'number' && Number.isFinite(percent);
  return isPercent ? `${percent.toFixed(1)}%` : 'n/a';
};

/**
 * Writes the total test coverage as a Markdown table, for the job summary.
 * @param {unknown} summary - Content of the `coverage-summary.json` report of Vitest.
 * @returns {string} The Markdown table, or a note saying that there is no report when the
 * summary is missing or malformed.
 */
export const renderCoverageSummary = summary => {
  const total = /** @type {Record<string, any> | undefined} */ (summary)?.total;
  const hasTotal = typeof total === 'object' && total !== null;
  if (!hasTotal) return '## Coverage\n\nNo coverage report found.\n';

  const rows = COVERAGE_METRICS.map(metric => {
    const { covered, total: count, pct } = total[metric] ?? {};
    return `| ${metric} | ${toNonNegativeNumber(covered)} / ${toNonNegativeNumber(count)} | ${formatPercent(pct)} |`;
  });

  return ['## Coverage', '', '| Metric | Covered | % |', '| --- | ---: | ---: |', ...rows, ''].join(
    '\n',
  );
};

/**
 * Adds Markdown to the summary of the current GitHub Actions job, or prints it outside GitHub
 * Actions, so that the scripts also work locally.
 * @param {object} params
 * @param {string} [params.markdown] - Content to add. Defaults to nothing.
 * @param {string} [params.summaryFile] - File GitHub Actions reads the job summary from.
 * Defaults to the `GITHUB_STEP_SUMMARY` environment variable.
 */
export const appendJobSummary = ({
  markdown = '',
  summaryFile = process.env.GITHUB_STEP_SUMMARY,
}) => {
  if (summaryFile) appendFileSync(summaryFile, markdown);
  else process.stdout.write(markdown);
};
