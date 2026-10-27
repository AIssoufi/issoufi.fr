// @ts-check
import {
  CI_WORKFLOW_FILE,
  DEFAULT_GITHUB_API_URL,
  LATEST_RUN_PAGE_SIZE,
  PUSH_EVENT,
} from '../constants.mjs';
import { isCommitSha } from './commit-sha.mjs';
import { getRepositoryApiUrl, requestGitHub, requestRepositoryApi } from './github-api.mjs';
import { isPositiveInteger } from './numbers.mjs';
import { readLatestRun, readRun, readRuns } from './run-reading.mjs';

/** @import { isHeldRun } from './run-reading.mjs' */
/** @import { dispatchWorkflow } from './workflow-dispatch.mjs' */
/** @typedef {import('./run-reading.mjs').WorkflowRun} WorkflowRun */

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
 * Checks the identifier of a run before the API is asked for it.
 * @param {unknown} runId - Identifier to check.
 * @throws {Error} When it is not a positive integer.
 * @example
 * assertRunId(0); // throws 'Invalid workflow run "0"'
 */
export const assertRunId = runId => {
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
