// @ts-check
import { appendFileSync } from 'node:fs';

import { COVERAGE_METRICS } from './constants.mjs';

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
