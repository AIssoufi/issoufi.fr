// @ts-check
// Tells deploy-production.yml whether this run is the deploy of the day: its crons start a run
// every 30 minutes in the morning, and a scheduled run goes on from 6:00 in Paris until one of
// them passes (see getScheduleVerdict). A run started by hand always goes on. Writes `due`
// (`true` or `false`) to the step outputs, a notice when the run stops, and a warning when GitHub
// skipped every scheduled run of a day (see getScheduleGapWarning).
// Usage: GITHUB_EVENT_NAME=<schedule|workflow_dispatch> GITHUB_RUN_ID=<id> \
//   GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> node scripts/ci/check-deploy-schedule.mjs
import { DEPLOY_RUNS_PAGE_SIZE, DEPLOY_WORKFLOW_FILE, SCHEDULE_EVENT } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { getScheduleGapWarning, getScheduleVerdict } from './utils/schedule.mjs';
import { setStepOutput } from './utils/step-output.mjs';
import { fetchWorkflowRuns } from './utils/workflow-runs.mjs';

const eventName = process.env.GITHUB_EVENT_NAME;
const runId = Number(process.env.GITHUB_RUN_ID);

/** @type {import('./utils/workflow-runs.mjs').WorkflowRun[] | undefined} */
let runs;
try {
  runs = await fetchWorkflowRuns({
    workflow: DEPLOY_WORKFLOW_FILE,
    event: SCHEDULE_EVENT,
    perPage: DEPLOY_RUNS_PAGE_SIZE,
  });
} catch (error) {
  // A scheduled run from 6:00 then goes on: deploying twice beats not deploying at all
  const reason = error instanceof Error ? error.message : error;
  writeAnnotation({
    level: 'warning',
    message: `Could not read the scheduled runs of ${DEPLOY_WORKFLOW_FILE}, so this run cannot tell whether another one already deployed today: ${reason}`,
  });
}

const { isDue, message } = getScheduleVerdict({ eventName, runId, runs });
if (isDue) console.log(message);
else writeAnnotation({ level: 'notice', message });

// Without the runs, the gap since the last scheduled run is unknown
const gapWarning = runs ? getScheduleGapWarning({ eventName, runId, runs }) : undefined;
if (gapWarning) writeAnnotation({ level: 'warning', message: gapWarning });

setStepOutput({ name: 'due', value: String(isDue) });
