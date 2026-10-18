import { readFileSync } from 'node:fs';

import { DEPLOY_CRON_BY_UTC_OFFSET_MINUTES } from '../constants.mjs';
import { getScheduleVerdict, getUtcOffsetMinutes } from './schedule.mjs';

const SUMMER_CRON = '0 4 * * *';
const WINTER_CRON = '0 5 * * *';

describe('getUtcOffsetMinutes', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['2026-07-01T04:00:00Z', 120],
    ['2026-12-01T05:00:00Z', 60],
    // Summer time ends at 1:00 UTC on the last Sunday of October, and starts at 1:00 UTC on the
    // last Sunday of March
    ['2026-10-25T00:59:59Z', 120],
    ['2026-10-25T01:00:00Z', 60],
    ['2027-03-28T00:59:59Z', 60],
    ['2027-03-28T01:00:00Z', 120],
  ])('reads the offset of Europe/Paris at %s', (date, offset) => {
    expect(getUtcOffsetMinutes({ date: new Date(date) })).toBe(offset);
  });

  it.each([
    ['UTC', 0],
    ['Asia/Kolkata', 330],
    ['America/St_Johns', -150],
    ['America/Sao_Paulo', -180],
  ])('reads the offset of %s', (timeZone, offset) => {
    expect(getUtcOffsetMinutes({ date: new Date('2026-07-01T04:00:00Z'), timeZone })).toBe(offset);
  });

  it('defaults to the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T05:00:00Z'));
    expect(getUtcOffsetMinutes()).toBe(60);
  });

  it.each([new Date('not a date'), new Date(NaN), '2026-07-01T04:00:00Z', 0, null])(
    'returns undefined for the date %o',
    date => {
      expect(getUtcOffsetMinutes({ date })).toBeUndefined();
    },
  );

  it.each(['Nowhere/Unknown', '', null, 42])('returns undefined for the time zone %o', timeZone => {
    expect(getUtcOffsetMinutes({ date: new Date(), timeZone })).toBeUndefined();
  });

  it('returns undefined for an offset with seconds, such as the local mean time of Paris', () => {
    expect(getUtcOffsetMinutes({ date: new Date('1900-01-01T05:00:00Z') })).toBeUndefined();
  });

  it('reads GMT alone as UTC, as older versions of ICU name it', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
      { type: 'timeZoneName', value: 'GMT' },
    ]);
    expect(getUtcOffsetMinutes({ date: new Date(), timeZone: 'UTC' })).toBe(0);
  });

  it('returns undefined when the date has no time zone name', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([]);
    expect(getUtcOffsetMinutes({ date: new Date() })).toBeUndefined();
  });
});

describe('getScheduleVerdict', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const summerMorning = new Date('2026-07-01T04:03:00Z');
  const winterMorning = new Date('2026-12-01T05:03:00Z');

  it('lets a run started by hand go on, whatever the schedule and the date', () => {
    expect(
      getScheduleVerdict({ eventName: 'workflow_dispatch', date: new Date('not a date') }),
    ).toEqual({ isDue: true, message: 'Started by hand: no schedule to check.' });
  });

  it('lets the summer schedule go on in summer', () => {
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule: SUMMER_CRON, date: summerMorning }),
    ).toEqual({
      isDue: true,
      message: 'Europe/Paris is at UTC+02:00 today: the 0 4 * * * schedule deploys.',
    });
  });

  it('lets the winter schedule go on in winter', () => {
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule: WINTER_CRON, date: winterMorning }),
    ).toEqual({
      isDue: true,
      message: 'Europe/Paris is at UTC+01:00 today: the 0 5 * * * schedule deploys.',
    });
  });

  it.each([
    [WINTER_CRON, summerMorning, SUMMER_CRON, 'UTC+02:00'],
    [SUMMER_CRON, winterMorning, WINTER_CRON, 'UTC+01:00'],
  ])('stops the %s schedule on %s', (schedule, date, scheduleOfTheDay, offset) => {
    expect(getScheduleVerdict({ eventName: 'schedule', schedule, date })).toEqual({
      isDue: false,
      message: `Skipped: Europe/Paris is at ${offset} today, so the ${scheduleOfTheDay} schedule deploys, not this one (${schedule}).`,
    });
  });

  it.each([
    // The day summer time ends: 4:00 UTC is already 5:00 in Paris, 5:00 UTC is 6:00
    ['2026-10-25T04:00:00Z', SUMMER_CRON, false],
    ['2026-10-25T05:00:00Z', WINTER_CRON, true],
    // The day summer time starts: 4:00 UTC is already 6:00 in Paris, 5:00 UTC is 7:00
    ['2027-03-28T04:00:00Z', SUMMER_CRON, true],
    ['2027-03-28T05:00:00Z', WINTER_CRON, false],
  ])('deploys once at 6:00 in Paris on a day of time change (%s, %s)', (date, schedule, isDue) => {
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule, date: new Date(date) }).isDue,
    ).toBe(isDue);
  });

  it('keeps the schedule of the day when GitHub starts the run hours late', () => {
    const lateRun = new Date('2026-07-01T09:47:00Z');
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule: SUMMER_CRON, date: lateRun }).isDue,
    ).toBe(true);
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule: WINTER_CRON, date: lateRun }).isDue,
    ).toBe(false);
  });

  it('defaults to the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(winterMorning);
    expect(getScheduleVerdict({ eventName: 'schedule', schedule: WINTER_CRON }).isDue).toBe(true);
  });

  it.each([undefined, '', '0 6 * * *', '0 4 * * 1'])(
    'stops a scheduled run with the schedule %o',
    schedule => {
      const verdict = getScheduleVerdict({ eventName: 'schedule', schedule, date: summerMorning });
      expect(verdict).toEqual({
        isDue: false,
        message: `Skipped: Europe/Paris is at UTC+02:00 today, so the 0 4 * * * schedule deploys, not this one (${schedule || 'none'}).`,
      });
    },
  );

  it.each([
    ['push', 'Skipped: a run started by push does not deploy.'],
    [undefined, 'Skipped: a run started by an unknown event does not deploy.'],
    ['', 'Skipped: a run started by an unknown event does not deploy.'],
  ])('stops a run started by %o', (eventName, message) => {
    expect(getScheduleVerdict({ eventName, schedule: SUMMER_CRON, date: summerMorning })).toEqual({
      isDue: false,
      message,
    });
  });

  it('stops without any parameter', () => {
    expect(getScheduleVerdict().isDue).toBe(false);
  });

  it('stops a scheduled run at an invalid date', () => {
    expect(
      getScheduleVerdict({
        eventName: 'schedule',
        schedule: SUMMER_CRON,
        date: new Date('not a date'),
      }),
    ).toEqual({
      isDue: false,
      message: 'Skipped: the offset of Europe/Paris from UTC is unknown at this date.',
    });
  });

  it('stops a scheduled run when the offset of the day is not a whole number of minutes', () => {
    expect(
      getScheduleVerdict({
        eventName: 'schedule',
        schedule: SUMMER_CRON,
        date: new Date('1900-01-01T05:00:00Z'),
      }).isDue,
    ).toBe(false);
  });

  it('stops when no schedule covers the offset of the day', () => {
    // Paris was at UTC+00:00 in winter from 1911 to 1940
    expect(
      getScheduleVerdict({
        eventName: 'schedule',
        schedule: SUMMER_CRON,
        date: new Date('1920-01-01T05:00:00Z'),
      }),
    ).toEqual({
      isDue: false,
      message:
        'Skipped: no schedule deploys when Europe/Paris is at UTC+00:00. Add one to deploy-production.yml and DEPLOY_CRON_BY_UTC_OFFSET_MINUTES.',
    });
  });

  it('writes a negative offset that no schedule covers', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
      { type: 'timeZoneName', value: 'GMT-03:30' },
    ]);
    expect(
      getScheduleVerdict({ eventName: 'schedule', schedule: SUMMER_CRON, date: summerMorning })
        .message,
    ).toMatch(/^Skipped: no schedule deploys when Europe\/Paris is at UTC-03:30\. /);
  });
});

describe('DEPLOY_CRON_BY_UTC_OFFSET_MINUTES', () => {
  it('holds the schedules of deploy-production.yml, and only them', () => {
    const workflow = readFileSync('.github/workflows/deploy-production.yml', 'utf8');
    const workflowCrons = [...workflow.matchAll(/^\s*- cron: '([^']+)'$/gm)].map(match => match[1]);

    expect(workflowCrons).toHaveLength(2);
    expect([...DEPLOY_CRON_BY_UTC_OFFSET_MINUTES.values()].sort()).toEqual(workflowCrons.sort());
  });
});
