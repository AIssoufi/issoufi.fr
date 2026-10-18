// @ts-check
// Tells deploy-production.yml whether this run is the deploy of the day: the workflow runs at
// 6:00 in Paris on both its summer and its winter schedule, and only the one that matches the
// current offset of Paris from UTC goes on. A run started by hand always goes on. Writes `due`
// (`true` or `false`) to the step outputs, and a notice when the run stops.
// Usage: GITHUB_EVENT_NAME=schedule DEPLOY_SCHEDULE='0 4 * * *' \
//   node scripts/ci/check-deploy-schedule.mjs
import { getScheduleVerdict } from './utils/schedule.mjs';
import { setStepOutput } from './utils/step-output.mjs';

const { isDue, message } = getScheduleVerdict({
  eventName: process.env.GITHUB_EVENT_NAME,
  schedule: process.env.DEPLOY_SCHEDULE,
});

console.log(isDue ? message : `::notice::${message}`);
setStepOutput({ name: 'due', value: String(isDue) });
