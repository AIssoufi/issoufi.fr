// @ts-check
import { DEVELOP_BRANCH, PULL_REQUEST_EVENT } from '../constants.mjs';
import { shortenSha } from './commit-sha.mjs';
import { getErrorMessage } from './errors.mjs';
import { approveHeldRuns, nameRun } from './held-runs.mjs';
import {
  describeMergeBlock,
  describeUnpassedChecks,
  fetchPullRequestState,
  fetchUnpassedChecks,
  isMergeableState,
  waitForMergeable,
} from './mergeability.mjs';
import { mergePullRequest } from './release-pull-request.mjs';
import { describeRunOutcome } from './run-outcome.mjs';
import { isHeldRun } from './run-reading.mjs';
import { waitForLatestRun, waitForRun } from './run-waiting.mjs';

/** @typedef {import('./daily-release.mjs').ReleaseReport} ReleaseReport */

/**
 * Names the required checks of develop that a commit has not passed, to say why GitHub does not
 * merge the release pull request. A failed read only leaves the names out of the message.
 * @param {string} sha - Full SHA of the head commit of the release pull request.
 * @returns {Promise<string[]>} The checks, from `fetchUnpassedChecks`, or an empty list when they
 * could not be read.
 */
const readUnpassedChecks = async sha => {
  try {
    return await fetchUnpassedChecks({ branch: DEVELOP_BRANCH, sha });
  } catch (error) {
    console.log(
      `Could not read the required checks of ${shortenSha(sha)}: ${getErrorMessage(error)}`,
    );
    return [];
  }
};

/**
 * Parameters of {@link hasHeadMoved}.
 * @typedef {object} HasHeadMovedParams
 * @property {number} number - Number of the release pull request.
 * @property {string} sha - Full SHA of the head that the attempt tested.
 */

/**
 * Tells whether release-please moved the branch of the release pull request away from a head,
 * which cancels the CI of that head and makes GitHub refuse its merge.
 * @param {HasHeadMovedParams} params
 * @returns {Promise<boolean>} False when the head is still `sha`, or when the pull request cannot
 * be read, which leaves the reason that the caller had to stop.
 */
const hasHeadMoved = async ({ number, sha }) => {
  try {
    const state = await fetchPullRequestState({ number });
    return state !== undefined && state.sha !== sha;
  } catch {
    return false;
  }
};

/**
 * How an attempt of {@link mergeReleasePullRequest} ended: `merged`, with the merge commit when
 * GitHub gave it; `moved` when release-please moved the branch meanwhile, so another attempt can
 * start from the new head; `stopped` with the report that ends the release.
 * @typedef {{ status: 'merged', mergeSha?: string }
 *   | { status: 'moved' }
 *   | { status: 'stopped', report: ReleaseReport }} MergeAttempt
 */

/**
 * Parameters of {@link mergeReleasePullRequest}.
 * @typedef {object} MergeReleasePullRequestParams
 * @property {import('./release-pull-request.mjs').ReleasePullRequest} pullRequest - The release
 * pull request, as just read.
 * @property {boolean} isDryRun - Whether to stop before the merge.
 * @property {import('./run-waiting.mjs').RunLookupOptions} [runLookup] - How long to look for
 * the run of its CI.
 * @property {import('./run-waiting.mjs').RunWaitOptions} [runWait] - How long to wait for it.
 * @property {import('./mergeability.mjs').MergeableWaitOptions} [mergeableWait] - How long to
 * wait for GitHub to say that it can merge.
 */

/**
 * Tries once to merge the release pull request at its current head: finds the run of the CI that
 * its pull request event started, approves it when GitHub holds it, with the held runs of the
 * other workflows that run on pull requests ({@link approveHeldRuns}), waits for it, then for
 * GitHub to say that the pull request can merge, which waits for the required checks of the
 * other runs, and merges it at the tested commit. Whenever it has to stop, it reads the head
 * again, so that a branch moved by release-please leads to another attempt rather than to a
 * report.
 * @param {MergeReleasePullRequestParams} params
 * @returns {Promise<MergeAttempt>} How the attempt ended.
 * @throws {Error} When a request that the attempt needs fails, such as the lookup of the run of the
 * CI, the list of the held runs or the reads of the run and of the pull request; a refused merge is
 * reported instead.
 * @example
 * const result = await mergeReleasePullRequest({ pullRequest, isDryRun: false });
 * if (result.status === 'stopped') writeAnnotation(result.report);
 */
export const mergeReleasePullRequest = async ({
  pullRequest,
  isDryRun,
  runLookup,
  runWait,
  mergeableWait,
}) => {
  const { number, branch, sha, url } = pullRequest;
  const name = `the release pull request #${number}`;
  /** @param {ReleaseReport} report */
  const stop = report => /** @type {MergeAttempt} */ ({ status: 'stopped', report });

  const pullRequestRun = await waitForLatestRun({
    branch,
    event: PULL_REQUEST_EVENT,
    sha,
    ...runLookup,
  });
  if (!pullRequestRun) {
    return stop({
      level: 'notice',
      message: `No release today: the CI has not run on ${name} for ${shortenSha(sha)} yet: ${url}`,
    });
  }

  // GitHub holds the runs of the other workflows along with that of the CI, so they are looked up
  // only then: a pull request that the release App opened holds none, and costs no other request
  if (isHeldRun(pullRequestRun)) {
    const refusal = await approveHeldRuns({ name, branch, ciRun: pullRequestRun });
    if (refusal !== undefined) {
      return stop({
        level: 'warning',
        message: `No release today: GitHub holds ${nameRun(refusal.workflow)} of ${name} until someone approves it, and refused to let this job do it (${refusal.reason}). Approve the run, then start deploy-production.yml by hand to release it: ${refusal.run.url}`,
      });
    }
  }

  const run = await waitForRun({ runId: pullRequestRun.id, ...runWait });
  const runOutcome = describeRunOutcome(run);
  // `run` is checked again so that the type checker knows it exists below
  if (!runOutcome.isSuccess || !run) {
    // A newer push of release-please cancels the CI of the old head
    if (await hasHeadMoved({ number, sha })) return { status: 'moved' };
    // A run still held after its approval waits for a person
    return stop({
      level: isHeldRun(run) ? 'warning' : 'notice',
      message: `No release today: the CI of ${name} ${runOutcome.outcome}`,
    });
  }
  console.log(`The CI of ${name} ${runOutcome.outcome}`);

  const state = await waitForMergeable({ number, sha: run.sha, ...mergeableWait });
  const isHeadOfRun = state === undefined || state.sha === run.sha;
  if (!isHeadOfRun) return { status: 'moved' };
  if (!isMergeableState(state?.mergeableState)) {
    const block = describeMergeBlock({
      mergeableState: state?.mergeableState,
      unpassedChecks: await readUnpassedChecks(run.sha),
    });
    return stop({
      level: 'warning',
      message: `No release today: ${name} ${block}, though its CI passed: ${url}`,
    });
  }

  if (isDryRun) {
    return stop({
      level: 'notice',
      message: `Dry run: ${name} passed its CI and can be merged. Nothing was merged.`,
    });
  }

  try {
    // Merges the commit that the CI tested: GitHub refuses when release-please moved the branch
    return { status: 'merged', mergeSha: await mergePullRequest({ number, sha: run.sha }) };
  } catch (error) {
    if (await hasHeadMoved({ number, sha: run.sha })) return { status: 'moved' };

    const checks = describeUnpassedChecks(await readUnpassedChecks(run.sha));
    const checksClause = checks === '' ? '' : `, where ${checks}`;
    return stop({
      level: 'warning',
      message: `No release today: GitHub refused to merge ${name}${checksClause} (${url}): ${getErrorMessage(error)}`,
    });
  }
};
