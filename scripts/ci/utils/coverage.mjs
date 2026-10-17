// @ts-check
import { COVERAGE_METRICS } from '../constants.mjs';
import { formatPercent, toNonNegativeNumber } from './numbers.mjs';

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
