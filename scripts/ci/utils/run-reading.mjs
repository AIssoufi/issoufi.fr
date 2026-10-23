// @ts-check
import { RUN_ACTION_REQUIRED_CONCLUSION, RUN_COMPLETED_STATUS } from '../constants.mjs';
import { isCommitSha } from './commit-sha.mjs';
import { isPositiveInteger } from './numbers.mjs';

/** @import { fetchRun } from './run-requests.mjs' */

/**
 * A run of a workflow, as {@link readRun} reads it from the REST API.
 * @typedef {object} WorkflowRun
 * @property {number} id - Identifier of the run, to read it again with {@link fetchRun}.
 * @property {string} sha - Commit the run tested.
 * @property {string} status - `queued`, `in_progress`, `completed`…
 * @property {string | null} conclusion - `success`, `failure`, `cancelled`…, or `null` while the
 * run has not finished.
 * @property {Date} createdAt - Moment GitHub created the run, which for a scheduled run is when
 * its cron fired, delays of the scheduler included.
 * @property {string} url - Page of the run on GitHub.
 * @property {string} [title] - Title of the run in the Actions tab, the `run-name` of its
 * workflow or else its name, left out when the API does not give it.
 */

/**
 * Reads a run of a workflow from an answer of the REST API.
 * @param {unknown} value - The run, as the API writes it.
 * @returns {WorkflowRun | undefined} The run, or `undefined` when the value is not an object, or
 * when it lacks its identifier, commit, status, conclusion, creation date or page. A title that
 * is not a string is left out.
 * @example
 * readRun({ id: 123, head_sha, status: 'completed', conclusion: 'success', created_at, html_url });
 * // { id: 123, sha: head_sha, status: 'completed', conclusion: 'success', createdAt, url }
 */
export const readRun = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return undefined;

  const {
    id,
    head_sha: sha,
    status,
    conclusion,
    created_at: creationDate,
    html_url: url,
    display_title: title,
  } = /** @type {Record<string, unknown>} */ (value);
  const createdAt = new Date(typeof creationDate === 'string' ? creationDate : Number.NaN);
  const hasCreationDate = !Number.isNaN(createdAt.getTime());
  const hasConclusion = typeof conclusion === 'string' || conclusion === null;
  const isRun =
    isPositiveInteger(id) &&
    isCommitSha(sha) &&
    typeof status === 'string' &&
    hasConclusion &&
    hasCreationDate &&
    typeof url === 'string';
  if (!isRun) return undefined;

  return {
    id,
    sha,
    status,
    conclusion,
    createdAt,
    url,
    ...(typeof title === 'string' && { title }),
  };
};

/**
 * Tells whether GitHub holds a run until someone approves it
 * ({@link RUN_ACTION_REQUIRED_CONCLUSION}).
 * @param {WorkflowRun | undefined} run - The run, from {@link readRun}.
 * @returns {boolean} False without a run.
 * @example
 * isHeldRun({ ...run, status: 'completed', conclusion: 'action_required' }); // true
 */
export const isHeldRun = run =>
  run?.status === RUN_COMPLETED_STATUS && run.conclusion === RUN_ACTION_REQUIRED_CONCLUSION;

/**
 * Tells whether a run has finished, whatever its conclusion. A run held for approval reads as
 * completed, but has not run yet: approving it starts it again.
 * @param {WorkflowRun | undefined} run - The run, from {@link readRun}.
 * @returns {boolean} False without a run.
 * @example
 * isFinishedRun({ ...run, status: 'completed', conclusion: 'failure' }); // true
 */
export const isFinishedRun = run => run?.status === RUN_COMPLETED_STATUS && !isHeldRun(run);

/**
 * Tells whether a run is still going: queued, waiting or in progress. A run held for approval
 * reads as completed, so it is not: nothing happens until someone approves it.
 * @param {WorkflowRun} run - The run, from {@link readRun}.
 * @returns {boolean} False once the run is completed, whatever its conclusion.
 * @example
 * isRunningRun({ ...run, status: 'in_progress', conclusion: null }); // true
 */
export const isRunningRun = run => run.status !== RUN_COMPLETED_STATUS;

/**
 * Reads the latest run from the answer of the endpoint that lists the runs of a workflow, newest
 * first.
 * @param {unknown} response - Parsed JSON answer, with its `workflow_runs` list.
 * @returns {WorkflowRun | undefined} The first run of the list, or `undefined` when the list is
 * missing or empty, or when {@link readRun} cannot read that run.
 * @example
 * readLatestRun({
 *   workflow_runs: [{ head_sha, status: 'completed', conclusion: 'success', html_url }],
 * });
 * // { sha: head_sha, status: 'completed', conclusion: 'success', url: html_url }
 */
export const readLatestRun = response => {
  const runs = /** @type {Record<string, unknown> | null | undefined} */ (response)?.workflow_runs;
  return Array.isArray(runs) ? readRun(runs[0]) : undefined;
};

/**
 * Reads every run from the answer of the endpoint that lists the runs of a workflow, in its
 * order, newest first.
 * @param {unknown} response - Parsed JSON answer, with its `workflow_runs` list.
 * @returns {WorkflowRun[]} The runs that {@link readRun} can read, or an empty list when the list
 * is missing.
 * @example
 * readRuns({ workflow_runs: [apiRun, { odd: true }] }); // [run]
 */
export const readRuns = response => {
  const runs = /** @type {Record<string, unknown> | null | undefined} */ (response)?.workflow_runs;
  if (!Array.isArray(runs)) return [];

  return runs.map(readRun).filter(run => run !== undefined);
};
