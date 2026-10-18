// @ts-check
// Tells deploy-production.yml whether the commit of develop it would deploy is tested: the last
// run of ci.yml on develop for that exact commit must have succeeded, whether a push started it
// or the daily release (merge-release-pr.mjs), whose merge starts no push run. Writes the commit
// to the `sha` step output when it did, and a notice saying why when it did not.
// Usage: DEPLOY_SHA=<full SHA> GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/check-develop-ci.mjs
import { DEVELOP_BRANCH } from './constants.mjs';
import { setStepOutput } from './utils/step-output.mjs';
import { fetchLatestRun, getCiVerdict, isCommitSha } from './utils/workflow-runs.mjs';

const sha = process.env.DEPLOY_SHA;

if (!isCommitSha(sha)) {
  console.log(`::error::Invalid commit "${sha ?? ''}": DEPLOY_SHA must be a full commit SHA`);
  process.exit(1);
}

try {
  const run = await fetchLatestRun({ branch: DEVELOP_BRANCH, event: null, sha });
  const { isTested, message } = getCiVerdict({ run, sha, branch: DEVELOP_BRANCH });

  if (isTested) {
    console.log(message);
    setStepOutput({ name: 'sha', value: sha });
  } else {
    console.log(`::notice::${message}`);
  }
} catch (error) {
  console.log(`::error::${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
