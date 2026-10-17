// @ts-check
import { appendFileSync } from 'node:fs';

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
