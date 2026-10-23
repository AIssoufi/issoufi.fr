// @ts-check
import {
  PULL_REQUEST_RUN_LOOKUP_ATTEMPTS,
  PULL_REQUEST_RUN_LOOKUP_DELAY_MS,
  RUN_WAIT_ATTEMPTS,
  RUN_WAIT_DELAY_MS,
} from '../constants.mjs';
import { shortenSha } from './commit-sha.mjs';
import { isFinishedRun, isRunningRun } from './run-reading.mjs';
import { assertRunId, fetchLatestRun, fetchRun } from './run-requests.mjs';

/** @import { isHeldRun } from './run-reading.mjs' */
/** @import { approveRun } from './run-requests.mjs' */
/** @typedef {import('./run-reading.mjs').WorkflowRun} WorkflowRun */
/** @typedef {import('./run-requests.mjs').FetchLatestRunParams} FetchLatestRunParams */
/** @typedef {import('./run-requests.mjs').FetchRunParams} FetchRunParams */

/**
 * How long {@link waitForLatestRun} looks for a run.
 * @typedef {object} RunLookupOptions
 * @property {number} [attempts] - Number of times the runs are listed. Defaults to
 * {@link PULL_REQUEST_RUN_LOOKUP_ATTEMPTS}.
 * @property {number} [delayMs] - Pause between two lookups, in milliseconds. Defaults to
 * {@link PULL_REQUEST_RUN_LOOKUP_DELAY_MS}.
 */

/**
 * Parameters of {@link waitForLatestRun}: those of {@link fetchLatestRun}, and how long to look.
 * @typedef {FetchLatestRunParams & RunLookupOptions} WaitForLatestRunParams
 */

/**
 * Looks for the latest run of a workflow on a branch and a commit, listing the runs again at
 * regular intervals while there is none: GitHub creates a run a few seconds after its event.
 * @param {WaitForLatestRunParams} params
 * @returns {Promise<WorkflowRun | undefined>} The run once found, or `undefined` when the workflow
 * has not run on that commit after every attempt, or when `attempts` is not above 0.
 * @throws {Error} When {@link fetchLatestRun} throws, at the attempt that failed.
 * @example
 * await waitForLatestRun({ branch, event: 'pull_request', sha }); // { id: 501, sha, … }
 */
export const waitForLatestRun = async ({
  attempts = PULL_REQUEST_RUN_LOOKUP_ATTEMPTS,
  delayMs = PULL_REQUEST_RUN_LOOKUP_DELAY_MS,
  ...params
}) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const run = await fetchLatestRun(params);
    if (run) return run;
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return undefined;
};

/**
 * How long {@link waitForRun} waits.
 * @typedef {object} RunWaitOptions
 * @property {number} [attempts] - Number of times the run is read. Defaults to
 * {@link RUN_WAIT_ATTEMPTS}.
 * @property {number} [delayMs] - Pause between two reads, in milliseconds. Defaults to
 * {@link RUN_WAIT_DELAY_MS}.
 */

/**
 * Parameters of {@link waitForRun}: those of {@link fetchRun}, and how long to wait.
 * @typedef {FetchRunParams & RunWaitOptions} WaitForRunParams
 */

/**
 * Waits for a run of a workflow to finish, reading it at regular intervals. A read that fails,
 * such as an error of the API, is tried again at the next attempt. A run held for approval
 * ({@link isHeldRun}) has not finished: once approved with {@link approveRun}, it goes on with a
 * new attempt.
 * @param {WaitForRunParams} params
 * @returns {Promise<WorkflowRun | undefined>} The run once completed, or as last read when it was
 * still going after every attempt, or `undefined` when no answer of the API could be read as a
 * run, or when `attempts` is not above 0.
 * @throws {Error} At once when the identifier is not a positive integer, and when every read
 * failed, with the error of the last one.
 * @example
 * const run = await waitForRun({ runId: 123 });
 * describeRunOutcome(run).isSuccess; // true once the run passed
 */
export const waitForRun = async ({
  attempts = RUN_WAIT_ATTEMPTS,
  delayMs = RUN_WAIT_DELAY_MS,
  ...params
}) => {
  assertRunId(params.runId);

  /** @type {WorkflowRun | undefined} */
  let run;
  let hasRead = false;
  /** @type {unknown} */
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      run = await fetchRun(params);
      hasRead = true;
    } catch (error) {
      lastError = error;
    }
    if (isFinishedRun(run)) return run;
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  const hasOnlyFailed = !hasRead && lastError !== undefined;
  if (hasOnlyFailed) throw lastError;
  return run;
};

/**
 * How long {@link waitForLatestRunToFinish} waits for a run still going.
 * @typedef {object} LatestRunWaitOptions
 * @property {RunWaitOptions} [runWait] - Number of reads of the run and pause between them, given
 * to {@link waitForRun}. Defaults to its own: {@link RUN_WAIT_ATTEMPTS} reads every
 * {@link RUN_WAIT_DELAY_MS}, 20 minutes in all.
 */

/**
 * Parameters of {@link waitForLatestRunToFinish}: those of {@link fetchLatestRun}, and how long to
 * wait for a run still going.
 * @typedef {FetchLatestRunParams & LatestRunWaitOptions} WaitForLatestRunToFinishParams
 */

/**
 * Asks for the latest run of a workflow on a branch and a commit, as {@link fetchLatestRun} does,
 * and waits for it with {@link waitForRun} while it is still going, so that a commit pushed just
 * before is not taken for untested. A run that finished, or that GitHub holds for approval, comes
 * back at once.
 * @param {WaitForLatestRunToFinishParams} params
 * @returns {Promise<WorkflowRun | undefined>} The run once finished, or as last read when it was
 * still going after the wait, or `undefined` when the workflow has not run on that commit.
 * @throws {Error} When {@link fetchLatestRun} throws, or when every read of the wait failed.
 * @example
 * const run = await waitForLatestRunToFinish({ branch: 'develop', event: null, sha });
 * getCiVerdict({ run, sha }).isTested; // true once the run passed
 */
export const waitForLatestRunToFinish = async ({ runWait, ...params }) => {
  const run = await fetchLatestRun(params);
  const isStillRunning = run !== undefined && isRunningRun(run);
  if (!isStillRunning) return run;

  console.log(
    `Waiting for the run still going on ${shortenSha(run.sha)} (${run.status}): ${run.url}`,
  );
  const { apiUrl, repository, token } = params;
  // A wait whose answers could never be read as a run leaves the run as listed
  return (await waitForRun({ runId: run.id, apiUrl, repository, token, ...runWait })) ?? run;
};
