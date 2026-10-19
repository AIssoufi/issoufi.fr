// @ts-check
// Warns, from the CI of each push to develop, when GitHub has stopped starting
// deploy-production.yml on its schedule: the deploy reports a day without any scheduled run itself,
// but only when it runs, so a schedule that stopped for good would go unnoticed (see
// getScheduleGapWarning). It never fails, since the deploy requires the CI of develop to pass.
// Usage: GITHUB_EVENT_NAME=push GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/check-deploy-schedule-gap.mjs
import { DEPLOY_WORKFLOW_FILE, LATEST_RUN_PAGE_SIZE, SCHEDULE_EVENT } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { getScheduleGapWarning } from './utils/schedule.mjs';
import { fetchWorkflowRuns } from './utils/workflow-runs.mjs';

try {
  const runs = await fetchWorkflowRuns({
    workflow: DEPLOY_WORKFLOW_FILE,
    event: SCHEDULE_EVENT,
    perPage: LATEST_RUN_PAGE_SIZE,
  });
  const warning = getScheduleGapWarning({ eventName: process.env.GITHUB_EVENT_NAME, runs });
  if (warning) writeAnnotation({ level: 'warning', message: warning });
  else console.log(`GitHub keeps starting ${DEPLOY_WORKFLOW_FILE} on its schedule.`);
} catch (error) {
  const reason = error instanceof Error ? error.message : error;
  writeAnnotation({
    level: 'warning',
    message: `Could not read the scheduled runs of ${DEPLOY_WORKFLOW_FILE}: ${reason}`,
  });
}
