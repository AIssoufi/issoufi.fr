// @ts-check
import {
  CHECK_RUNS_PAGE_SIZE,
  MERGEABLE_STATES,
  MERGEABLE_WAIT_ATTEMPTS,
  MERGEABLE_WAIT_DELAY_MS,
  PASSING_CHECK_CONCLUSIONS,
  REQUIRED_STATUS_CHECKS_RULE,
  RUN_COMPLETED_STATUS,
  UNMERGEABLE_STATE_REASONS,
} from '../constants.mjs';
import { isCommitSha } from './commit-sha.mjs';
import { requestRepositoryApi } from './github-api.mjs';
import { isPositiveInteger } from './numbers.mjs';

/**
 * Whether a pull request can merge, as {@link readPullRequestState} reads it.
 * @typedef {object} PullRequestState
 * @property {string} sha - Full SHA of its head commit.
 * @property {string} mergeableState - Its `mergeable_state`: `clean`, `blocked`, `unknown`…
 */

/**
 * Reads the head commit and the `mergeable_state` of a pull request from an answer of the REST
 * API.
 * @param {unknown} value - The pull request, as the API writes it.
 * @returns {PullRequestState | undefined} Its state, or `undefined` when the value is not an
 * object, or lacks its head commit or its `mergeable_state`.
 * @example
 * readPullRequestState({ head: { sha }, mergeable_state: 'clean' });
 * // { sha, mergeableState: 'clean' }
 */
export const readPullRequestState = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return undefined;

  const { head, mergeable_state: mergeableState } =
    /** @type {{ head?: { sha?: unknown } | null, mergeable_state?: unknown }} */ (value);
  const sha = head?.sha;
  const isState = isCommitSha(sha) && typeof mergeableState === 'string' && mergeableState !== '';
  return isState ? { sha, mergeableState } : undefined;
};

/**
 * Tells whether a `mergeable_state` lets the pull request merge ({@link MERGEABLE_STATES}).
 * @param {unknown} mergeableState - The `mergeable_state` of the pull request.
 * @returns {boolean} False for any other value, `undefined` included.
 * @example
 * isMergeableState('clean'); // true
 * isMergeableState('blocked'); // false
 */
export const isMergeableState = mergeableState =>
  typeof mergeableState === 'string' && MERGEABLE_STATES.includes(mergeableState);

/**
 * Parameters of {@link fetchPullRequestState}.
 * @typedef {object} FetchPullRequestStateParams
 * @property {number} number - Number of the pull request.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to read the pull request with. Defaults to the
 * `GITHUB_TOKEN` variable.
 */

/**
 * Asks the REST API of GitHub whether a pull request can merge. The first read after a change can
 * say `unknown` while GitHub works it out.
 * @param {FetchPullRequestStateParams} params
 * @returns {Promise<PullRequestState | undefined>} Its state, or `undefined` when
 * {@link readPullRequestState} cannot read the answer.
 * @throws {Error} When the number is not a positive integer, or when the API answers with an
 * error status.
 * @example
 * await fetchPullRequestState({ number: 162 }); // { sha, mergeableState: 'blocked' }
 */
export const fetchPullRequestState = async ({ number, ...api }) => {
  if (!isPositiveInteger(number)) throw new Error(`Invalid pull request "${number ?? ''}"`);

  return readPullRequestState(await requestRepositoryApi({ ...api, path: `/pulls/${number}` }));
};

/**
 * How long {@link waitForMergeable} waits.
 * @typedef {object} MergeableWaitOptions
 * @property {number} [attempts] - Number of times the pull request is read. Defaults to
 * {@link MERGEABLE_WAIT_ATTEMPTS}.
 * @property {number} [delayMs] - Pause between two reads, in milliseconds. Defaults to
 * {@link MERGEABLE_WAIT_DELAY_MS}.
 */

/**
 * Parameters of {@link waitForMergeable}: those of {@link fetchPullRequestState}, how long to
 * wait, and the `sha` of the commit that the CI tested, which the head must keep: the wait stops
 * when the head moves away from it.
 * @typedef {FetchPullRequestStateParams & MergeableWaitOptions & { sha: string }}
 * WaitForMergeableParams
 */

/**
 * Waits until GitHub says that a pull request can merge, reading it at regular intervals: after a
 * run of the CI ends, GitHub takes a few seconds to count its checks. A read that fails is tried
 * again at the next attempt.
 * @param {WaitForMergeableParams} params
 * @returns {Promise<PullRequestState | undefined>} The state once mergeable, or once the head
 * moved from `sha`, or as last read when neither happened, or `undefined` when no answer could be
 * read, or when `attempts` is not above 0.
 * @throws {Error} At once when the number is not a positive integer, and when every read failed,
 * with the error of the last one.
 * @example
 * const state = await waitForMergeable({ number: 162, sha });
 * isMergeableState(state?.mergeableState); // true once GitHub counted the checks
 */
export const waitForMergeable = async ({
  sha,
  attempts = MERGEABLE_WAIT_ATTEMPTS,
  delayMs = MERGEABLE_WAIT_DELAY_MS,
  ...params
}) => {
  if (!isPositiveInteger(params.number)) {
    throw new Error(`Invalid pull request "${params.number ?? ''}"`);
  }

  /** @type {PullRequestState | undefined} */
  let state;
  let hasRead = false;
  /** @type {unknown} */
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      state = await fetchPullRequestState(params);
      hasRead = true;
    } catch (error) {
      lastError = error;
    }
    const hasHeadMoved = state !== undefined && state.sha !== sha;
    if (isMergeableState(state?.mergeableState) || hasHeadMoved) return state;
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  const hasOnlyFailed = !hasRead && lastError !== undefined;
  if (hasOnlyFailed) throw lastError;
  return state;
};

/**
 * Reads the names of the status checks that the rules of a branch require, from the answer of the
 * REST API endpoint that lists the rules applying to it.
 * @param {unknown} rules - Parsed JSON answer, a list of rules with their `type` and
 * `parameters`.
 * @returns {string[]} The names, e.g. `['format', 'lint']`, in their order and without
 * duplicates, or an empty list when no rule requires a check or the answer is not a list.
 * @example
 * readRequiredChecks([
 *   {
 *     type: 'required_status_checks',
 *     parameters: { required_status_checks: [{ context: 'lint' }] },
 *   },
 * ]); // ['lint']
 */
export const readRequiredChecks = rules => {
  if (!Array.isArray(rules)) return [];

  const names = rules
    .filter(rule => rule?.type === REQUIRED_STATUS_CHECKS_RULE)
    .flatMap(rule => {
      const checks = rule.parameters?.required_status_checks;
      return Array.isArray(checks) ? checks.map(check => check?.context) : [];
    })
    .filter(name => typeof name === 'string' && name !== '');
  return [...new Set(names)];
};

/**
 * A check run of a commit, as {@link readCheckRuns} reads it.
 * @typedef {object} CheckRun
 * @property {string} name - Name of the check, which a required status check matches, e.g.
 * `lint`.
 * @property {string} status - `queued`, `in_progress`, `completed`…
 * @property {string | null} conclusion - `success`, `failure`, `skipped`…, or `null` while it has
 * not finished, or when the API gives no text for it.
 */

/**
 * Tells whether a conclusion of a check run is a text that names it.
 * @param {unknown} conclusion - The conclusion, as the API writes it.
 * @returns {conclusion is string} False for `null`, an empty text or any other value.
 */
const isConclusion = conclusion => typeof conclusion === 'string' && conclusion !== '';

/**
 * Reads the check runs of a commit from the answer of the REST API endpoint that lists them.
 * @param {unknown} response - Parsed JSON answer, with its `check_runs` list.
 * @returns {CheckRun[]} The check runs that have a name and a status, or an empty list when the
 * list is missing. A conclusion that is missing, empty or not a text reads as `null`.
 * @example
 * readCheckRuns({ check_runs: [{ name: 'lint', status: 'completed', conclusion: 'success' }] });
 * // [{ name: 'lint', status: 'completed', conclusion: 'success' }]
 */
export const readCheckRuns = response => {
  const checkRuns = /** @type {Record<string, unknown> | null | undefined} */ (response)
    ?.check_runs;
  if (!Array.isArray(checkRuns)) return [];

  return checkRuns.flatMap(checkRun => {
    const { name, status, conclusion } = checkRun ?? {};
    const isCheckRun = typeof name === 'string' && typeof status === 'string';
    if (!isCheckRun) return [];

    return [{ name, status, conclusion: isConclusion(conclusion) ? conclusion : null }];
  });
};

/**
 * Tells whether a check run satisfies a required status check: completed with one of the
 * {@link PASSING_CHECK_CONCLUSIONS}.
 * @param {CheckRun} checkRun - The check run.
 * @returns {boolean} False while it has not finished.
 */
const isPassingCheckRun = checkRun =>
  checkRun.status === RUN_COMPLETED_STATUS &&
  PASSING_CHECK_CONCLUSIONS.includes(checkRun.conclusion ?? '');

/**
 * Parameters of {@link findUnpassedChecks}.
 * @typedef {object} FindUnpassedChecksParams
 * @property {string[]} [requiredChecks] - Names of the required status checks, from
 * {@link readRequiredChecks}.
 * @property {CheckRun[]} [checkRuns] - Check runs of the head commit, from {@link readCheckRuns}.
 */

/**
 * Names the required status checks that a commit has not passed, and why.
 * @param {FindUnpassedChecksParams} params
 * @returns {string[]} Each one with what GitHub sees of it: `format (missing)` without a check run
 * of that name, `build (in_progress)` while it runs, `test (failure)` when it did not pass. Empty
 * when every required check passed, or when none is required.
 * @example
 * findUnpassedChecks({ requiredChecks: ['format', 'lint'], checkRuns: [passingLint] });
 * // ['format (missing)']
 */
export const findUnpassedChecks = ({ requiredChecks = [], checkRuns = [] }) =>
  requiredChecks.flatMap(name => {
    const runsOfCheck = checkRuns.filter(checkRun => checkRun.name === name);
    if (runsOfCheck.some(isPassingCheckRun)) return [];

    const [latest] = runsOfCheck;
    if (!latest) return [`${name} (missing)`];
    if (latest.status !== RUN_COMPLETED_STATUS) return [`${name} (${latest.status})`];

    return [`${name} (${latest.conclusion ?? 'no conclusion'})`];
  });

/**
 * Parameters of {@link fetchUnpassedChecks}.
 * @typedef {object} FetchUnpassedChecksParams
 * @property {string} branch - Base branch of the pull request, whose rules name the required
 * checks, e.g. `develop`.
 * @property {string} sha - Full SHA of the head commit of the pull request.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to read the rules and the check runs with, which needs the
 * `checks: read` permission. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Asks the REST API of GitHub which status checks the rules of a branch require, and which of them
 * a commit has not passed, to say why a pull request cannot merge.
 * @param {FetchUnpassedChecksParams} params
 * @returns {Promise<string[]>} The required checks that did not pass, as
 * {@link findUnpassedChecks} writes them.
 * @throws {Error} When the branch or the SHA is invalid, or when the API answers with an error
 * status.
 * @example
 * await fetchUnpassedChecks({ branch: 'develop', sha }); // ['format (missing)', …]
 */
export const fetchUnpassedChecks = async ({ branch, sha, ...api }) => {
  const hasBranch = typeof branch === 'string' && branch !== '';
  if (!hasBranch || !isCommitSha(sha)) {
    throw new Error(`Cannot read the checks of "${sha ?? ''}" against "${branch ?? ''}"`);
  }

  const [rules, checkRuns] = await Promise.all([
    requestRepositoryApi({ ...api, path: `/rules/branches/${encodeURIComponent(branch)}` }),
    requestRepositoryApi({
      ...api,
      path: `/commits/${sha}/check-runs`,
      query: { per_page: String(CHECK_RUNS_PAGE_SIZE) },
    }),
  ]);
  return findUnpassedChecks({
    requiredChecks: readRequiredChecks(rules),
    checkRuns: readCheckRuns(checkRuns),
  });
};

/**
 * Names the required checks that did not pass, for a message.
 * @param {string[]} [unpassedChecks] - The checks, from {@link findUnpassedChecks}.
 * @returns {string} `the required checks <names> did not pass`, or an empty text without any.
 * @example
 * describeUnpassedChecks(['format (missing)']);
 * // 'the required checks format (missing) did not pass'
 */
export const describeUnpassedChecks = (unpassedChecks = []) =>
  unpassedChecks.length === 0
    ? ''
    : `the required checks ${unpassedChecks.join(', ')} did not pass`;

/**
 * Parameters of {@link describeMergeBlock}.
 * @typedef {object} DescribeMergeBlockParams
 * @property {string} [mergeableState] - The `mergeable_state` of the pull request, from
 * {@link readPullRequestState}. Missing when it could not be read.
 * @property {string[]} [unpassedChecks] - The required checks that its head has not passed, from
 * {@link findUnpassedChecks}. Missing when they could not be read.
 */

/**
 * Says why a pull request cannot merge, for a message that names it first.
 * @param {DescribeMergeBlockParams} params
 * @returns {string} The end of a sentence, such as `is blocked by a rule of the base branch
 * (blocked): the required checks format (missing), lint (missing) did not pass`, from
 * {@link UNMERGEABLE_STATE_REASONS}.
 * @example
 * `#162 ${describeMergeBlock({ mergeableState: 'dirty', unpassedChecks: [] })}`;
 * // '#162 conflicts with its base branch (dirty)'
 */
export const describeMergeBlock = ({ mergeableState, unpassedChecks }) => {
  const reason = mergeableState
    ? `${UNMERGEABLE_STATE_REASONS[mergeableState] ?? 'cannot merge'} (${mergeableState})`
    : 'could not be read';
  const checks = describeUnpassedChecks(unpassedChecks);
  return checks === '' ? reason : `${reason}: ${checks}`;
};
