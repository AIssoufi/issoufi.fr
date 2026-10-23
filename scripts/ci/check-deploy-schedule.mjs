// @ts-check
// Tells deploy-production.yml whether this run is the deploy of the day: the Cloudflare trigger
// starts a scheduled run twice in the morning, and its crons one every 30 minutes, and a scheduled
// run goes on from 6:00 in Paris until one of them passes (see getScheduleVerdict). A run started
// by hand always goes on, unless its `scheduled` input makes it a scheduled run. Writes `due`
// (`true` or `false`) to the step outputs, a notice when the run stops, and a warning when no
// scheduled run started on a day (see getScheduleGapWarning) or when the Cloudflare trigger
// stopped while the crons go on (see getTriggerGapWarning).
// Usage: GITHUB_EVENT_NAME=<schedule|workflow_dispatch> SCHEDULED=<true|false> \
//   GITHUB_RUN_ID=<id> GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/check-deploy-schedule.mjs
import { DEPLOY_RUNS_PAGE_SIZE, DEPLOY_WORKFLOW_FILE } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { getErrorMessage } from './utils/errors.mjs';
import {
  fetchScheduledRuns,
  getScheduleGapWarning,
  getScheduleVerdict,
  getTriggerGapWarning,
} from './utils/schedule.mjs';
import { setStepOutput } from './utils/step-output.mjs';

const eventName = process.env.GITHUB_EVENT_NAME;
const hasScheduledInput = process.env.SCHEDULED === 'true';
const runId = Number(process.env.GITHUB_RUN_ID);

/** @type {import('./utils/workflow-runs.mjs').WorkflowRun[] | undefined} */
let runs;
try {
  runs = await fetchScheduledRuns({ perPage: DEPLOY_RUNS_PAGE_SIZE });
} catch (error) {
  // A scheduled run from 6:00 then goes on: deploying twice beats not deploying at all
  const reason = getErrorMessage(error);
  writeAnnotation({
    level: 'warning',
    message: `Could not read the scheduled runs of ${DEPLOY_WORKFLOW_FILE}, so this run cannot tell whether another one already deployed today: ${reason}`,
  });
}

const { isDue, message } = getScheduleVerdict({ eventName, hasScheduledInput, runId, runs });
if (isDue) console.log(message);
else writeAnnotation({ level: 'notice', message });

// Without the runs, the gap since the last scheduled run is unknown
const gapWarning = runs
  ? getScheduleGapWarning({ eventName, hasScheduledInput, runId, runs })
  : undefined;
if (gapWarning) writeAnnotation({ level: 'warning', message: gapWarning });

const triggerGapWarning = runs ? getTriggerGapWarning({ runId, runs }) : undefined;
if (triggerGapWarning) writeAnnotation({ level: 'warning', message: triggerGapWarning });

setStepOutput({ name: 'due', value: String(isDue) });
