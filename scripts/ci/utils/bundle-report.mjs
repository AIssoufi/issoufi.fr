// @ts-check
import { HOME_PAGE_FILE, MISSING_INITIAL_LOAD_REASON } from '../constants.mjs';
import { checkBundleBudgets, isBuildFile } from './bundle.mjs';
import { toList } from './lists.mjs';
import { formatKilobytes, isPositiveNumber } from './numbers.mjs';

/** @typedef {import('./bundle.mjs').BuildFile} BuildFile */
/** @typedef {import('./bundle.mjs').CheckBundleBudgetsParams} CheckBundleBudgetsParams */

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
 * {@link checkBundleBudgets}. Any value that is not an array counts as none.
 * @property {BuildFile[]} [otherScripts] - The other scripts and style sheets of the build, from
 * {@link checkBundleBudgets}. Any value that is not an array counts as none.
 * @property {number} [initialLoadGzipBytes] - Gzip size of the initial load, shown on the row after
 * its files, from {@link checkBundleBudgets}. Defaults to 0, and an invalid size is shown as 0.
 * @property {number} [totalGzipBytes] - Total gzip size shown on the last row, from
 * {@link checkBundleBudgets}. Defaults to 0, and an invalid size is shown as 0.
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
 * @property {BuildFile[]} [largeImages] - Images over the limit, from `findLargeImages` of
 * `bundle.mjs`. Any value that is not an array counts as none.
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
 * `findLargeImages` of `bundle.mjs`.
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
 * @property {number} totalGzipBytes - Gzip size checked, from {@link checkBundleBudgets}.
 * @property {boolean} isOverBudget - Whether the size exceeds the budget, from
 * {@link checkBundleBudgets}.
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
 * The scripts and budgets of {@link checkBundleBudgets} ({@link CheckBundleBudgetsParams}), and
 * the large images of {@link renderLargeImagesSection} ({@link RenderLargeImagesSectionParams}).
 * @typedef {CheckBundleBudgetsParams & RenderLargeImagesSectionParams} RenderBundleReportParams
 */

/**
 * Writes the size report of the build as Markdown, for the job summary: the table of the scripts
 * and style sheets ({@link renderScriptsTable}), the initial load and the total against their
 * budgets, and the images over the size limit ({@link renderLargeImagesSection}). Entries that
 * are not build files (see {@link isBuildFile}) are left out, of the sizes too.
 * When the home page references none of the scripts, the initial load is reported as not found,
 * a failure, since its budget cannot be checked (see {@link checkBundleBudgets}).
 * @param {RenderBundleReportParams} params
 * @returns {string} The Markdown report.
 * @throws {RangeError} When a budget or the image size limit is not a finite number above 0, like
 * {@link checkBundleBudgets} and `findLargeImages` of `bundle.mjs`.
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
  const { initialScripts, otherScripts, hasInitialLoad, initialLoad, total } = checkBundleBudgets({
    scripts,
    initialPaths,
    budgetBytes,
    initialLoadBudgetBytes,
  });
  const initialLoadVerdict = hasInitialLoad
    ? renderBudgetVerdict({
        ...initialLoad,
        name: 'Initial load',
        budgetBytes: initialLoadBudgetBytes,
      })
    : `❌ Initial load not found: \`${HOME_PAGE_FILE}\` ${MISSING_INITIAL_LOAD_REASON}.`;

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
    initialLoadVerdict,
    '',
    renderBudgetVerdict({ ...total, name: 'Total', budgetBytes }),
  ];

  const hasImagesSection = imagesSection !== '';
  if (hasImagesSection) lines.push('', imagesSection);

  return `${lines.join('\n')}\n`;
};
