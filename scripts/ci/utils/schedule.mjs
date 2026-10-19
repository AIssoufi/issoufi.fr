// @ts-check
import {
  DEPLOY_START_MINUTES,
  DEPLOY_TIME_ZONE,
  DEPLOY_WORKFLOW_FILE,
  ISO_DATE_LENGTH,
  MANUAL_EVENT,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
  RUN_SUCCESS_CONCLUSION,
  SCHEDULE_EVENT,
  SCHEDULE_GAP_WARNING_HOURS,
  UTC_OFFSET_NAME_PATTERN,
} from '../constants.mjs';

/** @typedef {import('./workflow-runs.mjs').WorkflowRun} WorkflowRun */

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
 * @param {number} minutes - Minutes after midnight.
 * @returns {string} The time on 24 hours, e.g. `06:07`.
 */
const formatLocalTime = minutes => {
  const hours = String(Math.floor(minutes / MINUTES_PER_HOUR)).padStart(2, '0');
  return `${hours}:${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')}`;
};

/**
 * Parameters of the helpers that place a run among the scheduled runs of the deploy workflow.
 * @typedef {object} ScheduledRunsParams
 * @property {string} [eventName] - Event that started this run, the `GITHUB_EVENT_NAME` variable.
 * @property {number} [runId] - Identifier of this run, the `GITHUB_RUN_ID` variable, to find it
 * among `runs`.
 * @property {WorkflowRun[]} [runs] - Latest scheduled runs of the workflow, newest first, this one
 * included when it is scheduled. None by default.
 * @property {Date} [date] - Moment of this run. Defaults to its creation date among `runs`, which
 * is when its cron fired, or else to now.
 */

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
 * Tells whether a run of `deploy-production.yml` is the deploy of the day. Its crons start a run
 * every 30 minutes in the morning, so that a run that GitHub skips is caught by the next one: a
 * scheduled run goes on from {@link DEPLOY_START_MINUTES} in {@link DEPLOY_TIME_ZONE}, until one of
 * them passes, and the later ones of the day stop. A failed run lets the next one try again. A run
 * started by hand always goes on.
 * @param {ScheduledRunsParams} [params]
 * @returns {ScheduleVerdict} Whether the run goes on and why. It stops for an unknown event, an
 * unknown offset of the time zone, a time before 6:00, and a scheduled run of the day, since 6:00,
 * that passed.
 * @example
 * getScheduleVerdict({ eventName: 'schedule', runs: [], date: new Date('2026-12-01T04:07:00Z') });
 * // { isDue: false, message: 'Skipped: it is 05:07 in Europe/Paris, before the deploy of 06:00.' }
 */
export const getScheduleVerdict = ({ eventName, runId, runs = [], date } = {}) => {
  if (eventName === MANUAL_EVENT) {
    return { isDue: true, message: 'Started by hand: no schedule to check.' };
  }
  if (eventName !== SCHEDULE_EVENT) {
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
 * Tells whether GitHub skipped every scheduled run of a day, which it may do under load, and
 * which would otherwise stop the daily deploy without a word: the last scheduled run before this
 * one is more than {@link SCHEDULE_GAP_WARNING_HOURS} old, or a run started by hand finds none.
 * @param {ScheduledRunsParams} [params]
 * @returns {string | undefined} The warning, naming the gap and the last scheduled run, or
 * `undefined` when the schedule kept up, or when the first scheduled run finds none before it.
 * @example
 * getScheduleGapWarning({ eventName: 'schedule', runId: 2, runs: [thisRun, runOfTwoDaysAgo] });
 * // 'No scheduled run of deploy-production.yml for 45 hours, since 2026-10-17T06:37:00.000Z: …'
 */
export const getScheduleGapWarning = ({ eventName, runId, runs = [], date } = {}) => {
  const moment = getRunMoment({ runId, runs, date });
  const [previousRun] = getEarlierRuns({ runId, runs, moment });
  if (!previousRun) {
    if (eventName === SCHEDULE_EVENT) return undefined;
    return `GitHub has never started ${DEPLOY_WORKFLOW_FILE} on its schedule: check that the workflow is enabled in the Actions tab and that its crons are on the default branch.`;
  }

  const gapMinutes = (moment.getTime() - previousRun.createdAt.getTime()) / MS_PER_MINUTE;
  const gapHours = Math.floor(gapMinutes / MINUTES_PER_HOUR);
  const isGapTooLong = gapMinutes > SCHEDULE_GAP_WARNING_HOURS * MINUTES_PER_HOUR;
  if (!isGapTooLong) return undefined;

  return `No scheduled run of ${DEPLOY_WORKFLOW_FILE} for ${gapHours} hours, since ${previousRun.createdAt.toISOString()}: GitHub skipped every run of at least one day, so nothing was deployed then. Check that the workflow is enabled in the Actions tab, and start it by hand if a deploy is missing. ${previousRun.url}`;
};
