// @ts-check
import {
  DEPLOY_START_MINUTES,
  DEPLOY_TIME_ZONE,
  DEPLOY_WORKFLOW_FILE,
  ISO_DATE_LENGTH,
  MANUAL_EVENT,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
  RUN_SUCCESS_CONCLUSION,
  SCHEDULE_EVENT,
  SCHEDULE_GAP_WARNING_HOURS,
  SCHEDULED_RUN_TITLE,
  UTC_OFFSET_NAME_PATTERN,
} from '../constants.mjs';
import { fetchWorkflowRuns } from './run-requests.mjs';

/** @typedef {import('./run-reading.mjs').WorkflowRun} WorkflowRun */

/**
 * Parameters of {@link getUtcOffsetMinutes}.
 * @typedef {object} GetUtcOffsetMinutesParams
 * @property {Date} [date] - Moment to read the offset at. Defaults to now.
 * @property {string} [timeZone] - IANA time zone, e.g. `Europe/Paris`. Defaults to
 * {@link DEPLOY_TIME_ZONE}.
 */

/**
 * Reads the offset of a time zone from UTC at a given moment, daylight saving time included.
 * @param {GetUtcOffsetMinutesParams} [params]
 * @returns {number | undefined} The offset in minutes, e.g. `120` for UTC+02:00 and `-210` for
 * UTC-03:30, or `undefined` when the date is invalid, the time zone unknown, or the offset not a
 * whole number of minutes (see {@link UTC_OFFSET_NAME_PATTERN}).
 * @example
 * getUtcOffsetMinutes({ date: new Date('2026-07-01T04:00:00Z') }); // 120
 * getUtcOffsetMinutes({ date: new Date('2026-12-01T05:00:00Z') }); // 60
 */
export const getUtcOffsetMinutes = ({ date = new Date(), timeZone = DEPLOY_TIME_ZONE } = {}) => {
  const isValidDate = date instanceof Date && !Number.isNaN(date.getTime());
  if (!isValidDate) return undefined;

  let offsetName;
  try {
    offsetName = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value;
  } catch {
    // An unknown time zone throws a RangeError
    return undefined;
  }

  const match = UTC_OFFSET_NAME_PATTERN.exec(offsetName ?? '');
  if (!match) return undefined;

  const [, sign, hours, minutes] = match;
  // `GMT` alone, without a sign, is UTC itself
  if (!sign) return 0;

  const offset = Number(hours) * MINUTES_PER_HOUR + Number(minutes);
  return sign === '-' ? -offset : offset;
};

/**
 * Local date and time of a moment in a time zone, from {@link getLocalTime}.
 * @typedef {object} LocalTime
 * @property {string} day - Local date, `YYYY-MM-DD`.
 * @property {number} minutes - Local time, in minutes after midnight, from 0 to 1439.
 */

/**
 * Parameters of {@link getLocalTime}.
 * @typedef {object} GetLocalTimeParams
 * @property {Date} date - Moment to read.
 * @property {string} [timeZone] - IANA time zone, e.g. `Europe/Paris`. Defaults to
 * {@link DEPLOY_TIME_ZONE}.
 */

/**
 * Reads the local date and time of a moment in a time zone, daylight saving time included.
 * @param {GetLocalTimeParams} params
 * @returns {LocalTime | undefined} The local date and time, or `undefined` when
 * {@link getUtcOffsetMinutes} cannot read the offset at that moment.
 * @example
 * getLocalTime({ date: new Date('2026-07-01T04:07:00Z') }); // { day: '2026-07-01', minutes: 367 }
 */
export const getLocalTime = ({ date, timeZone = DEPLOY_TIME_ZONE }) => {
  const offsetMinutes = getUtcOffsetMinutes({ date, timeZone });
  if (offsetMinutes === undefined) return undefined;

  // A UTC date shifted by the offset reads, in UTC, as the local date and time
  const local = new Date(date.getTime() + offsetMinutes * MS_PER_MINUTE);
  return {
    day: local.toISOString().slice(0, ISO_DATE_LENGTH),
    minutes: local.getUTCHours() * MINUTES_PER_HOUR + local.getUTCMinutes(),
  };
};

/**
 * Writes a local time the way people read it.
 * @param {number} minutes - Minutes after midnight, from 0 to 1439.
 * @returns {string} The time on 24 hours, e.g. `06:07`, or an empty string for a value that is
 * not a whole number of minutes within a day.
 * @example
 * formatLocalTime(367); // '06:07'
 */
export const formatLocalTime = minutes => {
  const isTimeOfDay = Number.isInteger(minutes) && minutes >= 0 && minutes < MINUTES_PER_DAY;
  if (!isTimeOfDay) return '';

  const hours = String(Math.floor(minutes / MINUTES_PER_HOUR)).padStart(2, '0');
  return `${hours}:${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')}`;
};

/**
 * Parameters of {@link mergeScheduledRuns}.
 * @typedef {object} MergeScheduledRunsParams
 * @property {WorkflowRun[]} [cronRuns] - Runs that the crons of the workflow started. None by
 * default.
 * @property {WorkflowRun[]} [manualRuns] - Runs started by hand, those of the Cloudflare trigger
 * among them. None by default.
 */

/**
 * Lists the scheduled runs of the deploy workflow: those that its crons started, and those
 * started by hand with its `scheduled` input (`SCHEDULED_INPUT`), as the Cloudflare trigger
 * starts them, which their title, {@link SCHEDULED_RUN_TITLE}, tells from the other runs started
 * by hand.
 * @param {MergeScheduledRunsParams} [params]
 * @returns {WorkflowRun[]} The scheduled runs, newest first.
 * @example
 * mergeScheduledRuns({ cronRuns: [cronRun], manualRuns: [triggerRun, runByHand] });
 * // [triggerRun, cronRun], when the trigger started its run after the cron
 */
export const mergeScheduledRuns = ({ cronRuns = [], manualRuns = [] } = {}) =>
  [...cronRuns, ...manualRuns.filter(run => run.title === SCHEDULED_RUN_TITLE)].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  );

/**
 * Parameters of {@link fetchScheduledRuns}: the number of runs to read for each event, and the
 * API and token, which {@link fetchWorkflowRuns} reads from the variables of GitHub Actions by
 * default.
 * @typedef {Omit<import('./run-requests.mjs').FetchWorkflowRunsParams, 'workflow' | 'event'>}
 *   FetchScheduledRunsParams
 */

/**
 * Asks the REST API of GitHub for the latest scheduled runs of the deploy workflow: the runs of
 * its crons, and the runs started by hand, of which {@link mergeScheduledRuns} keeps those of the
 * Cloudflare trigger.
 * @param {FetchScheduledRunsParams} params
 * @returns {Promise<WorkflowRun[]>} The scheduled runs, newest first.
 * @throws {Error} When the repository is invalid, or when the API answers with an error status.
 * @example
 * await fetchScheduledRuns({ perPage: 20 });
 */
export const fetchScheduledRuns = async ({ perPage, ...api }) => {
  const [cronRuns, manualRuns] = await Promise.all(
    [SCHEDULE_EVENT, MANUAL_EVENT].map(event =>
      fetchWorkflowRuns({ ...api, workflow: DEPLOY_WORKFLOW_FILE, event, perPage }),
    ),
  );
  return mergeScheduledRuns({ cronRuns, manualRuns });
};

/**
 * Parameters of the helpers that place a run among the scheduled runs of the deploy workflow.
 * @typedef {object} ScheduledRunsParams
 * @property {string} [eventName] - Event that started this run, the `GITHUB_EVENT_NAME` variable.
 * @property {boolean} [hasScheduledInput] - Whether this run, started by hand, has its
 * `scheduled` input (`SCHEDULED_INPUT`) set, as the Cloudflare trigger sets it, which makes it a
 * scheduled run. False by default.
 * @property {number} [runId] - Identifier of this run, the `GITHUB_RUN_ID` variable, to find it
 * among `runs`.
 * @property {WorkflowRun[]} [runs] - Latest scheduled runs of the workflow, newest first, from
 * {@link fetchScheduledRuns}, this one included when it is scheduled. None by default.
 * @property {Date} [date] - Moment of this run. Defaults to its creation date among `runs`, which
 * is when its cron fired or its trigger started it, or else to now.
 */

/**
 * Tells whether this run is a scheduled run: one that a cron of the workflow started, or one
 * started by hand with its `scheduled` input (`SCHEDULED_INPUT`), as the Cloudflare trigger
 * starts it.
 * @param {ScheduledRunsParams} params
 * @returns {boolean} False for a run started by hand without the input, and for any other event.
 */
const isScheduledRun = ({ eventName, hasScheduledInput }) => {
  const isScheduledDispatch = eventName === MANUAL_EVENT && hasScheduledInput === true;
  return eventName === SCHEDULE_EVENT || isScheduledDispatch;
};

/**
 * Tells when a run started, for the comparisons with the other scheduled runs.
 * @param {ScheduledRunsParams} params
 * @returns {Date} The given date, or the creation date of the run among `runs`, or now.
 */
const getRunMoment = ({ runId, runs = [], date }) =>
  date ?? runs.find(run => run.id === runId)?.createdAt ?? new Date();

/**
 * Lists the scheduled runs that GitHub created before this one, newest first.
 * @param {ScheduledRunsParams & { moment: Date }} params
 * @returns {WorkflowRun[]} The runs other than this one created before `moment`.
 */
const getEarlierRuns = ({ runId, runs = [], moment }) =>
  runs.filter(run => run.id !== runId && run.createdAt.getTime() < moment.getTime());

/**
 * Whether a run of the deploy workflow goes on, and why, from {@link getScheduleVerdict}.
 * @typedef {object} ScheduleVerdict
 * @property {boolean} isDue - Whether the run goes on to the release and the deploy.
 * @property {string} message - Why, for the log, or for a notice when the run stops.
 */

/**
 * Tells whether a run of `deploy-production.yml` is the deploy of the day. The Cloudflare trigger
 * starts a scheduled run twice in the morning, and the crons of the workflow one every 30 minutes,
 * so that a run that GitHub delays or skips is caught by another one: a scheduled run goes on from
 * {@link DEPLOY_START_MINUTES} in {@link DEPLOY_TIME_ZONE}, until one of them passes, and the later
 * ones of the day stop. A failed run lets the next one try again, such as one that found the
 * commit to deploy untested (`check-develop-ci.mjs`). A run started by hand always goes on, unless
 * its `scheduled` input (`SCHEDULED_INPUT`) makes it a scheduled run.
 * @param {ScheduledRunsParams} [params]
 * @returns {ScheduleVerdict} Whether the run goes on and why. It stops for an unknown event, an
 * unknown offset of the time zone, a time before 6:00, and a scheduled run of the day, since 6:00,
 * that passed.
 * @example
 * getScheduleVerdict({ eventName: 'schedule', runs: [], date: new Date('2026-12-01T04:07:00Z') });
 * // { isDue: false, message: 'Skipped: it is 05:07 in Europe/Paris, before the deploy of 06:00.' }
 */
export const getScheduleVerdict = ({
  eventName,
  hasScheduledInput,
  runId,
  runs = [],
  date,
} = {}) => {
  const isRunByHand = eventName === MANUAL_EVENT && hasScheduledInput !== true;
  if (isRunByHand) {
    return { isDue: true, message: 'Started by hand: no schedule to check.' };
  }
  if (!isScheduledRun({ eventName, hasScheduledInput })) {
    return {
      isDue: false,
      message: `Skipped: a run started by ${eventName || 'an unknown event'} does not deploy.`,
    };
  }

  const moment = getRunMoment({ runId, runs, date });
  const localTime = getLocalTime({ date: moment });
  if (!localTime) {
    return {
      isDue: false,
      message: `Skipped: the offset of ${DEPLOY_TIME_ZONE} from UTC is unknown at this date.`,
    };
  }

  const time = formatLocalTime(localTime.minutes);
  const startTime = formatLocalTime(DEPLOY_START_MINUTES);
  if (localTime.minutes < DEPLOY_START_MINUTES) {
    return {
      isDue: false,
      message: `Skipped: it is ${time} in ${DEPLOY_TIME_ZONE}, before the deploy of ${startTime}.`,
    };
  }

  const runsOfTheDay = getEarlierRuns({ runId, runs, moment }).flatMap(run => {
    const runTime = getLocalTime({ date: run.createdAt });
    const isDeployRunOfTheDay =
      runTime?.day === localTime.day && runTime.minutes >= DEPLOY_START_MINUTES;
    return isDeployRunOfTheDay ? [{ run, time: formatLocalTime(runTime.minutes) }] : [];
  });

  const passed = runsOfTheDay.find(({ run }) => run.conclusion === RUN_SUCCESS_CONCLUSION);
  if (passed) {
    return {
      isDue: false,
      message: `Skipped: the scheduled run of ${passed.time} already went through today: ${passed.run.url}`,
    };
  }

  const [failed] = runsOfTheDay;
  if (failed) {
    return {
      isDue: true,
      message: `It is ${time} in ${DEPLOY_TIME_ZONE}, and the scheduled run of ${failed.time} did not pass (${failed.run.conclusion ?? failed.run.status}): this one tries again. ${failed.run.url}`,
    };
  }

  return {
    isDue: true,
    message: `It is ${time} in ${DEPLOY_TIME_ZONE}: the first scheduled run of the day deploys.`,
  };
};

/**
 * Tells whether no scheduled run started on a day, neither from the Cloudflare trigger nor from
 * the crons, which GitHub may skip under load, which would otherwise stop the daily deploy without
 * a word: the last scheduled run before this one is more than {@link SCHEDULE_GAP_WARNING_HOURS}
 * old, or a run that is not scheduled finds none. Besides the scheduled runs themselves, a run
 * started by hand and the CI of each push to develop (`check-deploy-schedule-gap.mjs`) ask,
 * measuring from now, so that a schedule that stopped for good is reported too.
 * @param {ScheduledRunsParams} [params]
 * @returns {string | undefined} The warning, naming the gap and the last scheduled run, or
 * `undefined` when the schedule kept up, or when the first scheduled run finds none before it.
 * @example
 * getScheduleGapWarning({ eventName: 'schedule', runId: 2, runs: [thisRun, runOfTwoDaysAgo] });
 * // 'No scheduled run of deploy-production.yml for 45 hours, since 2026-10-17T06:37:00.000Z: …'
 */
export const getScheduleGapWarning = ({
  eventName,
  hasScheduledInput,
  runId,
  runs = [],
  date,
} = {}) => {
  const moment = getRunMoment({ runId, runs, date });
  const [previousRun] = getEarlierRuns({ runId, runs, moment });
  if (!previousRun) {
    if (isScheduledRun({ eventName, hasScheduledInput })) return undefined;
    return `No scheduled run of ${DEPLOY_WORKFLOW_FILE} has ever started: check that the Cloudflare trigger is deployed with its token (docs/deployment.md), that the workflow is enabled in the Actions tab, and that its crons are on the default branch.`;
  }

  const gapMinutes = (moment.getTime() - previousRun.createdAt.getTime()) / MS_PER_MINUTE;
  const gapHours = Math.floor(gapMinutes / MINUTES_PER_HOUR);
  const isGapTooLong = gapMinutes > SCHEDULE_GAP_WARNING_HOURS * MINUTES_PER_HOUR;
  if (!isGapTooLong) return undefined;

  return `No scheduled run of ${DEPLOY_WORKFLOW_FILE} for ${gapHours} hours, since ${previousRun.createdAt.toISOString()}: neither the Cloudflare trigger nor the crons of GitHub started a run on at least one day, so nothing was deployed then. Check the trigger and its token (docs/deployment.md) and that the workflow is enabled in the Actions tab, and start it by hand if a deploy is missing. ${previousRun.url}`;
};

/**
 * Tells whether a scheduled run was started by the Cloudflare trigger, rather than by a cron of
 * the workflow, by its title, {@link SCHEDULED_RUN_TITLE}. A run started by hand with the
 * `scheduled` input (`SCHEDULED_INPUT`) shares that title, so it counts as a run of the trigger:
 * the API lists the runs without their inputs.
 * @param {WorkflowRun} run - A scheduled run, from {@link mergeScheduledRuns}.
 * @returns {boolean} False for a run of the crons, and for a run without a title.
 */
const isTriggerRun = run => run.title === SCHEDULED_RUN_TITLE;

/**
 * Tells whether the Cloudflare trigger stopped starting runs while the crons of GitHub still do,
 * as when its dispatch token expired or the Worker was deleted: each of its calls then fails in
 * the logs of Cloudflare only, and {@link getScheduleGapWarning}, which counts the runs of the
 * crons too, stays quiet while they deploy, hours late. The last run of the trigger is more than
 * {@link SCHEDULE_GAP_WARNING_HOURS} old, or none is found among runs of the crons that go back
 * further, and the crons started a run since. Measured from this run, or from now for the CI of a
 * push to develop (`check-deploy-schedule-gap.mjs`).
 * @param {ScheduledRunsParams} [params]
 * @returns {string | undefined} The warning, naming the last run of the trigger, or `undefined`
 * when the trigger kept up, when no cron started a run since it stopped, or when the runs do not go
 * back {@link SCHEDULE_GAP_WARNING_HOURS}.
 * @example
 * getTriggerGapWarning({ runId: 10, runs: [thisCronRun, cronRun, triggerRunOfTwoDaysAgo] });
 * // 'The Cloudflare trigger has not started a run of deploy-production.yml since …'
 */
export const getTriggerGapWarning = ({ runId, runs = [], date } = {}) => {
  const moment = getRunMoment({ runId, runs, date });
  /** @param {WorkflowRun} run */
  const isStartedByMoment = run => run.createdAt.getTime() <= moment.getTime();
  const startedRuns = runs.filter(isStartedByMoment);
  const lastTriggerRun = startedRuns.find(isTriggerRun);
  const lastTriggerTime = lastTriggerRun?.createdAt.getTime() ?? Number.NEGATIVE_INFINITY;
  /** @param {WorkflowRun} run */
  const isCronRunSinceTrigger = run =>
    !isTriggerRun(run) && run.createdAt.getTime() > lastTriggerTime;
  const cronRunsSince = startedRuns.filter(isCronRunSinceTrigger);
  const oldestCronRun = cronRunsSince.at(-1);
  if (!oldestCronRun) return undefined;

  // Without any run of the trigger, the runs of the crons tell how long it has been missing
  const since = lastTriggerRun?.createdAt ?? oldestCronRun.createdAt;
  const gapMinutes = (moment.getTime() - since.getTime()) / MS_PER_MINUTE;
  const isGapTooLong = gapMinutes > SCHEDULE_GAP_WARNING_HOURS * MINUTES_PER_HOUR;
  if (!isGapTooLong) return undefined;

  const isSingleCronRun = cronRunsSince.length === 1;
  const cronCount = `${cronRunsSince.length} run${isSingleCronRun ? '' : 's'}`;
  if (!lastTriggerRun) {
    return `The Cloudflare trigger has not started any run of ${DEPLOY_WORKFLOW_FILE} since at least ${since.toISOString()}, while the crons of GitHub started ${cronCount}, which deploy hours late: deploy the trigger with a valid dispatch token (docs/deployment.md).`;
  }
  return `The Cloudflare trigger has not started a run of ${DEPLOY_WORKFLOW_FILE} since ${since.toISOString()}, while the crons of GitHub started ${cronCount}, which deploy hours late: renew its dispatch token, read its logs in Cloudflare (docs/deployment.md). ${lastTriggerRun.url}`;
};
