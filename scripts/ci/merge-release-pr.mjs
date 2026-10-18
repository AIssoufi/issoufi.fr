// @ts-check
// Releases the version of the day in deploy-production.yml, before the production deploy: finds
// the release pull request that release-please keeps open against develop, runs the CI on it,
// merges it once the CI passed, then publishes the release (release.yml) and runs the CI on
// develop, so that the deploy finds the new commit of develop tested. GitHub holds the CI of a
// pull request opened by GitHub Actions until a person approves it, and a merge made with the
// GITHUB_TOKEN starts no push workflow: the script starts each workflow by hand instead
// (workflow_dispatch), which GitHub runs at once. It never fails the deploy: a release that
// cannot be made leaves a notice, or a warning when something unexpected happened.
// With DRY_RUN=true, it runs the CI of the release pull request but merges nothing.
// Usage: DRY_RUN=<true|false> GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/merge-release-pr.mjs
import { CI_WORKFLOW_FILE, DEVELOP_BRANCH, RELEASE_WORKFLOW_FILE } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { fetchReleasePullRequest, mergePullRequest } from './utils/release-pull-request.mjs';
import {
  describeRunOutcome,
  dispatchWorkflow,
  shortenSha,
  waitForRun,
} from './utils/workflow-runs.mjs';

const isDryRun = process.env.DRY_RUN === 'true';

/**
 * Starts the CI on a branch and waits for it to finish.
 * @param {string} branch - Branch to run the CI on.
 * @returns {Promise<import('./utils/workflow-runs.mjs').WorkflowRun | undefined>} The run, as
 * last read.
 */
const runCi = async branch => {
  const { id, url } = await dispatchWorkflow({ workflow: CI_WORKFLOW_FILE, ref: branch });
  console.log(`Started the CI on ${branch}: ${url}`);
  return waitForRun({ runId: id });
};

/**
 * Merges the release pull request once its CI passed, then publishes the release and tests
 * develop.
 * @returns {Promise<void>}
 */
const release = async () => {
  const pullRequest = await fetchReleasePullRequest();
  if (!pullRequest) {
    writeAnnotation({
      level: 'notice',
      message:
        'No release today: no release pull request is open, so develop holds nothing to release.',
    });
    return;
  }

  const name = `the release pull request #${pullRequest.number}`;
  console.log(`Found ${name}: ${pullRequest.url}`);
  const pullRequestRun = await runCi(pullRequest.branch);
  const pullRequestOutcome = describeRunOutcome(pullRequestRun);
  // `pullRequestRun` is checked again so that the type checker knows it exists below
  if (!pullRequestOutcome.isSuccess || !pullRequestRun) {
    writeAnnotation({
      level: 'notice',
      message: `No release today: the CI of ${name} ${pullRequestOutcome.outcome}`,
    });
    return;
  }
  console.log(`The CI of ${name} ${pullRequestOutcome.outcome}`);

  if (isDryRun) {
    writeAnnotation({
      level: 'notice',
      message: `Dry run: ${name} passed its CI and would be merged. Nothing was merged.`,
    });
    return;
  }

  // Merges the commit that the CI tested: GitHub refuses when release-please moved the branch since
  const mergeSha = await mergePullRequest({ number: pullRequest.number, sha: pullRequestRun.sha });
  const mergeCommit = mergeSha ? ` with ${shortenSha(mergeSha)}` : '';
  console.log(`Merged ${name} into ${DEVELOP_BRANCH}${mergeCommit}.`);

  const releaseRun = await dispatchWorkflow({
    workflow: RELEASE_WORKFLOW_FILE,
    ref: DEVELOP_BRANCH,
  });
  console.log(`Started the release and its standalone build: ${releaseRun.url}`);

  const { isSuccess, outcome } = describeRunOutcome(await runCi(DEVELOP_BRANCH));
  writeAnnotation(
    isSuccess
      ? { level: 'notice', message: `Released ${name}, and the CI of ${DEVELOP_BRANCH} ${outcome}` }
      : {
          level: 'warning',
          message: `Merged ${name}, but nothing is deployed until the CI of ${DEVELOP_BRANCH} passes: it ${outcome}`,
        },
  );
};

try {
  await release();
} catch (error) {
  // The deploy goes on: a release pull request left open is merged by the next run
  const reason = error instanceof Error ? error.message : error;
  writeAnnotation({ level: 'warning', message: `The daily release stopped: ${reason}` });
}
