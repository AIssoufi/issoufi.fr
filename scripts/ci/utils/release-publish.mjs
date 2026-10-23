// @ts-check
import { CI_WORKFLOW_FILE, DEVELOP_BRANCH, RELEASE_WORKFLOW_FILE } from '../constants.mjs';
import { describeRunOutcome, dispatchWorkflow, shortenSha, waitForRun } from './workflow-runs.mjs';

/** @typedef {import('./daily-release.mjs').ReleaseReport} ReleaseReport */

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
 * @throws {Error} When `release.yml` or the CI cannot be started.
 * @example
 * writeAnnotation(await publishRelease({ name: 'the release pull request #162', mergeSha }));
 */
export const publishRelease = async ({ name, mergeSha, runWait }) => {
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
