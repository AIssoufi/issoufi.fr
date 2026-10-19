// @ts-check
// Tells deploy-production.yml whether the commit of develop it would deploy is tested: the last
// run of ci.yml on develop for that exact commit must have succeeded, whether a push started it
// or the daily release (merge-release-pr.mjs), whose merge starts no push run. A run still going
// is waited for, up to 20 minutes (RUN_WAIT_ATTEMPTS). Writes the commit to the `sha` step output
// when it passed, and a notice saying why when it did not.
// Usage: DEPLOY_SHA=<full SHA> GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/check-develop-ci.mjs
import { DEVELOP_BRANCH } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { setStepOutput } from './utils/step-output.mjs';
import { getCiVerdict, isCommitSha, waitForLatestRunToFinish } from './utils/workflow-runs.mjs';

const sha = process.env.DEPLOY_SHA;

if (!isCommitSha(sha)) {
  writeAnnotation({
    level: 'error',
    message: `Invalid commit "${sha ?? ''}": DEPLOY_SHA must be a full commit SHA`,
  });
  process.exit(1);
}

try {
  const run = await waitForLatestRunToFinish({ branch: DEVELOP_BRANCH, event: null, sha });
  const { isTested, message } = getCiVerdict({ run, sha, branch: DEVELOP_BRANCH });

  if (isTested) {
    console.log(message);
    setStepOutput({ name: 'sha', value: sha });
  } else {
    writeAnnotation({ level: 'notice', message });
  }
} catch (error) {
  writeAnnotation({ level: 'error', message: error instanceof Error ? error.message : error });
  process.exitCode = 1;
}
