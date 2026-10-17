// @ts-check
import { appendFileSync } from 'node:fs';

/**
 * Parameters of {@link appendJobSummary}.
 * @typedef {object} AppendJobSummaryParams
 * @property {string} [markdown] - Content to add. Defaults to nothing.
 * @property {string} [summaryFile] - File GitHub Actions reads the job summary from. Defaults to
 * the `GITHUB_STEP_SUMMARY` environment variable.
 */

/**
 * Adds Markdown to the summary of the current GitHub Actions job, or prints it outside GitHub
 * Actions, so that the scripts also work locally.
 * @param {AppendJobSummaryParams} params
 * @example
 * appendJobSummary({ markdown: renderCoverageSummary(summary) });
 */
export const appendJobSummary = ({
  markdown = '',
  summaryFile = process.env.GITHUB_STEP_SUMMARY,
}) => {
  if (summaryFile) appendFileSync(summaryFile, markdown);
  else process.stdout.write(markdown);
};
