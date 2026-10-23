// @ts-check
import {
  DEFAULT_GITHUB_API_URL,
  DEPLOY_START_MINUTES,
  DEPLOY_TIME_ZONE,
  DEPLOY_WORKFLOW_FILE,
  DEVELOP_BRANCH,
} from '../ci/constants.mjs';
import { formatLocalTime, getLocalTime } from '../ci/utils/schedule.mjs';
import { dispatchWorkflow } from '../ci/utils/workflow-dispatch.mjs';
import {
  DEPLOY_REPOSITORY,
  DEPLOY_WINDOW_MINUTES,
  DISPATCH_TOKEN_SECRET,
  SCHEDULED_RUN_INPUTS,
} from './constants.mjs';

/**
 * Whether the trigger starts the daily deploy, and why, from {@link getTriggerVerdict}.
 * @typedef {object} TriggerVerdict
 * @property {boolean} isDue - Whether the trigger starts a run.
 * @property {string} message - Why, for the log of the Worker.
 */

/**
 * Parameters of {@link getTriggerVerdict}.
 * @typedef {object} GetTriggerVerdictParams
 * @property {Date} [date] - Moment the cron fired. Defaults to now.
 */

/**
 * Tells whether the trigger starts the daily deploy at a moment: from 6:00 to 7:00 in
 * {@link DEPLOY_TIME_ZONE} ({@link DEPLOY_WINDOW_MINUTES}), in summer as in winter, while its crons
 * fire in UTC.
 * @param {GetTriggerVerdictParams} [params]
 * @returns {TriggerVerdict} Whether the trigger starts a run and why. It starts none for a date
 * that is not valid, an unknown offset of the time zone, and a moment outside the window.
 * @example
 * getTriggerVerdict({ date: new Date('2026-07-01T04:05:00Z') });
 * // { isDue: true, message: 'It is 06:05 in Europe/Paris: the trigger starts the daily deploy.' }
 */
export const getTriggerVerdict = ({ date = new Date() } = {}) => {
  const isValidDate = date instanceof Date && !Number.isNaN(date.getTime());
  if (!isValidDate) {
    return { isDue: false, message: 'Skipped: the moment of the cron is not a valid date.' };
  }

  const localTime = getLocalTime({ date });
  if (!localTime) {
    return {
      isDue: false,
      message: `Skipped: the offset of ${DEPLOY_TIME_ZONE} from UTC is unknown at this date.`,
    };
  }

  const time = formatLocalTime(localTime.minutes);
  const endMinutes = DEPLOY_START_MINUTES + DEPLOY_WINDOW_MINUTES;
  const isInWindow = localTime.minutes >= DEPLOY_START_MINUTES && localTime.minutes < endMinutes;
  if (!isInWindow) {
    const window = `${formatLocalTime(DEPLOY_START_MINUTES)} to ${formatLocalTime(endMinutes)}`;
    return {
      isDue: false,
      message: `Skipped: it is ${time} in ${DEPLOY_TIME_ZONE}, outside the window of the daily deploy, from ${window}.`,
    };
  }

  return {
    isDue: true,
    message: `It is ${time} in ${DEPLOY_TIME_ZONE}: the trigger starts the daily deploy.`,
  };
};

/**
 * Parameters of {@link triggerDailyDeploy}.
 * @typedef {object} TriggerDailyDeployParams
 * @property {Date} [date] - Moment the cron fired. Defaults to now.
 * @property {unknown} [token] - Token to start the run with, the {@link DISPATCH_TOKEN_SECRET}
 * secret of the Worker.
 */

/**
 * Starts the daily deploy when a cron fires in its window ({@link getTriggerVerdict}): runs
 * `deploy-production.yml` on `develop` as a scheduled run, which the schedule check of the workflow
 * stops when a scheduled run of the day already passed.
 * @param {TriggerDailyDeployParams} [params]
 * @returns {Promise<string>} What the trigger did, for the log of the Worker: the run it started,
 * or why it started none.
 * @throws {Error} When the token is missing, or when GitHub refuses to start the run, which
 * Cloudflare then logs as a failed run of the cron.
 * @example
 * await triggerDailyDeploy({ date: new Date('2026-07-01T04:05:00Z'), token });
 * // 'It is 06:05 in Europe/Paris: the trigger starts the daily deploy. https://github.com/…/123'
 */
export const triggerDailyDeploy = async ({ date, token } = {}) => {
  const { isDue, message } = getTriggerVerdict({ date });
  if (!isDue) return message;

  const hasToken = typeof token === 'string' && token !== '';
  if (!hasToken) {
    throw new Error(
      `The ${DISPATCH_TOKEN_SECRET} secret of the Worker is not set, so only the crons of GitHub start the daily deploy: store the token as docs/deployment.md says.`,
    );
  }

  // Every setting is given: their defaults read process.env, which a Worker lacks
  const run = await dispatchWorkflow({
    workflow: DEPLOY_WORKFLOW_FILE,
    ref: DEVELOP_BRANCH,
    inputs: SCHEDULED_RUN_INPUTS,
    apiUrl: DEFAULT_GITHUB_API_URL,
    repository: DEPLOY_REPOSITORY,
    token,
  });
  return `${message} ${run.url}`;
};
