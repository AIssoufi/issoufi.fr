// @ts-check
// Adds the production deploy to the job summary of deploy-production.yml: the commits of develop
// that reach main (first parents only, so one line per pull request merged into develop), and
// the CI run of main that the push started, which deploys them. For a dry run, says what would
// be deployed. Run it after the merge, and after the push when there is one.
// Usage: MAIN_SHA=<main before the merge> DEPLOY_SHA=<commit of develop> \
//   MERGE_SHA=<merge commit> DRY_RUN=<true|false> GITHUB_REPOSITORY=<owner/name> \
//   GITHUB_TOKEN=<token> node scripts/ci/write-deploy-report.mjs
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import {
  COMMIT_LOG_FORMAT,
  MAIN_BRANCH,
  MAIN_CI_RUN_LOOKUP_ATTEMPTS,
  MAIN_CI_RUN_LOOKUP_DELAY_MS,
} from './constants.mjs';
import {
  getMainCiRunsUrl,
  getRepositoryUrl,
  parseCommitLog,
  renderDeployReport,
} from './utils/deploy-report.mjs';
import { appendJobSummary } from './utils/job-summary.mjs';
import { fetchLatestRun, isCommitSha } from './utils/workflow-runs.mjs';

const { MAIN_SHA: mainSha, DEPLOY_SHA: deploySha, MERGE_SHA: mergeSha } = process.env;
const isDryRun = process.env.DRY_RUN === 'true';

const hasCommits = isCommitSha(mainSha) && isCommitSha(deploySha);
if (!hasCommits) {
  console.log('::error::MAIN_SHA and DEPLOY_SHA must be full commit SHAs');
  process.exit(1);
}

const repositoryUrl = getRepositoryUrl({
  serverUrl: process.env.GITHUB_SERVER_URL || undefined,
  repository: process.env.GITHUB_REPOSITORY,
});

const log = execFileSync(
  'git',
  ['log', '--first-parent', `--format=${COMMIT_LOG_FORMAT}`, `${mainSha}..${deploySha}`],
  { encoding: 'utf8' },
);

/**
 * Looks for the CI run that the push to main started, which GitHub creates a few seconds after
 * the push, and falls back to the list of the CI runs of main.
 * @returns {Promise<string | undefined>} The page of the run, or of the list of runs.
 */
const findMainCiRunUrl = async () => {
  if (!isCommitSha(mergeSha)) return getMainCiRunsUrl(repositoryUrl);

  for (let attempt = 1; attempt <= MAIN_CI_RUN_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      const run = await fetchLatestRun({ branch: MAIN_BRANCH, sha: mergeSha });
      if (run) return run.url;
    } catch (error) {
      // The deploy is already pushed: the report links the list of runs rather than failing
      console.log(`::warning::${error instanceof Error ? error.message : error}`);
      break;
    }
    if (attempt < MAIN_CI_RUN_LOOKUP_ATTEMPTS) await sleep(MAIN_CI_RUN_LOOKUP_DELAY_MS);
  }
  return getMainCiRunsUrl(repositoryUrl);
};

appendJobSummary({
  markdown: renderDeployReport({
    commits: parseCommitLog(log),
    deploySha,
    isDryRun,
    ciRunUrl: isDryRun ? undefined : await findMainCiRunUrl(),
    repositoryUrl,
  }),
});
