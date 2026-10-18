// @ts-check
import {
  DEVELOP_BRANCH,
  OPEN_PULL_REQUESTS_PAGE_SIZE,
  RELEASE_BRANCH_PREFIX,
  RELEASE_MERGE_METHOD,
  RELEASE_PENDING_LABEL,
} from '../constants.mjs';
import { requestRepositoryApi } from './github-api.mjs';
import { isCommitSha } from './workflow-runs.mjs';

/**
 * The release pull request that release-please keeps open, as {@link findReleasePullRequest}
 * reads it.
 * @typedef {object} ReleasePullRequest
 * @property {number} number - Number of the pull request, e.g. `162`.
 * @property {string} branch - Its head branch, which release-please rewrites on each push to
 * develop.
 * @property {string} sha - Full SHA of the head commit of that branch.
 * @property {string} url - Page of the pull request on GitHub.
 */

/**
 * Tells whether a value is a positive integer, such as the number of a pull request.
 * @param {unknown} value - Value to check.
 * @returns {value is number} False for zero, a negative or decimal number and a value that is not
 * a number.
 */
const isPositiveInteger = value =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/**
 * Tells whether a pull request of the REST API carries the {@link RELEASE_PENDING_LABEL} label.
 * @param {Record<string, unknown>} pullRequest - The pull request, as the API writes it.
 * @returns {boolean} False when its labels are missing or are not a list.
 */
const hasPendingLabel = pullRequest =>
  Array.isArray(pullRequest.labels) &&
  pullRequest.labels.some(label => label?.name === RELEASE_PENDING_LABEL);

/**
 * Parameters of {@link findReleasePullRequest}.
 * @typedef {object} FindReleasePullRequestParams
 * @property {unknown} [pullRequests] - Open pull requests into develop, the parsed answer of the
 * REST API.
 * @property {string} [repository] - Repository as `owner/name`, which the head branch must
 * belong to.
 */

/**
 * Finds the release pull request among the open pull requests into develop: the one that
 * carries the {@link RELEASE_PENDING_LABEL} label of release-please, from a branch of the
 * repository itself whose name starts with {@link RELEASE_BRANCH_PREFIX}.
 * @param {FindReleasePullRequestParams} params
 * @returns {ReleasePullRequest | undefined} The first one that matches, or `undefined` when none
 * does, when the list is not an array, or when the match lacks its number, head or page.
 * @example
 * findReleasePullRequest({ pullRequests, repository: 'AIssoufi/issoufi.fr' });
 * // { number: 162, branch: 'release-please--branches--develop--components--issoufi-v3', sha, url }
 */
export const findReleasePullRequest = ({ pullRequests, repository }) => {
  if (!Array.isArray(pullRequests)) return undefined;

  for (const pullRequest of pullRequests) {
    const isObject = typeof pullRequest === 'object' && pullRequest !== null;
    if (!isObject) continue;

    const { number, head, html_url: url } = pullRequest;
    const branch = head?.ref;
    const isReleaseBranch = typeof branch === 'string' && branch.startsWith(RELEASE_BRANCH_PREFIX);
    const isFromRepository = typeof repository === 'string' && head?.repo?.full_name === repository;
    const isReleasePullRequest =
      isReleaseBranch && isFromRepository && hasPendingLabel(pullRequest);
    if (!isReleasePullRequest) continue;

    const isReadable =
      isPositiveInteger(number) && isCommitSha(head.sha) && typeof url === 'string';
    if (isReadable) return { number, branch, sha: head.sha, url };
  }
  return undefined;
};

/**
 * Parameters of {@link fetchReleasePullRequest}.
 * @typedef {object} FetchReleasePullRequestParams
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to read the pull requests with. Defaults to the
 * `GITHUB_TOKEN` variable.
 */

/**
 * Asks the REST API of GitHub for the release pull request that release-please keeps open
 * against develop.
 * @param {FetchReleasePullRequestParams} [params]
 * @returns {Promise<ReleasePullRequest | undefined>} The release pull request, or `undefined`
 * when none is open, which happens when develop holds nothing to release since the last one.
 * @throws {Error} When the repository is invalid, or when the API answers with an error status.
 * @example
 * await fetchReleasePullRequest(); // { number: 162, branch: 'release-please--…', sha, url }
 */
export const fetchReleasePullRequest = async ({
  repository = process.env.GITHUB_REPOSITORY,
  ...api
} = {}) => {
  const pullRequests = await requestRepositoryApi({
    ...api,
    repository,
    path: '/pulls',
    query: {
      state: 'open',
      base: DEVELOP_BRANCH,
      per_page: String(OPEN_PULL_REQUESTS_PAGE_SIZE),
    },
  });
  return findReleasePullRequest({ pullRequests, repository });
};

/**
 * Parameters of {@link mergePullRequest}.
 * @typedef {object} MergePullRequestParams
 * @property {number} number - Number of the pull request.
 * @property {string} sha - Full SHA that its head must still have: GitHub refuses the merge when
 * the branch moved since, so only a tested commit is merged.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to merge with, which needs the `contents: write` and
 * `pull-requests: write` permissions. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Merges a pull request with a merge commit ({@link RELEASE_MERGE_METHOD}), once its required
 * checks passed, as the ruleset of the base branch demands.
 * @param {MergePullRequestParams} params
 * @returns {Promise<string | undefined>} The full SHA of the merge commit, or `undefined` when the
 * answer does not give it.
 * @throws {Error} When the number or the SHA is invalid, or when GitHub refuses the merge: checks
 * missing or failed, head moved, or conflicts.
 * @example
 * await mergePullRequest({ number: 162, sha }); // '58ff9ea0c3f4…'
 */
export const mergePullRequest = async ({ number, sha, ...api }) => {
  const canMerge = isPositiveInteger(number) && isCommitSha(sha);
  if (!canMerge) {
    throw new Error(`Cannot merge the pull request "${number ?? ''}" at "${sha ?? ''}"`);
  }

  const response = await requestRepositoryApi({
    ...api,
    path: `/pulls/${number}/merge`,
    method: 'PUT',
    body: { sha, merge_method: RELEASE_MERGE_METHOD },
  });
  const mergeSha = /** @type {Record<string, unknown> | null | undefined} */ (response)?.sha;
  return isCommitSha(mergeSha) ? mergeSha : undefined;
};
