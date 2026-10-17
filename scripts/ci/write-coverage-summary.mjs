// @ts-check
// Adds the total test coverage to the job summary. Run it after `pnpm test:coverage`, even when
// the tests failed, so the summary says whether a report exists.
import { existsSync, readFileSync } from 'node:fs';

import { COVERAGE_SUMMARY_FILE } from './constants.mjs';
import { appendJobSummary, renderCoverageSummary } from './utils.mjs';

/** @returns {unknown} The parsed coverage report, or `undefined` when it is missing or invalid. */
const readCoverageSummary = () => {
  if (!existsSync(COVERAGE_SUMMARY_FILE)) return undefined;

  try {
    return JSON.parse(readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
  } catch {
    return undefined;
  }
};

appendJobSummary({ markdown: renderCoverageSummary(readCoverageSummary()) });
