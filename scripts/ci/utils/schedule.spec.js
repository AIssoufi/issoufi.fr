import { readFileSync } from 'node:fs';

import {
  DEPLOY_RUNS_PAGE_SIZE,
  DEPLOY_START_MINUTES,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  SCHEDULE_GAP_WARNING_HOURS,
  SCHEDULED_INPUT,
  SCHEDULED_RUN_TITLE,
} from '../constants.mjs';
import {
  fetchScheduledRuns,
  formatLocalTime,
  getLocalTime,
  getScheduleGapWarning,
  getScheduleVerdict,
  getTriggerGapWarning,
  getUtcOffsetMinutes,
  mergeScheduledRuns,
} from './schedule.mjs';
import { stubGitHub, stubGitHubEnv } from './testUtils.js';

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

describe('getLocalTime', () => {
  it.each([
    ['2026-07-01T04:07:00Z', { day: '2026-07-01', minutes: 367 }],
    ['2026-12-01T04:07:00Z', { day: '2026-12-01', minutes: 307 }],
    // Midnight in Paris is still the day before in UTC
    ['2026-07-01T22:30:00Z', { day: '2026-07-02', minutes: 30 }],
    ['2026-12-31T23:00:00Z', { day: '2027-01-01', minutes: 0 }],
    ['2026-12-31T22:59:00Z', { day: '2026-12-31', minutes: 1439 }],
  ])('reads %s in Europe/Paris', (date, localTime) => {
    expect(getLocalTime({ date: new Date(date) })).toEqual(localTime);
  });

  it('reads another time zone', () => {
    expect(
      getLocalTime({ date: new Date('2026-07-01T04:07:00Z'), timeZone: 'America/St_Johns' }),
    ).toEqual({ day: '2026-07-01', minutes: 97 });
  });

  it.each([
    [new Date('not a date'), 'Europe/Paris'],
    [new Date('2026-07-01T04:07:00Z'), 'Nowhere/Unknown'],
  ])('returns undefined for %o in %s', (date, timeZone) => {
    expect(getLocalTime({ date, timeZone })).toBeUndefined();
  });
});

describe('formatLocalTime', () => {
  it.each([
    [367, '06:07'],
    [0, '00:00'],
    [59, '00:59'],
    [60, '01:00'],
    [MINUTES_PER_DAY - 1, '23:59'],
  ])('writes %i minutes after midnight as %s', (minutes, time) => {
    expect(formatLocalTime(minutes)).toBe(time);
  });

  it.each([MINUTES_PER_DAY, -1, 6.5, Number.NaN, Infinity, '367', null, undefined])(
    'writes nothing for %o',
    minutes => {
      expect(formatLocalTime(minutes)).toBe('');
    },
  );
});

const RUNS_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs';

/** A scheduled run of deploy-production.yml, as fetchWorkflowRuns returns it. */
const scheduledRun = ({
  id = 1,
  createdAt,
  status = 'completed',
  conclusion = 'success',
  title,
}) => ({
  id,
  sha: '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8',
  status,
  conclusion,
  createdAt: new Date(createdAt),
  url: `${RUNS_URL}/${id}`,
  ...(title !== undefined && { title }),
});

/** A run that the Cloudflare trigger started, under the title of the scheduled runs. */
const triggerRun = fields => scheduledRun({ title: SCHEDULED_RUN_TITLE, ...fields });

describe('mergeScheduledRuns', () => {
  it('keeps the runs of the crons and those of the trigger, newest first', () => {
    const cronRuns = [
      scheduledRun({ id: 4, createdAt: '2026-10-20T04:37:00Z' }),
      scheduledRun({ id: 1, createdAt: '2026-10-19T04:07:00Z' }),
    ];
    const manualRuns = [
      triggerRun({ id: 3, createdAt: '2026-10-20T04:35:00Z' }),
      scheduledRun({ id: 5, createdAt: '2026-10-20T04:20:00Z', title: 'Deploy to production' }),
      triggerRun({ id: 2, createdAt: '2026-10-20T04:05:00Z' }),
      scheduledRun({ id: 6, createdAt: '2026-10-19T12:00:00Z' }),
    ];
    expect(mergeScheduledRuns({ cronRuns, manualRuns }).map(run => run.id)).toEqual([4, 3, 2, 1]);
  });

  it.each([[{}], [undefined], [{ cronRuns: [], manualRuns: [] }]])(
    'returns an empty list without runs (%o)',
    params => {
      expect(mergeScheduledRuns(params)).toEqual([]);
    },
  );

  it('reads the runs of one event alone', () => {
    const cronRun = scheduledRun({ id: 1, createdAt: '2026-10-19T04:07:00Z' });
    const ownRun = triggerRun({ id: 2, createdAt: '2026-10-19T04:05:00Z' });
    expect(mergeScheduledRuns({ cronRuns: [cronRun] })).toEqual([cronRun]);
    expect(mergeScheduledRuns({ manualRuns: [ownRun] })).toEqual([ownRun]);
  });
});

describe('fetchScheduledRuns', () => {
  const API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows';

  /** A run of the REST API answer, as GitHub writes it. */
  const apiRun = ({ id, createdAt, title = 'Deploy to production' }) => ({
    id,
    head_sha: '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8',
    status: 'completed',
    conclusion: 'success',
    created_at: createdAt,
    html_url: `${RUNS_URL}/${id}`,
    display_title: title,
  });

  /** Route of the runs of deploy-production.yml. */
  const RUNS_ROUTE = 'GET /actions/workflows/deploy-production.yml/runs';

  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('reads the runs of the crons and those of the trigger, newest first', async () => {
    const requests = stubGitHub({
      [`${RUNS_ROUTE}?event=schedule&per_page=20`]: [
        { body: { workflow_runs: [apiRun({ id: 1, createdAt: '2026-10-20T04:07:00Z' })] } },
      ],
      [`${RUNS_ROUTE}?event=workflow_dispatch&per_page=20`]: [
        {
          body: {
            workflow_runs: [
              apiRun({ id: 3, createdAt: '2026-10-20T04:35:00Z', title: SCHEDULED_RUN_TITLE }),
              apiRun({ id: 2, createdAt: '2026-10-20T04:10:00Z' }),
            ],
          },
        },
      ],
    });
    const runs = await fetchScheduledRuns({ perPage: 20 });
    expect(runs.map(run => run.id)).toEqual([3, 1]);
    expect(requests.map(({ url }) => url).sort()).toEqual([
      `${API_URL}/deploy-production.yml/runs?event=schedule&per_page=20`,
      `${API_URL}/deploy-production.yml/runs?event=workflow_dispatch&per_page=20`,
    ]);
  });

  it('reads another repository with another token', async () => {
    const requests = stubGitHub({
      'GET /repos/owner/repo/actions/workflows/deploy-production.yml/runs': [
        { body: { workflow_runs: [] } },
      ],
    });
    await fetchScheduledRuns({ perPage: 5, repository: 'owner/repo', token: 'other' });
    expect(requests).toHaveLength(2);
    for (const { url, headers } of requests) {
      expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/owner\/repo\//);
      expect(headers.Authorization).toBe('Bearer other');
    }
  });

  it('throws when the API answers with an error', async () => {
    stubGitHub({ [RUNS_ROUTE]: [{ status: 500, body: {} }] });
    await expect(fetchScheduledRuns({ perPage: 20 })).rejects.toThrow(
      'The GitHub API answered 500',
    );
  });
});

describe('getScheduleVerdict', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // 6:07 in Paris
  const summerRun = scheduledRun({ id: 10, createdAt: '2026-07-01T04:07:00Z' });
  const winterRun = scheduledRun({ id: 10, createdAt: '2026-12-01T05:07:00Z' });

  /** The verdict of the scheduled run `id` 10, created at `createdAt`, among `others`. */
  const verdictAt = ({ createdAt, others = [] }) =>
    getScheduleVerdict({
      eventName: 'schedule',
      runId: 10,
      runs: [
        scheduledRun({ id: 10, createdAt, status: 'in_progress', conclusion: null }),
        ...others,
      ],
    });

  it('lets a run started by hand go on, whatever the date and the other runs', () => {
    expect(
      getScheduleVerdict({
        eventName: 'workflow_dispatch',
        runs: [summerRun],
        date: new Date('not a date'),
      }),
    ).toEqual({ isDue: true, message: 'Started by hand: no schedule to check.' });
  });

  it.each([false, undefined, 'true', 1])(
    'lets a run started by hand with the scheduled input %o go on as one started by hand',
    hasScheduledInput => {
      const verdict = getScheduleVerdict({
        eventName: 'workflow_dispatch',
        hasScheduledInput,
        runs: [summerRun],
        date: new Date('2026-07-01T03:07:00Z'),
      });
      expect(verdict).toEqual({ isDue: true, message: 'Started by hand: no schedule to check.' });
    },
  );

  describe('for a run of the Cloudflare trigger, started by hand with the scheduled input', () => {
    /** The verdict of the run `id` 10 of the trigger, created at `createdAt`, among `others`. */
    const triggerVerdictAt = ({ createdAt, others = [] }) =>
      getScheduleVerdict({
        eventName: 'workflow_dispatch',
        hasScheduledInput: true,
        runId: 10,
        runs: [
          triggerRun({ id: 10, createdAt, status: 'in_progress', conclusion: null }),
          ...others,
        ],
      });

    it('lets the first scheduled run of the day go on from 6:00', () => {
      expect(triggerVerdictAt({ createdAt: '2026-07-01T04:05:00Z' })).toEqual({
        isDue: true,
        message: 'It is 06:05 in Europe/Paris: the first scheduled run of the day deploys.',
      });
    });

    it('stops it before 6:00 in Paris', () => {
      expect(triggerVerdictAt({ createdAt: '2026-12-01T04:05:00Z' })).toEqual({
        isDue: false,
        message: 'Skipped: it is 05:05 in Europe/Paris, before the deploy of 06:00.',
      });
    });

    it('stops it once a run of the crons passed today', () => {
      const cronRun = scheduledRun({ id: 9, createdAt: '2026-07-01T04:07:00Z' });
      expect(triggerVerdictAt({ createdAt: '2026-07-01T04:35:00Z', others: [cronRun] })).toEqual({
        isDue: false,
        message: `Skipped: the scheduled run of 06:07 already went through today: ${RUNS_URL}/9`,
      });
    });

    it('lets it try again after a run of the trigger that failed', () => {
      const failedRun = triggerRun({
        id: 9,
        createdAt: '2026-07-01T04:05:00Z',
        conclusion: 'failure',
      });
      expect(
        triggerVerdictAt({ createdAt: '2026-07-01T04:35:00Z', others: [failedRun] }).message,
      ).toBe(
        `It is 06:35 in Europe/Paris, and the scheduled run of 06:05 did not pass (failure): this one tries again. ${RUNS_URL}/9`,
      );
    });
  });

  it('stops a run of the crons once a run of the trigger passed today', () => {
    const passedRun = triggerRun({ id: 9, createdAt: '2026-07-01T04:05:00Z' });
    expect(verdictAt({ createdAt: '2026-07-01T04:07:00Z', others: [passedRun] })).toEqual({
      isDue: false,
      message: `Skipped: the scheduled run of 06:05 already went through today: ${RUNS_URL}/9`,
    });
  });

  it('reads a run of the crons as scheduled, whatever its scheduled input', () => {
    const verdict = getScheduleVerdict({
      eventName: 'schedule',
      hasScheduledInput: false,
      runId: 10,
      runs: [summerRun],
    });
    expect(verdict.isDue).toBe(true);
  });

  it('stops a run started by another event, even with the scheduled input', () => {
    expect(
      getScheduleVerdict({ eventName: 'push', hasScheduledInput: true, runs: [summerRun] }),
    ).toEqual({ isDue: false, message: 'Skipped: a run started by push does not deploy.' });
  });

  it.each([
    ['summer', summerRun],
    ['winter', winterRun],
  ])('lets the first scheduled run of the day from 6:00 go on in %s', (_, run) => {
    expect(getScheduleVerdict({ eventName: 'schedule', runId: 10, runs: [run] })).toEqual({
      isDue: true,
      message: 'It is 06:07 in Europe/Paris: the first scheduled run of the day deploys.',
    });
  });

  it('stops a run before 6:00 in Paris', () => {
    expect(verdictAt({ createdAt: '2026-12-01T04:37:00Z' })).toEqual({
      isDue: false,
      message: 'Skipped: it is 05:37 in Europe/Paris, before the deploy of 06:00.',
    });
  });

  it.each([
    ['2026-12-01T04:59:59Z', false],
    ['2026-12-01T05:00:00Z', true],
    ['2026-07-01T03:59:00Z', false],
    ['2026-07-01T04:00:00Z', true],
  ])('goes on from 6:00 in Paris exactly (%s)', (createdAt, isDue) => {
    expect(verdictAt({ createdAt }).isDue).toBe(isDue);
  });

  it.each([
    // The day summer time ends: 4:07 UTC is already 5:07 in Paris, 5:07 UTC is 6:07
    ['2026-10-25T04:07:00Z', false],
    ['2026-10-25T05:07:00Z', true],
    // The day summer time starts: 4:07 UTC is already 6:07 in Paris
    ['2027-03-28T04:07:00Z', true],
  ])('starts at 6:00 in Paris on a day of time change (%s)', (createdAt, isDue) => {
    expect(verdictAt({ createdAt }).isDue).toBe(isDue);
  });

  it('stops once a scheduled run of the day passed', () => {
    const passedRun = scheduledRun({ id: 9, createdAt: '2026-07-01T04:07:00Z' });
    expect(verdictAt({ createdAt: '2026-07-01T04:37:00Z', others: [passedRun] })).toEqual({
      isDue: false,
      message: `Skipped: the scheduled run of 06:07 already went through today: ${RUNS_URL}/9`,
    });
  });

  it('finds the run that passed among failed ones', () => {
    const others = [
      scheduledRun({ id: 9, createdAt: '2026-07-01T05:07:00Z', conclusion: 'failure' }),
      scheduledRun({ id: 8, createdAt: '2026-07-01T04:37:00Z' }),
      scheduledRun({ id: 7, createdAt: '2026-07-01T04:07:00Z', conclusion: 'failure' }),
    ];
    expect(verdictAt({ createdAt: '2026-07-01T05:37:00Z', others }).message).toBe(
      `Skipped: the scheduled run of 06:37 already went through today: ${RUNS_URL}/8`,
    );
  });

  it('tries again after a scheduled run of the day that failed', () => {
    const failedRun = scheduledRun({
      id: 9,
      createdAt: '2026-07-01T04:07:00Z',
      conclusion: 'failure',
    });
    expect(verdictAt({ createdAt: '2026-07-01T04:37:00Z', others: [failedRun] })).toEqual({
      isDue: true,
      message: `It is 06:37 in Europe/Paris, and the scheduled run of 06:07 did not pass (failure): this one tries again. ${RUNS_URL}/9`,
    });
  });

  it('names the status of an earlier run without a conclusion', () => {
    const others = [
      scheduledRun({
        id: 9,
        createdAt: '2026-07-01T04:07:00Z',
        status: 'queued',
        conclusion: null,
      }),
    ];
    expect(verdictAt({ createdAt: '2026-07-01T04:37:00Z', others }).message).toContain(
      'did not pass (queued)',
    );
  });

  it.each([
    ['a run before 6:00', scheduledRun({ id: 9, createdAt: '2026-12-01T04:37:00Z' })],
    ['a run of the day before', scheduledRun({ id: 9, createdAt: '2026-11-30T05:07:00Z' })],
    ['a run created after this one', scheduledRun({ id: 11, createdAt: '2026-12-01T05:37:00Z' })],
    ['this run itself', scheduledRun({ id: 10, createdAt: '2026-12-01T04:37:00Z' })],
  ])('does not count %s that passed', (_, run) => {
    const verdict = getScheduleVerdict({
      eventName: 'schedule',
      runId: 10,
      runs: [run],
      date: new Date('2026-12-01T05:07:00Z'),
    });
    expect(verdict).toEqual({
      isDue: true,
      message: 'It is 06:07 in Europe/Paris: the first scheduled run of the day deploys.',
    });
  });

  it('reads the moment of the run from its creation, whatever the delay of its first job', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T05:30:00Z'));
    expect(verdictAt({ createdAt: '2026-12-01T04:37:00Z' }).isDue).toBe(false);
  });

  it('defaults to now when the run is not in the list', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T05:07:00Z'));
    expect(getScheduleVerdict({ eventName: 'schedule', runId: 10 }).isDue).toBe(true);
    expect(getScheduleVerdict({ eventName: 'schedule', runId: 10, runs: undefined }).isDue).toBe(
      true,
    );
  });

  it.each([
    ['push', 'Skipped: a run started by push does not deploy.'],
    [undefined, 'Skipped: a run started by an unknown event does not deploy.'],
    ['', 'Skipped: a run started by an unknown event does not deploy.'],
  ])('stops a run started by %o', (eventName, message) => {
    expect(getScheduleVerdict({ eventName, runId: 10, runs: [summerRun] })).toEqual({
      isDue: false,
      message,
    });
  });

  it('stops without any parameter', () => {
    expect(getScheduleVerdict().isDue).toBe(false);
  });

  it.each([new Date('not a date'), new Date('1900-01-01T05:07:00Z')])(
    'stops a scheduled run when the offset of Paris is unknown at %o',
    date => {
      expect(getScheduleVerdict({ eventName: 'schedule', runs: [], date })).toEqual({
        isDue: false,
        message: 'Skipped: the offset of Europe/Paris from UTC is unknown at this date.',
      });
    },
  );
});

describe('getScheduleGapWarning', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const thisRun = scheduledRun({
    id: 10,
    createdAt: '2026-10-19T04:07:00Z',
    status: 'in_progress',
    conclusion: null,
  });

  /** The warning of the scheduled run `id` 10 when the run before it was created at `createdAt`. */
  const warningAfter = createdAt =>
    getScheduleGapWarning({
      eventName: 'schedule',
      runId: 10,
      runs: [thisRun, scheduledRun({ id: 9, createdAt })],
    });

  it('stays quiet when the run before is from the same morning', () => {
    expect(warningAfter('2026-10-19T03:37:00Z')).toBeUndefined();
  });

  it.each(['2026-10-18T04:07:00Z', '2026-10-17T16:07:00Z'])(
    'stays quiet up to a gap of 36 hours, delays of GitHub included (%s)',
    createdAt => {
      expect(warningAfter(createdAt)).toBeUndefined();
    },
  );

  it('warns from a gap of more than 36 hours', () => {
    expect(warningAfter('2026-10-17T16:06:59Z')).toContain(
      'for 36 hours, since 2026-10-17T16:06:59.000Z',
    );
  });

  it('names the gap and the last scheduled run after a day without any', () => {
    expect(warningAfter('2026-10-17T06:37:00Z')).toBe(
      `No scheduled run of deploy-production.yml for 45 hours, since 2026-10-17T06:37:00.000Z: neither the Cloudflare trigger nor the crons of GitHub started a run on at least one day, so nothing was deployed then. Check the trigger and its token (docs/deployment.md) and that the workflow is enabled in the Actions tab, and start it by hand if a deploy is missing. ${RUNS_URL}/9`,
    );
  });

  it('stays quiet for the first scheduled run', () => {
    expect(
      getScheduleGapWarning({ eventName: 'schedule', runId: 10, runs: [thisRun] }),
    ).toBeUndefined();
  });

  it('stays quiet for the first run of the trigger, started by hand with the scheduled input', () => {
    const ownRun = triggerRun({ id: 10, createdAt: '2026-10-19T04:05:00Z' });
    const params = { eventName: 'workflow_dispatch', runId: 10, runs: [ownRun] };
    expect(getScheduleGapWarning({ ...params, hasScheduledInput: true })).toBeUndefined();
    expect(getScheduleGapWarning(params)).toMatch(/^No scheduled run .* has ever started/);
  });

  it('counts a run of the trigger as the last scheduled run', () => {
    const runs = [thisRun, triggerRun({ id: 9, createdAt: '2026-10-18T04:05:00Z' })];
    expect(getScheduleGapWarning({ eventName: 'schedule', runId: 10, runs })).toBeUndefined();
  });

  it.each([[[]], [undefined]])(
    'warns a run started by hand when no scheduled run ever started (%o)',
    runs => {
      expect(getScheduleGapWarning({ eventName: 'workflow_dispatch', runId: 20, runs })).toBe(
        'No scheduled run of deploy-production.yml has ever started: check that the Cloudflare trigger is deployed with its token (docs/deployment.md), that the workflow is enabled in the Actions tab, and that its crons are on the default branch.',
      );
    },
  );

  it('measures the gap of a run started by hand from now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T17:00:00Z'));
    const runs = [thisRun];
    expect(getScheduleGapWarning({ eventName: 'workflow_dispatch', runId: 20, runs })).toMatch(
      /^No scheduled run of deploy-production\.yml for 36 hours, since 2026-10-19T04:07:00\.000Z/,
    );
    vi.setSystemTime(new Date('2026-10-20T06:00:00Z'));
    expect(
      getScheduleGapWarning({ eventName: 'workflow_dispatch', runId: 20, runs }),
    ).toBeUndefined();
  });

  it('measures the gap from now for the CI of a push, without a run of its own', () => {
    vi.useFakeTimers();
    const runs = [scheduledRun({ id: 9, createdAt: '2026-10-19T06:37:00Z' })];
    // 36 hours after the last run of the window, the window of the next day has passed empty, even
    // with the delays of GitHub
    vi.setSystemTime(new Date('2026-10-20T18:37:00Z'));
    expect(getScheduleGapWarning({ eventName: 'push', runs })).toBeUndefined();
    vi.setSystemTime(new Date('2026-10-20T18:38:00Z'));
    expect(getScheduleGapWarning({ eventName: 'push', runs })).toMatch(
      /^No scheduled run of deploy-production\.yml for 36 hours, since 2026-10-19T06:37:00\.000Z/,
    );
    expect(getScheduleGapWarning({ eventName: 'push', runs: [] })).toMatch(
      /^No scheduled run of deploy-production\.yml has ever started/,
    );
  });

  it('leaves out the runs created after this one', () => {
    const laterRun = scheduledRun({ id: 11, createdAt: '2026-10-19T04:37:00Z' });
    const runs = [laterRun, thisRun, scheduledRun({ id: 9, createdAt: '2026-10-17T06:37:00Z' })];
    expect(getScheduleGapWarning({ eventName: 'schedule', runId: 10, runs })).toContain(
      'for 45 hours',
    );
  });

  it('warns without any parameter, as for a run started by hand', () => {
    expect(getScheduleGapWarning()).toBe(
      'No scheduled run of deploy-production.yml has ever started: check that the Cloudflare trigger is deployed with its token (docs/deployment.md), that the workflow is enabled in the Actions tab, and that its crons are on the default branch.',
    );
  });
});

describe('getTriggerGapWarning', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A run of the crons on each morning from 2026-10-18 to 2026-10-20, newest first. */
  const cronRuns = [
    scheduledRun({ id: 30, createdAt: '2026-10-20T09:29:00Z' }),
    scheduledRun({ id: 20, createdAt: '2026-10-19T09:29:00Z' }),
    scheduledRun({ id: 10, createdAt: '2026-10-18T09:29:00Z' }),
  ];

  /** The warning of the CI of a push at `now`, after a last run of the trigger at `createdAt`. */
  const warningAt = ({ now, createdAt = '2026-10-19T04:05:00Z' }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    return getTriggerGapWarning({
      runs: mergeScheduledRuns({ cronRuns, manualRuns: [triggerRun({ id: 19, createdAt })] }),
    });
  };

  it.each(['2026-10-20T15:05:00Z', '2026-10-20T16:05:00Z'])(
    'stays quiet up to 36 hours after the last run of the trigger (%s)',
    now => {
      expect(warningAt({ now })).toBeUndefined();
    },
  );

  it('warns from more than 36 hours after the last run of the trigger, while the crons go on', () => {
    expect(warningAt({ now: '2026-10-20T16:05:01Z' })).toBeDefined();
    expect(warningAt({ now: '2026-10-20T17:05:00Z' })).toBe(
      `The Cloudflare trigger has not started a run of deploy-production.yml since 2026-10-19T04:05:00.000Z, while the crons of GitHub started 2 runs, which deploy hours late: renew its dispatch token, read its logs in Cloudflare (docs/deployment.md). ${RUNS_URL}/19`,
    );
  });

  it('stays quiet when no cron started a run since the last one of the trigger', () => {
    // getScheduleGapWarning reports a schedule that stopped altogether
    expect(
      warningAt({ now: '2026-10-22T17:05:00Z', createdAt: '2026-10-20T10:00:00Z' }),
    ).toBeUndefined();
  });

  it('counts a single run of the crons', () => {
    expect(warningAt({ now: '2026-10-21T17:05:00Z', createdAt: '2026-10-20T04:05:00Z' })).toContain(
      'started 1 run, which',
    );
  });

  it('warns a run of the crons when the trigger missed its mornings', () => {
    const thisRun = scheduledRun({ id: 40, createdAt: '2026-10-21T04:07:00Z' });
    const runs = [thisRun, ...cronRuns, triggerRun({ id: 9, createdAt: '2026-10-18T04:05:00Z' })];
    expect(getTriggerGapWarning({ runId: 40, runs })).toMatch(
      /^The Cloudflare trigger has not started a run of deploy-production\.yml since 2026-10-18T04:05:00\.000Z, while the crons of GitHub started 4 runs/,
    );
  });

  it('stays quiet for a run of the trigger itself', () => {
    const thisRun = triggerRun({ id: 40, createdAt: '2026-10-21T04:05:00Z' });
    expect(getTriggerGapWarning({ runId: 40, runs: [thisRun, ...cronRuns] })).toBeUndefined();
  });

  it('leaves out the runs created after this one', () => {
    const runs = [
      triggerRun({ id: 41, createdAt: '2026-10-21T04:35:00Z' }),
      scheduledRun({ id: 40, createdAt: '2026-10-21T04:07:00Z' }),
      ...cronRuns,
      triggerRun({ id: 9, createdAt: '2026-10-18T04:05:00Z' }),
    ];
    expect(getTriggerGapWarning({ runId: 40, runs })).toContain('since 2026-10-18T04:05:00.000Z');
  });

  describe('without any run of the trigger', () => {
    it('stays quiet while the runs of the crons go back 36 hours or less', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-19T21:29:00Z'));
      expect(getTriggerGapWarning({ runs: cronRuns })).toBeUndefined();
      vi.setSystemTime(new Date('2026-10-19T21:29:01Z'));
      expect(getTriggerGapWarning({ runs: cronRuns })).toBeDefined();
    });

    it('warns from the oldest run of the crons', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-20T10:00:00Z'));
      expect(getTriggerGapWarning({ runs: cronRuns })).toBe(
        'The Cloudflare trigger has not started any run of deploy-production.yml since at least 2026-10-18T09:29:00.000Z, while the crons of GitHub started 3 runs, which deploy hours late: deploy the trigger with a valid dispatch token (docs/deployment.md).',
      );
    });
  });

  it.each([[[]], [undefined]])('stays quiet without any scheduled run (%o)', runs => {
    expect(getTriggerGapWarning({ runs })).toBeUndefined();
  });

  it('stays quiet without any parameter', () => {
    expect(getTriggerGapWarning()).toBeUndefined();
  });

  it('stays quiet for an invalid date', () => {
    expect(getTriggerGapWarning({ runs: cronRuns, date: new Date('x') })).toBeUndefined();
  });
});

describe('the scheduled runs started by hand in deploy-production.yml', () => {
  const workflow = readFileSync('.github/workflows/deploy-production.yml', 'utf8');
  const lines = workflow.split('\n');
  /** Escapes the characters of a text that a regular expression reads as syntax. */
  const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  // A dispatch with the input, but not a dry run
  const condition = `inputs.${SCHEDULED_INPUT} && !inputs.dry_run`;

  it('get the title by which the schedule check finds them', () => {
    expect(lines).toContain(
      `run-name: \${{ ${condition} && '${SCHEDULED_RUN_TITLE}' || github.workflow }}`,
    );
  });

  it('come from a boolean input of workflow_dispatch', () => {
    const input = new RegExp(
      String.raw`^ {6}${escapeRegExp(SCHEDULED_INPUT)}:\n(?: {8}.*\n)*? {8}type: boolean\n {8}default: false$`,
      'm',
    );
    expect(workflow).toMatch(input);
  });

  it('tell the schedule check that they are scheduled, under the same condition as the title', () => {
    const env = new RegExp(
      String.raw`run: node scripts/ci/check-deploy-schedule\.mjs\n(?: {8}.*\n)*? {10}SCHEDULED: ` +
        escapeRegExp(`\${{ ${condition} }}`) +
        '$',
      'm',
    );
    expect(workflow).toMatch(env);
  });
});

describe('the crons of deploy-production.yml', () => {
  const workflow = readFileSync('.github/workflows/deploy-production.yml', 'utf8');
  const crons = [...workflow.matchAll(/^\s*- cron: '([^']+)'$/gm)].map(match => match[1]);

  /**
   * The moments of the day, in minutes after midnight UTC, when a daily cron written
   * `<minutes, comma-separated> <hour or first-last hours> * * *` fires.
   */
  const getFireMinutes = cron => {
    const [minutes, hours] = cron.split(' ');
    const [firstHour, lastHour = firstHour] = hours.split('-').map(Number);
    return Array.from(
      { length: lastHour - firstHour + 1 },
      (_, index) => firstHour + index,
    ).flatMap(hour => minutes.split(',').map(minute => hour * MINUTES_PER_HOUR + Number(minute)));
  };
  const fireMinutes = crons.flatMap(getFireMinutes).sort((first, second) => first - second);

  it('fire every day, in the shape that the other tests read', () => {
    expect(crons.length).toBeGreaterThan(0);
    for (const cron of crons) expect(cron).toMatch(/^\d+(,\d+)* \d+(-\d+)? \* \* \*$/);
  });

  it('fire off the hour, so that GitHub drops fewer of their runs', () => {
    for (const minutes of fireMinutes) expect(minutes % MINUTES_PER_HOUR).not.toBe(0);
  });

  it.each([
    ['summer', 2 * MINUTES_PER_HOUR],
    ['winter', MINUTES_PER_HOUR],
  ])('start at least two runs from 6:00 in Paris in %s', (_, offsetMinutes) => {
    const dueRuns = fireMinutes.filter(minutes => {
      const localMinutes = minutes + offsetMinutes;
      return localMinutes >= DEPLOY_START_MINUTES;
    });
    expect(dueRuns.length).toBeGreaterThanOrEqual(2);
  });

  it('start fewer runs a day than the schedule check reads', () => {
    expect(fireMinutes.length).toBeLessThan(DEPLOY_RUNS_PAGE_SIZE);
  });

  it('leave a gap over the warning threshold only after a day without any run', () => {
    const windowMinutes = fireMinutes.at(-1) - fireMinutes[0];
    const thresholdMinutes = SCHEDULE_GAP_WARNING_HOURS * MINUTES_PER_HOUR;
    // From the first run of a day to the last run of the next
    expect(MINUTES_PER_DAY + windowMinutes).toBeLessThan(thresholdMinutes);
    // From the last run of a day to the first run two days later
    expect(2 * MINUTES_PER_DAY - windowMinutes).toBeGreaterThan(thresholdMinutes);
  });
});
