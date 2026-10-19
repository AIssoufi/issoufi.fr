// @ts-check
import { stripVTControlCharacters } from 'node:util';

import {
  EXPECTED_TEST_STATUS,
  LINE_BREAK_PATTERN,
  SCREENSHOT_DIFF_ATTACHMENT_SUFFIXES,
  TABLE_CELL_PIPE_PATTERN,
  TEST_TITLE_SEPARATOR,
  UNSTABLE_SCREENSHOT_ATTACHMENT_SUFFIX,
  VISUAL_REPORT_DIR,
} from '../constants.mjs';
import { toList } from './lists.mjs';

/**
 * How a screen of the change compares with the same screen of its base: `unchanged` when the
 * change draws it as the base did, `changed` when it draws it otherwise, and `failed` when no
 * comparison could be made, such as a page that did not load or never stood still.
 * @typedef {'unchanged' | 'changed' | 'failed'} ScreenOutcome
 */

/**
 * A screen of the screenshot comparison: a test of `e2e/*.visual.ts`, read from the JSON report of
 * Playwright.
 * @typedef {object} ScreenResult
 * @property {string} title - Titles of the groups of the test, then of the test, joined as the
 * reports of Playwright join them, e.g. `laptop, 1280 px › /en/projects`.
 * @property {ScreenOutcome} outcome - How the screen compares with the base.
 * @property {string} [error] - First line of the error of a `failed` screen, without the colors of
 * the terminal. Empty when the report gives none.
 */

/**
 * A test or a group of tests of the JSON report of Playwright, as far as these helpers read it.
 * Every field may be missing or malformed.
 * @typedef {Record<string, any> | null | undefined} ReportNode
 */

/**
 * Tells whether the name of an attachment ends with a suffix.
 * @param {string} suffix - End of the name, e.g. `-diff.png`.
 * @returns {(name: string) => boolean} A predicate on the name of an attachment.
 */
const endsWith = suffix => name => name.endsWith(suffix);

/**
 * Reads the error of the last run of a test, for the summary: its first line, without the colors
 * of the terminal.
 * @param {ReportNode} result - Last run of the test, from its `results`.
 * @returns {string} The first line, or an empty text when the run holds no error message.
 */
const readFirstErrorLine = result => {
  const [firstError] = toList(result?.errors);
  const message = firstError?.message ?? result?.error?.message;
  if (typeof message !== 'string') return '';

  const [firstLine] = stripVTControlCharacters(message).split(LINE_BREAK_PATTERN);
  return firstLine.trim();
};

/**
 * Decides how a screen compares with the base, from its test in the JSON report of Playwright: a
 * test that passed drew the screen as the base did; a test that failed with the screenshots of
 * both and their diff drew it otherwise; any other failure, such as a page that did not load,
 * that never stood still (it attaches the screenshot before the last one), or a screen that the
 * base lacks, made no comparison.
 * @param {ReportNode} test - Test of the report, from the `tests` of a spec.
 * @returns {ScreenOutcome} The outcome of the screen.
 * @example
 * getScreenOutcome({ status: 'expected' }); // 'unchanged'
 */
export const getScreenOutcome = test => {
  if (test?.status === EXPECTED_TEST_STATUS) return 'unchanged';

  const lastResult = toList(test?.results).at(-1);
  const attachmentNames = toList(lastResult?.attachments)
    .map(attachment => attachment?.name)
    .filter(name => typeof name === 'string');
  const hasDiff = SCREENSHOT_DIFF_ATTACHMENT_SUFFIXES.every(suffix =>
    attachmentNames.some(endsWith(suffix)),
  );
  const isUnstable = attachmentNames.some(endsWith(UNSTABLE_SCREENSHOT_ATTACHMENT_SUFFIX));
  return hasDiff && !isUnstable ? 'changed' : 'failed';
};

/**
 * Parameters of {@link listSuiteScreens}.
 * @typedef {object} ListSuiteScreensParams
 * @property {ReportNode} suite - Group of tests of the report, from its `suites`.
 * @property {string[]} titles - Titles of the groups that hold it, the files left out.
 */

/**
 * Lists the screens of a group of tests and of the groups it holds, in the order of the report.
 * @param {ListSuiteScreensParams} params
 * @returns {ScreenResult[]} One screen per test.
 */
const listSuiteScreens = ({ suite, titles }) => {
  const specScreens = toList(suite?.specs).flatMap(spec =>
    toList(spec?.tests).map(test => {
      const title = [...titles, String(spec?.title ?? '')].join(TEST_TITLE_SEPARATOR);
      const outcome = getScreenOutcome(test);
      if (outcome !== 'failed') return { title, outcome };

      return { title, outcome, error: readFirstErrorLine(toList(test?.results).at(-1)) };
    }),
  );
  const childScreens = toList(suite?.suites).flatMap(child =>
    listSuiteScreens({ suite: child, titles: [...titles, String(child?.title ?? '')] }),
  );
  return [...specScreens, ...childScreens];
};

/**
 * Lists the screens of the screenshot comparison, with their outcome, from the JSON report of
 * Playwright: one per test, titled by the groups that hold it, then by its own title. The groups
 * at the top of the report, the test files, are left out of the titles.
 * @param {unknown} report - Parsed JSON report of Playwright. Any malformed part counts as no
 * test.
 * @returns {ScreenResult[]} The screens, in the order of the report.
 * @example
 * listScreenResults({
 *   suites: [{ title: 'pages.visual.ts', suites: [{ title: 'laptop, 1280 px', specs: [
 *     { title: '/projects', tests: [{ status: 'expected' }] },
 *   ] }] }],
 * }); // [{ title: 'laptop, 1280 px › /projects', outcome: 'unchanged' }]
 */
export const listScreenResults = report =>
  toList(/** @type {ReportNode} */ (report)?.suites).flatMap(file =>
    listSuiteScreens({ suite: file, titles: [] }),
  );

/**
 * Writes a text in a cell of a Markdown table, its pipes escaped so that they do not end it.
 * @param {string} text - Text of the cell, on one line.
 * @returns {string} The text of the cell.
 */
const toTableCell = text => text.replace(TABLE_CELL_PIPE_PATTERN, '\\|');

/**
 * Writes the outcome of a screen that the comparison lists, for its row in the summary.
 * @param {ScreenResult} screen - A changed or a failed screen.
 * @returns {string} `changed`, or `failed` followed by its error when there is one.
 */
const describeOutcome = ({ outcome, error }) => (error ? `${outcome}: ${error}` : outcome);

/**
 * Parameters of {@link renderScreenshotSummary}.
 * @typedef {object} RenderScreenshotSummaryParams
 * @property {ScreenResult[]} [screens] - Screens of the comparison, from {@link listScreenResults}.
 * Any value that is not an array counts as none.
 * @property {string} [base] - Commit of the base of the change, e.g. its short hash. Defaults to
 * an empty text.
 */

/**
 * Writes the result of the screenshot comparison as Markdown, for the job summary or the terminal:
 * how many screens changed, then a table of the changed and the failed ones, and where to see
 * their screenshots. Comparing no screen at all is reported as a failure.
 * @param {RenderScreenshotSummaryParams} params
 * @returns {string} The Markdown summary.
 * @example
 * renderScreenshotSummary({
 *   screens: [{ title: 'laptop, 1280 px › /', outcome: 'unchanged' }],
 *   base: '81c31c1',
 * }); // '## Screenshots\n\n✅ None of the 1 screens changed, compared with the base …'
 */
export const renderScreenshotSummary = ({ screens, base = '' }) => {
  const comparedScreens = toList(screens);
  const hasScreens = comparedScreens.length > 0;
  if (!hasScreens) return '## Screenshots\n\n❌ No screen was compared: see the log of the job.\n';

  const listedScreens = comparedScreens.filter(({ outcome }) => outcome !== 'unchanged');
  const changedCount = listedScreens.filter(({ outcome }) => outcome === 'changed').length;
  const failedCount = listedScreens.length - changedCount;
  const total = comparedScreens.length;
  const comparison = `compared with the base of the change, \`${base}\``;
  const hasListedScreens = listedScreens.length > 0;
  if (!hasListedScreens) {
    return `## Screenshots\n\n✅ None of the ${total} screens changed, ${comparison}.\n`;
  }

  const icon = failedCount > 0 ? '❌' : '🖼️';
  const rows = listedScreens.map(
    screen => `| ${toTableCell(screen.title)} | ${toTableCell(describeOutcome(screen))} |`,
  );
  return [
    '## Screenshots',
    '',
    `${icon} ${changedCount} of the ${total} screens changed and ${failedCount} failed, ${comparison}.`,
    '',
    '| Screen | Result |',
    '| --- | --- |',
    ...rows,
    '',
    `The HTML report, in \`${VISUAL_REPORT_DIR}/\` (the \`${VISUAL_REPORT_DIR}\` artifact of the run on GitHub Actions), shows each changed screen before (Expected) and after the change (Actual), with their Diff and a Slider: open it with \`pnpm exec playwright show-report ${VISUAL_REPORT_DIR}\`.`,
    '',
  ].join('\n');
};
