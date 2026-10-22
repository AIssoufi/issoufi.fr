// @ts-check
import {
  CI_WORKFLOW_FILE,
  DEVELOP_BRANCH,
  PULL_REQUEST_EVENT,
  RELEASE_MERGE_ATTEMPTS,
  RELEASE_WORKFLOW_FILE,
} from '../constants.mjs';
import { getErrorMessage } from './github-api.mjs';
import { approveHeldRuns, nameRun } from './held-runs.mjs';
import {
  describeMergeBlock,
  describeUnpassedChecks,
  fetchPullRequestState,
  fetchUnpassedChecks,
  isMergeableState,
  waitForMergeable,
} from './mergeability.mjs';
import { fetchReleasePullRequest, mergePullRequest } from './release-pull-request.mjs';
import {
  describeRunOutcome,
  dispatchWorkflow,
  isHeldRun,
  shortenSha,
  waitForLatestRun,
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
 * @property {import('./workflow-runs.mjs').RunLookupOptions} [runLookup] - How long to look for
 * the run of its CI.
 * @property {import('./workflow-runs.mjs').RunWaitOptions} [runWait] - How long to wait for it.
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
 */
const mergeReleasePullRequest = async ({
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

/**
 * Parameters of {@link publishRelease}.
 * @typedef {object} PublishReleaseParams
 * @property {string} name - The release pull request, as messages name it.
 * @property {string} [mergeSha] - Full SHA of its merge commit, when GitHub gave it.
 * @property {import('./workflow-runs.mjs').RunWaitOptions} [runWait] - How long to wait for the CI
 * of develop.
 */

/**
 * Publishes the release once its pull request merged, and tests develop: a merge made with the
 * `GITHUB_TOKEN` starts no push workflow, so it starts `release.yml` and the CI on develop by hand,
 * and waits for the CI, so that the deploy finds the new commit of develop tested.
 * @param {PublishReleaseParams} params
 * @returns {Promise<ReleaseReport>} A notice once the CI of develop passed, or a warning that
 * nothing is deployed until it does.
 */
const publishRelease = async ({ name, mergeSha, runWait }) => {
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

/**
 * Parameters of {@link releaseVersionOfTheDay}.
 * @typedef {object} ReleaseVersionOfTheDayParams
 * @property {boolean} [isDryRun] - Whether to stop before the merge, once the release pull request
 * passed its CI and can merge. Defaults to `false`.
 * @property {import('./workflow-runs.mjs').RunLookupOptions} [runLookup] - How long to look for
 * the run of the CI of the release pull request. Defaults to the options of `waitForLatestRun`.
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
 *    request, it approves it, then the held run of each other workflow that runs on pull requests
 *    on that head, such as the lint of the title ({@link approveHeldRuns}), and gives up with a
 *    warning and the link of the run when GitHub refuses: a dry run approves them too;
 * 3. waits for that run, then for GitHub to say that the pull request can merge, and merges it at
 *    the commit that the CI tested. When release-please moved the branch meanwhile, which cancels
 *    that run or makes GitHub refuse the merge, it starts again from step 1, up to
 *    {@link RELEASE_MERGE_ATTEMPTS} times;
 * 4. starts the release and the CI on develop, since a merge made with the `GITHUB_TOKEN` starts
 *    no push workflow, and waits for the CI.
 *
 * @param {ReleaseVersionOfTheDayParams} [params]
 * @returns {Promise<ReleaseReport>} What happened: a notice when it released, or found nothing to
 * release, or a CI that did not pass, or a branch that release-please kept moving; a warning when
 * someone has to act: a held run to approve, a pull request that cannot merge or that GitHub
 * refused to merge, naming the required checks that did not pass, or a CI of develop that did not
 * pass after the merge.
 * @throws {Error} When a request that the release needs fails, such as the list of the pull
 * requests or the start of a workflow.
 * @example
 * writeAnnotation(await releaseVersionOfTheDay({ isDryRun: false }));
 */
export const releaseVersionOfTheDay = async ({
  isDryRun = false,
  runLookup,
  runWait,
  mergeableWait,
} = {}) => {
  for (let attempt = 1; attempt <= RELEASE_MERGE_ATTEMPTS; attempt += 1) {
    const pullRequest = await fetchReleasePullRequest();
    if (!pullRequest) {
      return {
        level: 'notice',
        message:
          'No release today: no release pull request is open, so develop holds nothing to release.',
      };
    }

    const name = `the release pull request #${pullRequest.number}`;
    console.log(`Found ${name} at ${shortenSha(pullRequest.sha)}: ${pullRequest.url}`);

    const result = await mergeReleasePullRequest({
      pullRequest,
      isDryRun,
      runLookup,
      runWait,
      mergeableWait,
    });
    if (result.status === 'stopped') return result.report;
    if (result.status === 'merged') {
      return publishRelease({ name, mergeSha: result.mergeSha, runWait });
    }
    console.log(`release-please moved ${name} away from ${shortenSha(pullRequest.sha)}.`);
  }

  return {
    level: 'notice',
    message: `No release today: release-please moved the release pull request ${RELEASE_MERGE_ATTEMPTS} times while its CI ran, so the next run releases it.`,
  };
};
