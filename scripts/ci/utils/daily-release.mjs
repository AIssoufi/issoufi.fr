// @ts-check
import { RELEASE_MERGE_ATTEMPTS } from '../constants.mjs';
import { mergeReleasePullRequest } from './release-merge.mjs';
import { publishRelease } from './release-publish.mjs';
import { fetchReleasePullRequest } from './release-pull-request.mjs';
import { shortenSha } from './workflow-runs.mjs';

/**
 * What the daily release did, for the annotation that ends its log.
 * @typedef {object} ReleaseReport
 * @property {'notice' | 'warning'} level - `notice` when it released or had nothing to release,
 * `warning` when someone has to act.
 * @property {string} message - What happened, with the page to look at.
 */

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
 *    on that head, such as the lint of the title (`approveHeldRuns` of `held-runs.mjs`), and gives
 *    up with a warning and the link of the run when GitHub refuses: a dry run approves them too;
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
