// @ts-check
import {
  CI_WORKFLOW_FILE,
  COMMIT_SHA_PATTERN,
  DEFAULT_GITHUB_API_URL,
  DEVELOP_BRANCH,
  LATEST_RUN_PAGE_SIZE,
  PULL_REQUEST_RUN_LOOKUP_ATTEMPTS,
  PULL_REQUEST_RUN_LOOKUP_DELAY_MS,
  PUSH_EVENT,
  RUN_ACTION_REQUIRED_CONCLUSION,
  RUN_COMPLETED_STATUS,
  RUN_SUCCESS_CONCLUSION,
  RUN_WAIT_ATTEMPTS,
  RUN_WAIT_DELAY_MS,
  SHORT_SHA_LENGTH,
} from '../constants.mjs';
import { getRepositoryApiUrl, requestGitHub, requestRepositoryApi } from './github-api.mjs';
import { isPositiveInteger } from './numbers.mjs';

/**
 * Tells whether a value is the full SHA of a git commit, as `git rev-parse` writes it.
 * @param {unknown} value - Value to check.
 * @returns {value is string} False for a short or uppercase SHA, a branch name and a value that
 * is not a string.
 * @example
 * isCommitSha('58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8'); // true
 * isCommitSha('58ff9ea'); // false
 */
export const isCommitSha = value => typeof value === 'string' && COMMIT_SHA_PATTERN.test(value);

/**
 * Shortens a commit SHA the way git shows it.
 * @param {unknown} sha - SHA to shorten.
 * @returns {string} Its first {@link SHORT_SHA_LENGTH} digits, or an empty string when it is not
 * a string.
 * @example
 * shortenSha('58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8'); // '58ff9ea'
 */
export const shortenSha = sha => (typeof sha === 'string' ? sha.slice(0, SHORT_SHA_LENGTH) : '');

/**
 * Parameters of {@link getWorkflowRunsUrl}.
 * @typedef {object} GetWorkflowRunsUrlParams
 * @property {string} [apiUrl] - REST API of GitHub, the `GITHUB_API_URL` variable. Defaults to
 * {@link DEFAULT_GITHUB_API_URL}.
 * @property {string} [repository] - Repository as `owner/name`, the `GITHUB_REPOSITORY` variable.
 * @property {string} [workflow] - File name of the workflow. Defaults to {@link CI_WORKFLOW_FILE}.
 * @property {string} [branch] - Branch the runs were started on, e.g. `develop`.
 * @property {string | null} [event] - Event that started the runs, or `null` for runs started by
 * any event. Defaults to {@link PUSH_EVENT}.
 * @property {string} [sha] - Full SHA of the commit the runs tested.
 */

/**
 * Builds the address of the REST API endpoint that lists the runs of a workflow, filtered to one
 * branch, one event and one commit, with only the latest run.
 * @param {GetWorkflowRunsUrlParams} params
 * @returns {string | undefined} The address, or `undefined` when the repository is not
 * `owner/name`, the branch is missing, the SHA is not a full commit SHA or the API address is
 * invalid.
 * @example
 * getWorkflowRunsUrl({ repository: 'AIssoufi/issoufi.fr', branch: 'develop', sha });
 * // 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows/ci.yml/runs
 * // ?branch=develop&event=push&head_sha=…&per_page=1'
 */
export const getWorkflowRunsUrl = ({
  apiUrl = DEFAULT_GITHUB_API_URL,
  repository,
  workflow = CI_WORKFLOW_FILE,
  branch,
  event = PUSH_EVENT,
  sha,
}) => {
  const hasBranch = typeof branch === 'string' && branch !== '';
  if (!hasBranch || !isCommitSha(sha)) return undefined;

  const perPage = String(LATEST_RUN_PAGE_SIZE);
  return getRepositoryApiUrl({
    apiUrl,
    repository,
    path: `/actions/workflows/${encodeURIComponent(workflow)}/runs`,
    query: {
      branch,
      ...(event !== null && { event }),
      head_sha: sha,
      per_page: perPage,
    },
  });
};

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
 */

/**
 * Reads a run of a workflow from an answer of the REST API.
 * @param {unknown} value - The run, as the API writes it.
 * @returns {WorkflowRun | undefined} The run, or `undefined` when the value is not an object, or
 * when it lacks its identifier, commit, status, conclusion, creation date or page.
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
  return isRun ? { id, sha, status, conclusion, createdAt, url } : undefined;
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
 */
const isFinishedRun = run => run?.status === RUN_COMPLETED_STATUS && !isHeldRun(run);

/**
 * Tells whether a run is still going: queued, waiting or in progress. A run held for approval
 * reads as completed, so it is not: nothing happens until someone approves it.
 * @param {WorkflowRun} run - The run, from {@link readRun}.
 * @returns {boolean} False once the run is completed, whatever its conclusion.
 */
const isRunningRun = run => run.status !== RUN_COMPLETED_STATUS;

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

/**
 * How a run ended, from {@link describeRunOutcome}.
 * @typedef {object} RunOutcome
 * @property {boolean} isSuccess - Whether the run finished with a success.
 * @property {string} outcome - What happened, as the end of a sentence about the run, such as
 * `the CI of develop passed on 58ff9ea: <page of the run>`.
 */

/**
 * Tells how a run of a workflow ended, for a message about it: passed, still running, waiting for
 * approval, or did not pass. A run still in progress, held, failed, cancelled or timed out does
 * not count as a success.
 * @param {WorkflowRun | undefined} run - The run, from {@link readRun}.
 * @returns {RunOutcome} Whether the run passed, and the end of a sentence that says what
 * happened: `passed on <commit>: <page>`, `is still running on <commit> (<status>): <page>`,
 * `is waiting for someone to approve it on <commit>: <page>`,
 * `did not pass on <commit> (<conclusion>): <page>`, or `could not be read.` without a run.
 * @example
 * `The CI of develop ${describeRunOutcome(run).outcome}`;
 * // 'The CI of develop is still running on 58ff9ea (in_progress): https://github.com/…'
 */
export const describeRunOutcome = run => {
  if (!run) return { isSuccess: false, outcome: 'could not be read.' };

  const commit = shortenSha(run.sha);
  if (isHeldRun(run)) {
    return {
      isSuccess: false,
      outcome: `is waiting for someone to approve it on ${commit}: ${run.url}`,
    };
  }

  const isCompleted = run.status === RUN_COMPLETED_STATUS;
  if (!isCompleted) {
    return {
      isSuccess: false,
      outcome: `is still running on ${commit} (${run.status}): ${run.url}`,
    };
  }

  const isSuccess = run.conclusion === RUN_SUCCESS_CONCLUSION;
  if (!isSuccess) {
    return {
      isSuccess: false,
      outcome: `did not pass on ${commit} (${run.conclusion ?? 'no conclusion'}): ${run.url}`,
    };
  }

  return { isSuccess: true, outcome: `passed on ${commit}: ${run.url}` };
};

/**
 * Whether a commit can be deployed, and why, from {@link getCiVerdict}.
 * @typedef {object} CiVerdict
 * @property {boolean} isTested - Whether the CI run of the commit finished with a success.
 * @property {string} message - Why, for the log, or for a notice when the deploy stops.
 */

/**
 * Parameters of {@link getCiVerdict}.
 * @typedef {object} GetCiVerdictParams
 * @property {WorkflowRun} [run] - Latest run of the CI for the commit, from {@link readLatestRun}.
 * Missing when the CI has not run on that commit.
 * @property {string} [sha] - Full SHA of the commit to deploy.
 * @property {string} [branch] - Branch the run was started on, named in the message. Defaults to
 * {@link DEVELOP_BRANCH}.
 */

/**
 * Tells whether a commit passed its CI, so that only a tested commit reaches production: its
 * latest run must be completed with a success. A run still in progress, failed, cancelled or
 * timed out stops the deploy until the next one.
 * @param {GetCiVerdictParams} params
 * @returns {CiVerdict} Whether the commit is tested and why. A missing run, or a run of another
 * commit, counts as untested.
 * @example
 * getCiVerdict({ run: { sha, status: 'in_progress', conclusion: null, url }, sha });
 * // { isTested: false, message: 'Nothing deployed: the CI of develop is still running on
 * // 58ff9ea (in_progress): https://github.com/…' }
 */
export const getCiVerdict = ({ run, sha, branch = DEVELOP_BRANCH }) => {
  const isRunOfCommit = isCommitSha(sha) && run?.sha === sha;
  if (!isRunOfCommit) {
    return {
      isTested: false,
      message: `Nothing deployed: the CI has not run on ${branch} for ${shortenSha(sha) || 'this commit'}.`,
    };
  }

  const { isSuccess, outcome } = describeRunOutcome(run);
  return isSuccess
    ? { isTested: true, message: `The CI of ${branch} ${outcome}` }
    : { isTested: false, message: `Nothing deployed: the CI of ${branch} ${outcome}` };
};

/**
 * Parameters of {@link fetchLatestRun}: the filters of {@link getWorkflowRunsUrl}, whose `apiUrl`
 * and `repository` default to the `GITHUB_API_URL` and `GITHUB_REPOSITORY` variables of GitHub
 * Actions, and the `token` to read the runs with, which defaults to the `GITHUB_TOKEN` variable
 * and needs the `actions: read` permission.
 * @typedef {GetWorkflowRunsUrlParams & { token?: string }} FetchLatestRunParams
 */

/**
 * Asks the REST API of GitHub for the latest run of a workflow on a branch and a commit.
 * @param {FetchLatestRunParams} params
 * @returns {Promise<WorkflowRun | undefined>} The latest run, or `undefined` when the workflow
 * has not run on that commit yet.
 * @throws {Error} When the repository, the branch or the SHA cannot make a request, or when the
 * API answers with an error status.
 * @example
 * await fetchLatestRun({ branch: 'develop', sha }); // { sha, status: 'completed', … }
 */
export const fetchLatestRun = async ({
  apiUrl = process.env.GITHUB_API_URL || DEFAULT_GITHUB_API_URL,
  repository = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  ...filters
}) => {
  const url = getWorkflowRunsUrl({ apiUrl, repository, ...filters });
  if (!url) {
    throw new Error(
      `Cannot list the workflow runs of "${repository ?? ''}" on "${filters.branch ?? ''}" for "${filters.sha ?? ''}"`,
    );
  }

  return readLatestRun(await requestGitHub({ url, token }));
};

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
 * Checks the identifier of a run before the API is asked for it.
 * @param {unknown} runId - Identifier to check.
 * @throws {Error} When it is not a positive integer.
 */
const assertRunId = runId => {
  if (!isPositiveInteger(runId)) throw new Error(`Invalid workflow run "${runId ?? ''}"`);
};

/**
 * Parameters of {@link fetchRun}.
 * @typedef {object} FetchRunParams
 * @property {number} runId - Identifier of the run, e.g. from {@link dispatchWorkflow}.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to read the run with, which needs the `actions: read`
 * permission. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Asks the REST API of GitHub for a run of a workflow.
 * @param {FetchRunParams} params
 * @returns {Promise<WorkflowRun | undefined>} The run, or `undefined` when {@link readRun}
 * cannot read the answer.
 * @throws {Error} When the identifier is not a positive integer, or when the API answers with an
 * error status.
 * @example
 * await fetchRun({ runId: 123 }); // { sha, status: 'in_progress', conclusion: null, url }
 */
export const fetchRun = async ({ runId, ...api }) => {
  assertRunId(runId);

  return readRun(await requestRepositoryApi({ ...api, path: `/actions/runs/${runId}` }));
};

/**
 * Parameters of {@link approveRun}: those of {@link fetchRun}, whose `token` needs the
 * `actions: write` permission.
 * @typedef {FetchRunParams} ApproveRunParams
 */

/**
 * Approves a run that GitHub holds ({@link isHeldRun}), as _Approve workflows to run_ does on the
 * pull request: GitHub starts it again, with a new attempt of the same run.
 * @param {ApproveRunParams} params
 * @returns {Promise<void>}
 * @throws {Error} When the identifier is not a positive integer, or when GitHub refuses, for
 * example to a token that may not approve the run.
 * @example
 * await approveRun({ runId: 123 });
 */
export const approveRun = async ({ runId, ...api }) => {
  assertRunId(runId);

  await requestRepositoryApi({ ...api, path: `/actions/runs/${runId}/approve`, method: 'POST' });
};

/**
 * Parameters of {@link fetchWorkflowRuns}.
 * @typedef {object} FetchWorkflowRunsParams
 * @property {string} workflow - File name of the workflow, e.g. `deploy-production.yml`.
 * @property {string} event - Event that started the runs, e.g. `schedule`.
 * @property {number} perPage - Number of runs to read, newest first, up to 100.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to read the runs with, which needs the `actions: read`
 * permission. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Asks the REST API of GitHub for the latest runs of a workflow started by one event, on any
 * branch and commit.
 * @param {FetchWorkflowRunsParams} params
 * @returns {Promise<WorkflowRun[]>} The runs, newest first, without those {@link readRun} cannot
 * read.
 * @throws {Error} When the repository is invalid, or when the API answers with an error status.
 * @example
 * await fetchWorkflowRuns({ workflow: 'deploy-production.yml', event: 'schedule', perPage: 20 });
 */
export const fetchWorkflowRuns = async ({ workflow, event, perPage, ...api }) =>
  readRuns(
    await requestRepositoryApi({
      ...api,
      path: `/actions/workflows/${encodeURIComponent(workflow)}/runs`,
      query: { event, per_page: String(perPage) },
    }),
  );

/**
 * A run that {@link dispatchWorkflow} started.
 * @typedef {object} DispatchedRun
 * @property {number} id - Identifier of the run, to follow it with {@link fetchRun}.
 * @property {string} url - Page of the run on GitHub.
 */

/**
 * Reads the run that GitHub started from the answer of the endpoint that dispatches a workflow,
 * asked with `return_run_details`.
 * @param {unknown} response - Parsed JSON answer, `{ workflow_run_id, run_url, html_url }`.
 * @returns {DispatchedRun | undefined} The run, or `undefined` when the answer lacks a positive
 * integer identifier or the page of the run.
 * @example
 * readDispatchedRun({ workflow_run_id: 123, html_url: 'https://github.com/…/runs/123' });
 * // { id: 123, url: 'https://github.com/…/runs/123' }
 */
export const readDispatchedRun = response => {
  const { workflow_run_id: id, html_url: url } =
    /** @type {Record<string, unknown> | null | undefined} */ (response) ?? {};
  const isRun = isPositiveInteger(id) && typeof url === 'string' && url !== '';
  return isRun ? { id, url } : undefined;
};

/**
 * Parameters of {@link dispatchWorkflow}.
 * @typedef {object} DispatchWorkflowParams
 * @property {string} workflow - File name of the workflow, which must have a
 * `workflow_dispatch` trigger, e.g. `ci.yml`.
 * @property {string} ref - Branch or tag to run the workflow on, e.g. `develop`.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to start the run with, which needs the `actions: write`
 * permission. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Starts a workflow by hand on a branch, as _Run workflow_ does. Unlike the other events that the
 * `GITHUB_TOKEN` triggers, such a run starts at once, without approval.
 * @param {DispatchWorkflowParams} params
 * @returns {Promise<DispatchedRun>} The run that GitHub started.
 * @throws {Error} When the workflow or the branch is missing, when the API answers with an error
 * status, or when it does not say which run it started.
 * @example
 * await dispatchWorkflow({ workflow: 'ci.yml', ref: 'develop' }); // { id: 123, url: '…' }
 */
export const dispatchWorkflow = async ({ workflow, ref, ...api }) => {
  const hasWorkflow = typeof workflow === 'string' && workflow !== '';
  const hasRef = typeof ref === 'string' && ref !== '';
  if (!hasWorkflow || !hasRef) {
    throw new Error(`Cannot start the workflow "${workflow ?? ''}" on "${ref ?? ''}"`);
  }

  const response = await requestRepositoryApi({
    ...api,
    path: `/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    method: 'POST',
    body: { ref, return_run_details: true },
  });
  const run = readDispatchedRun(response);
  if (!run) throw new Error(`GitHub started ${workflow} on ${ref} without saying which run`);
  return run;
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
