// @ts-check
import {
  CI_WORKFLOW_FILE,
  COMMIT_SHA_PATTERN,
  DEFAULT_GITHUB_API_URL,
  DEVELOP_BRANCH,
  GITHUB_API_MEDIA_TYPE,
  GITHUB_API_VERSION,
  LATEST_RUN_PAGE_SIZE,
  PUSH_EVENT,
  REPOSITORY_PATTERN,
  RUN_COMPLETED_STATUS,
  RUN_SUCCESS_CONCLUSION,
  SHORT_SHA_LENGTH,
  TRAILING_SLASH_PATTERN,
} from '../constants.mjs';

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
 * @property {string} [event] - Event that started the runs. Defaults to {@link PUSH_EVENT}.
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
  const isRepository = typeof repository === 'string' && REPOSITORY_PATTERN.test(repository);
  const hasBranch = typeof branch === 'string' && branch !== '';
  const canBuildUrl = isRepository && hasBranch && isCommitSha(sha) && URL.canParse(apiUrl);
  if (!canBuildUrl) return undefined;

  const url = new URL(apiUrl);
  // Keeps the path of a GitHub Enterprise API, such as https://example.com/api/v3
  const apiPath = url.pathname.replace(TRAILING_SLASH_PATTERN, '');
  url.pathname = `${apiPath}/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/runs`;
  const perPage = String(LATEST_RUN_PAGE_SIZE);
  url.search = new URLSearchParams({ branch, event, head_sha: sha, per_page: perPage }).toString();
  return url.toString();
};

/**
 * A run of a workflow, as {@link readLatestRun} reads it from the REST API.
 * @typedef {object} WorkflowRun
 * @property {string} sha - Commit the run tested.
 * @property {string} status - `queued`, `in_progress`, `completed`…
 * @property {string | null} conclusion - `success`, `failure`, `cancelled`…, or `null` while the
 * run has not finished.
 * @property {string} url - Page of the run on GitHub.
 */

/**
 * Reads the latest run from the answer of the endpoint that lists the runs of a workflow, newest
 * first.
 * @param {unknown} response - Parsed JSON answer, with its `workflow_runs` list.
 * @returns {WorkflowRun | undefined} The first run of the list, or `undefined` when the list is
 * missing or empty, or when that run lacks its commit, status, conclusion or page.
 * @example
 * readLatestRun({
 *   workflow_runs: [{ head_sha, status: 'completed', conclusion: 'success', html_url }],
 * });
 * // { sha: head_sha, status: 'completed', conclusion: 'success', url: html_url }
 */
export const readLatestRun = response => {
  const runs = /** @type {Record<string, unknown> | null | undefined} */ (response)?.workflow_runs;
  const latestRun = Array.isArray(runs) ? runs[0] : undefined;
  const isObject = typeof latestRun === 'object' && latestRun !== null;
  if (!isObject) return undefined;

  const { head_sha: sha, status, conclusion, html_url: url } = latestRun;
  const hasConclusion = typeof conclusion === 'string' || conclusion === null;
  const isRun =
    isCommitSha(sha) && typeof status === 'string' && hasConclusion && typeof url === 'string';
  return isRun ? { sha, status, conclusion, url } : undefined;
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
 * @property {WorkflowRun} [run] - Latest push run of the CI for the commit, from
 * {@link readLatestRun}. Missing when the CI has not run on that commit.
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
  const commit = shortenSha(sha);
  const isRunOfCommit = isCommitSha(sha) && run?.sha === sha;
  // `run` is checked again so that the type checker knows it exists below
  if (!run || !isRunOfCommit) {
    return {
      isTested: false,
      message: `Nothing deployed: the CI has not run on ${branch} for ${commit || 'this commit'}.`,
    };
  }

  const isCompleted = run.status === RUN_COMPLETED_STATUS;
  if (!isCompleted) {
    return {
      isTested: false,
      message: `Nothing deployed: the CI of ${branch} is still running on ${commit} (${run.status}): ${run.url}`,
    };
  }

  const isSuccess = run.conclusion === RUN_SUCCESS_CONCLUSION;
  if (!isSuccess) {
    return {
      isTested: false,
      message: `Nothing deployed: the CI of ${branch} did not pass on ${commit} (${run.conclusion ?? 'no conclusion'}): ${run.url}`,
    };
  }

  return { isTested: true, message: `The CI of ${branch} passed on ${commit}: ${run.url}` };
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

  /** @type {Record<string, string>} */
  const headers = {
    Accept: GITHUB_API_MEDIA_TYPE,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`The GitHub API answered ${response.status} to ${url}`);
  }
  return readLatestRun(await response.json());
};
