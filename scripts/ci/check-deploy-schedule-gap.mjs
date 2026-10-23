// @ts-check
// Warns, from the CI of each push to develop, when neither the Cloudflare trigger nor the crons of
// GitHub start deploy-production.yml any more: the deploy reports a day without any scheduled run
// itself, but only when it runs, so a schedule that stopped for good would go unnoticed (see
// getScheduleGapWarning), and when the Cloudflare trigger stopped while the crons go on (see
// getTriggerGapWarning). It never fails, since the deploy requires the CI of develop to pass.
// Usage: GITHUB_EVENT_NAME=push GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/check-deploy-schedule-gap.mjs
import { DEPLOY_RUNS_PAGE_SIZE, DEPLOY_WORKFLOW_FILE } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { getErrorMessage } from './utils/errors.mjs';
import {
  fetchScheduledRuns,
  getScheduleGapWarning,
  getTriggerGapWarning,
} from './utils/schedule.mjs';

try {
  const runs = await fetchScheduledRuns({ perPage: DEPLOY_RUNS_PAGE_SIZE });
  const warnings = [
    getScheduleGapWarning({ eventName: process.env.GITHUB_EVENT_NAME, runs }),
    getTriggerGapWarning({ runs }),
  ].filter(warning => warning !== undefined);
  for (const warning of warnings) writeAnnotation({ level: 'warning', message: warning });
  if (warnings.length === 0) console.log(`${DEPLOY_WORKFLOW_FILE} keeps starting on its schedule.`);
} catch (error) {
  const reason = getErrorMessage(error);
  writeAnnotation({
    level: 'warning',
    message: `Could not read the scheduled runs of ${DEPLOY_WORKFLOW_FILE}: ${reason}`,
  });
}
