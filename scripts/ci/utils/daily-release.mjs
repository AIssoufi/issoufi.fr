// @ts-check
import {
  CI_WORKFLOW_FILE,
  DEVELOP_BRANCH,
  PULL_REQUEST_EVENT,
  RELEASE_WORKFLOW_FILE,
} from '../constants.mjs';
import {
  describeMergeBlock,
  describeUnpassedChecks,
  fetchUnpassedChecks,
  isMergeableState,
  waitForMergeable,
} from './mergeability.mjs';
import { fetchReleasePullRequest, mergePullRequest } from './release-pull-request.mjs';
import {
  approveRun,
  describeRunOutcome,
  dispatchWorkflow,
  fetchLatestRun,
  isHeldRun,
  shortenSha,
  waitForRun,
} from './workflow-runs.mjs';

/**
 * What the daily release did, for the annotation that ends its log.
 * @typedef {object} ReleaseReport
 * @property {'notice' | 'warning'} level - `notice` when it released or had nothing to release,
 * `warning` when someone has to act.
 * @property {string} message - What happened, with the page to look at.
 */

/**
 * Reads the message of an error that a request threw.
 * @param {unknown} error - The error.
 * @returns {string} Its message, or its text when it is not an `Error`.
 */
const getErrorMessage = error => (error instanceof Error ? error.message : String(error));

/**
 * Parameters of {@link runCi}.
 * @typedef {object} RunCiParams
 * @property {string} branch - Branch to run the CI on.
 * @property {import('./workflow-runs.mjs').RunWaitOptions} [runWait] - How long to wait for it.
 */

/**
 * Starts the CI on a branch and waits for it to finish.
 * @param {RunCiParams} params
 * @returns {Promise<import('./workflow-runs.mjs').WorkflowRun | undefined>} The run, as last read.
 */
const runCi = async ({ branch, runWait }) => {
  const { id, url } = await dispatchWorkflow({ workflow: CI_WORKFLOW_FILE, ref: branch });
  console.log(`Started the CI on ${branch}: ${url}`);
  return waitForRun({ runId: id, ...runWait });
};

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
 * Approves a run of the CI that GitHub holds, as it does for the pull request runs of a pull
 * request that GitHub Actions opened.
 * @param {number} runId - Identifier of the held run.
 * @returns {Promise<string | undefined>} `undefined` once approved, or why GitHub refused.
 */
const approveHeldRun = async runId => {
  try {
    await approveRun({ runId });
    return undefined;
  } catch (error) {
    return getErrorMessage(error);
  }
};

/**
 * Parameters of {@link releaseVersionOfTheDay}.
 * @typedef {object} ReleaseVersionOfTheDayParams
 * @property {boolean} [isDryRun] - Whether to stop before the merge, once the release pull request
 * passed its CI and can merge. Defaults to `false`.
 * @property {import('./workflow-runs.mjs').RunWaitOptions} [runWait] - How long to wait for each
 * run of the CI. Defaults to the options of `waitForRun`.
 * @property {import('./mergeability.mjs').MergeableWaitOptions} [mergeableWait] - How long to
 * wait for GitHub to say that the release pull request can merge. Defaults to the options of
 * `waitForMergeable`.
 */

/**
 * Releases the version of the day, before the production deploy of `deploy-production.yml`:
 *
 * 1. finds the release pull request that release-please keeps open against develop;
 * 2. finds the run of the CI that its pull request event started on its head commit, the only one
 *    whose checks GitHub links to the pull request, so the only one that the required checks of
 *    develop count. When GitHub holds that run, as it does when GitHub Actions opened the pull
 *    request, it approves it, and gives up with a warning and the link of the run when GitHub
 *    refuses: a dry run approves it too;
 * 3. waits for that run, then for GitHub to say that the pull request can merge;
 * 4. merges it at the commit that the CI tested, then starts the release and the CI on develop,
 *    since a merge made with the `GITHUB_TOKEN` starts no push workflow, and waits for the CI.
 *
 * @param {ReleaseVersionOfTheDayParams} [params]
 * @returns {Promise<ReleaseReport>} What happened: a notice when it released, or found nothing to
 * release, or a CI that did not pass; a warning when someone has to act: a held run to approve, a
 * pull request that cannot merge or that GitHub refused to merge, naming the required checks that
 * did not pass, or a CI of develop that did not pass after the merge.
 * @throws {Error} When a request that the release needs fails, such as the list of the pull
 * requests or the start of a workflow.
 * @example
 * writeAnnotation(await releaseVersionOfTheDay({ isDryRun: false }));
 */
export const releaseVersionOfTheDay = async ({ isDryRun = false, runWait, mergeableWait } = {}) => {
  const pullRequest = await fetchReleasePullRequest();
  if (!pullRequest) {
    return {
      level: 'notice',
      message:
        'No release today: no release pull request is open, so develop holds nothing to release.',
    };
  }

  const name = `the release pull request #${pullRequest.number}`;
  console.log(`Found ${name}: ${pullRequest.url}`);

  const pullRequestRun = await fetchLatestRun({
    branch: pullRequest.branch,
    event: PULL_REQUEST_EVENT,
    sha: pullRequest.sha,
  });
  if (!pullRequestRun) {
    return {
      level: 'notice',
      message: `No release today: the CI has not run on ${name} for ${shortenSha(pullRequest.sha)} yet: ${pullRequest.url}`,
    };
  }

  if (isHeldRun(pullRequestRun)) {
    const refusal = await approveHeldRun(pullRequestRun.id);
    if (refusal !== undefined) {
      return {
        level: 'warning',
        message: `No release today: GitHub holds the CI of ${name} until someone approves it, and refused to let this job do it (${refusal}). Approve the run, then start deploy-production.yml by hand to release it: ${pullRequestRun.url}`,
      };
    }
    console.log(`Approved the CI of ${name}, which GitHub held: ${pullRequestRun.url}`);
  }

  const run = await waitForRun({ runId: pullRequestRun.id, ...runWait });
  const pullRequestOutcome = describeRunOutcome(run);
  // `run` is checked again so that the type checker knows it exists below
  if (!pullRequestOutcome.isSuccess || !run) {
    // A run still held after its approval waits for a person
    return {
      level: isHeldRun(run) ? 'warning' : 'notice',
      message: `No release today: the CI of ${name} ${pullRequestOutcome.outcome}`,
    };
  }
  console.log(`The CI of ${name} ${pullRequestOutcome.outcome}`);

  const state = await waitForMergeable({
    number: pullRequest.number,
    sha: run.sha,
    ...mergeableWait,
  });
  const hasHeadMoved = state !== undefined && state.sha !== run.sha;
  if (hasHeadMoved) {
    return {
      level: 'notice',
      message: `No release today: release-please moved ${name} to ${shortenSha(state.sha)} after its CI ran on ${shortenSha(run.sha)}, and the next run releases it: ${pullRequest.url}`,
    };
  }
  if (!isMergeableState(state?.mergeableState)) {
    const block = describeMergeBlock({
      mergeableState: state?.mergeableState,
      unpassedChecks: await readUnpassedChecks(run.sha),
    });
    return {
      level: 'warning',
      message: `No release today: ${name} ${block}, though its CI passed: ${pullRequest.url}`,
    };
  }

  if (isDryRun) {
    return {
      level: 'notice',
      message: `Dry run: ${name} passed its CI and can be merged. Nothing was merged.`,
    };
  }

  /** @type {string | undefined} */
  let mergeSha;
  try {
    // Merges the commit that the CI tested: GitHub refuses when release-please moved the branch
    mergeSha = await mergePullRequest({ number: pullRequest.number, sha: run.sha });
  } catch (error) {
    const checks = describeUnpassedChecks(await readUnpassedChecks(run.sha));
    const checksClause = checks === '' ? '' : `, where ${checks}`;
    return {
      level: 'warning',
      message: `No release today: GitHub refused to merge ${name}${checksClause} (${pullRequest.url}): ${getErrorMessage(error)}`,
    };
  }
  const mergeCommit = mergeSha ? ` with ${shortenSha(mergeSha)}` : '';
  console.log(`Merged ${name} into ${DEVELOP_BRANCH}${mergeCommit}.`);

  const releaseRun = await dispatchWorkflow({
    workflow: RELEASE_WORKFLOW_FILE,
    ref: DEVELOP_BRANCH,
  });
  console.log(`Started the release and its standalone build: ${releaseRun.url}`);

  const { isSuccess, outcome } = describeRunOutcome(
    await runCi({ branch: DEVELOP_BRANCH, runWait }),
  );
  return isSuccess
    ? { level: 'notice', message: `Released ${name}, and the CI of ${DEVELOP_BRANCH} ${outcome}` }
    : {
        level: 'warning',
        message: `Merged ${name}, but nothing is deployed until the CI of ${DEVELOP_BRANCH} passes: it ${outcome}`,
      };
};
