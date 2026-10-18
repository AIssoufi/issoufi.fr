// @ts-check
import {
  DEPLOY_CRON_BY_UTC_OFFSET_MINUTES,
  DEPLOY_TIME_ZONE,
  MANUAL_EVENT,
  MINUTES_PER_HOUR,
  SCHEDULE_EVENT,
  UTC_OFFSET_NAME_PATTERN,
} from '../constants.mjs';

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
 * Writes an offset from UTC the way people read it.
 * @param {number} offsetMinutes - Offset from UTC, in minutes.
 * @returns {string} The offset, e.g. `UTC+02:00` or `UTC-03:30`.
 */
const formatUtcOffset = offsetMinutes => {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / MINUTES_PER_HOUR)).padStart(2, '0');
  const minutes = String(absoluteMinutes % MINUTES_PER_HOUR).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
};

/**
 * Whether a run of the deploy workflow goes on, and why, from {@link getScheduleVerdict}.
 * @typedef {object} ScheduleVerdict
 * @property {boolean} isDue - Whether the run goes on to the other checks.
 * @property {string} message - Why, for the log, or for a notice when the run stops.
 */

/**
 * Parameters of {@link getScheduleVerdict}.
 * @typedef {object} GetScheduleVerdictParams
 * @property {string} [eventName] - Event that started the run, the `GITHUB_EVENT_NAME` variable.
 * Any event other than {@link SCHEDULE_EVENT} and {@link MANUAL_EVENT} stops the run.
 * @property {string} [schedule] - Cron of a scheduled run, `github.event.schedule`, e.g.
 * `0 4 * * *`. Ignored for a run started by hand.
 * @property {Date} [date] - Moment of the run. Defaults to now.
 */

/**
 * Tells whether a run of `deploy-production.yml` is the deploy of the day. The workflow has a
 * schedule for 6:00 in Paris in summer and another for winter, and runs both every day: only the
 * one that matches today's offset of {@link DEPLOY_TIME_ZONE} from UTC goes on (see
 * {@link DEPLOY_CRON_BY_UTC_OFFSET_MINUTES}), whatever the delay of GitHub's scheduler. A run
 * started by hand always goes on.
 * @param {GetScheduleVerdictParams} [params]
 * @returns {ScheduleVerdict} Whether the run goes on and why. It stops for an unknown event, a
 * missing or unknown schedule, an invalid date, and an offset that no schedule covers.
 * @example
 * getScheduleVerdict({
 *   eventName: 'schedule',
 *   schedule: '0 5 * * *',
 *   date: new Date('2026-07-01T05:00:00Z'),
 * });
 * // { isDue: false, message: 'Skipped: Europe/Paris is at UTC+02:00 today, so the 0 4 * * *
 * // schedule deploys, not this one (0 5 * * *).' }
 */
export const getScheduleVerdict = ({ eventName, schedule, date = new Date() } = {}) => {
  if (eventName === MANUAL_EVENT) {
    return { isDue: true, message: 'Started by hand: no schedule to check.' };
  }
  if (eventName !== SCHEDULE_EVENT) {
    return {
      isDue: false,
      message: `Skipped: a run started by ${eventName || 'an unknown event'} does not deploy.`,
    };
  }

  const offsetMinutes = getUtcOffsetMinutes({ date, timeZone: DEPLOY_TIME_ZONE });
  if (offsetMinutes === undefined) {
    return {
      isDue: false,
      message: `Skipped: the offset of ${DEPLOY_TIME_ZONE} from UTC is unknown at this date.`,
    };
  }

  const offset = formatUtcOffset(offsetMinutes);
  const scheduleOfTheDay = DEPLOY_CRON_BY_UTC_OFFSET_MINUTES.get(offsetMinutes);
  if (scheduleOfTheDay === undefined) {
    return {
      isDue: false,
      message: `Skipped: no schedule deploys when ${DEPLOY_TIME_ZONE} is at ${offset}. Add one to deploy-production.yml and DEPLOY_CRON_BY_UTC_OFFSET_MINUTES.`,
    };
  }

  const isScheduleOfTheDay = schedule === scheduleOfTheDay;
  if (!isScheduleOfTheDay) {
    return {
      isDue: false,
      message: `Skipped: ${DEPLOY_TIME_ZONE} is at ${offset} today, so the ${scheduleOfTheDay} schedule deploys, not this one (${schedule || 'none'}).`,
    };
  }

  return {
    isDue: true,
    message: `${DEPLOY_TIME_ZONE} is at ${offset} today: the ${schedule} schedule deploys.`,
  };
};
