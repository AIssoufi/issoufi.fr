import { readFileSync } from 'node:fs';

import {
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
  MS_PER_MINUTE,
  SCHEDULE_GAP_WARNING_HOURS,
} from '../ci/constants.mjs';
import { getTriggerVerdict, triggerDailyDeploy } from './utils.mjs';

const DISPATCH_URL =
  'https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows/deploy-production.yml/dispatches';
const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

describe('getTriggerVerdict', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['summer', '2026-07-01T04:05:00Z', '06:05'],
    ['summer', '2026-07-01T04:35:00Z', '06:35'],
    ['winter', '2026-12-01T05:05:00Z', '06:05'],
    ['winter', '2026-12-01T05:35:00Z', '06:35'],
  ])('starts the daily deploy in %s at %s', (_, date, time) => {
    expect(getTriggerVerdict({ date: new Date(date) })).toEqual({
      isDue: true,
      message: `It is ${time} in Europe/Paris: the trigger starts the daily deploy.`,
    });
  });

  it.each([
    ['2026-12-01T04:35:00Z', '05:35'],
    ['2026-07-01T05:05:00Z', '07:05'],
  ])('starts nothing outside the window, at %s', (date, time) => {
    expect(getTriggerVerdict({ date: new Date(date) })).toEqual({
      isDue: false,
      message: `Skipped: it is ${time} in Europe/Paris, outside the window of the daily deploy, from 06:00 to 07:00.`,
    });
  });

  it.each([
    ['2026-12-01T04:59:59Z', false],
    ['2026-12-01T05:00:00Z', true],
    ['2026-12-01T05:59:59Z', true],
    ['2026-12-01T06:00:00Z', false],
    ['2026-07-01T03:59:59Z', false],
    ['2026-07-01T04:00:00Z', true],
    ['2026-07-01T04:59:59Z', true],
    ['2026-07-01T05:00:00Z', false],
  ])('keeps to the window from 6:00 to 7:00 in Paris exactly (%s)', (date, isDue) => {
    expect(getTriggerVerdict({ date: new Date(date) }).isDue).toBe(isDue);
  });

  it('defaults to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T05:05:00Z'));
    expect(getTriggerVerdict().isDue).toBe(true);
    vi.setSystemTime(new Date('2026-12-01T04:05:00Z'));
    expect(getTriggerVerdict({}).isDue).toBe(false);
  });

  it.each([new Date('not a date'), new Date(Number.NaN), '2026-07-01T04:05:00Z', 0, null])(
    'starts nothing for the date %o',
    date => {
      expect(getTriggerVerdict({ date })).toEqual({
        isDue: false,
        message: 'Skipped: the moment of the cron is not a valid date.',
      });
    },
  );

  it('starts nothing when the offset of Paris is unknown, as for its local mean time', () => {
    expect(getTriggerVerdict({ date: new Date('1900-01-01T05:05:00Z') })).toEqual({
      isDue: false,
      message: 'Skipped: the offset of Europe/Paris from UTC is unknown at this date.',
    });
  });
});

describe('triggerDailyDeploy', () => {
  /** Answers every request with the given status and JSON body. */
  const stubFetch = ({ status = 200, body = { workflow_run_id: 123, html_url: RUN_URL } } = {}) => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  beforeEach(() => {
    // The Worker has no environment variables: what it sends must not come from them
    vi.stubEnv('GITHUB_API_URL', 'https://wrong.example.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'wrong/repository');
    vi.stubEnv('GITHUB_TOKEN', 'wrong');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('starts deploy-production.yml on develop as a scheduled run, with the token', async () => {
    const fetch = stubFetch();
    await expect(
      triggerDailyDeploy({ date: new Date('2026-07-01T04:05:00Z'), token: 'token' }),
    ).resolves.toBe(`It is 06:05 in Europe/Paris: the trigger starts the daily deploy. ${RUN_URL}`);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(DISPATCH_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer token',
      'User-Agent': 'issoufi.fr',
    });
    expect(JSON.parse(init.body)).toEqual({
      ref: 'develop',
      inputs: { scheduled: 'true' },
      return_run_details: true,
    });
  });

  it('starts nothing outside the window, even without a token', async () => {
    const fetch = stubFetch();
    await expect(triggerDailyDeploy({ date: new Date('2026-12-01T04:05:00Z') })).resolves.toBe(
      'Skipped: it is 05:05 in Europe/Paris, outside the window of the daily deploy, from 06:00 to 07:00.',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([undefined, null, '', 42, { value: 'token' }])(
    'throws without asking GitHub when the token is %o',
    async token => {
      const fetch = stubFetch();
      await expect(
        triggerDailyDeploy({ date: new Date('2026-12-01T05:05:00Z'), token }),
      ).rejects.toThrow(
        'The GITHUB_DISPATCH_TOKEN secret of the Worker is not set, so only the crons of GitHub start the daily deploy: store the token as docs/deployment.md says.',
      );
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('throws with the answer of GitHub when it refuses to start the run', async () => {
    stubFetch({ status: 401, body: { message: 'Bad credentials' } });
    await expect(
      triggerDailyDeploy({ date: new Date('2026-12-01T05:35:00Z'), token: 'expired' }),
    ).rejects.toThrow(`The GitHub API answered 401 to ${DISPATCH_URL}: Bad credentials`);
  });

  it('starts nothing without any parameter outside the window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
    const fetch = stubFetch();
    await expect(triggerDailyDeploy()).resolves.toMatch(/^Skipped: it is 13:00 in Europe\/Paris/);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('the crons of wrangler.jsonc', () => {
  const config = readFileSync('scripts/deploy-trigger/wrangler.jsonc', 'utf8');
  const cronList = /"crons":\s*\[([^\]]*)\]/.exec(config)?.[1] ?? '';
  const crons = [...cronList.matchAll(/"([^"]+)"/g)].map(match => match[1]);

  /**
   * The moments of a day, in minutes after midnight UTC, when a daily cron written
   * `<minutes> <hours> * * *` fires, each field a comma-separated list.
   */
  const getFireMinutes = cron => {
    const [minutes, hours] = cron.split(' ');
    return hours
      .split(',')
      .flatMap(hour =>
        minutes.split(',').map(minute => Number(hour) * MINUTES_PER_HOUR + Number(minute)),
      );
  };
  const fireMinutes = crons.flatMap(getFireMinutes).sort((first, second) => first - second);

  /** The moments of a UTC day, `YYYY-MM-DD`, when the crons fire and the Worker starts a run. */
  const getDueMoments = day =>
    fireMinutes
      .map(minutes => new Date(Date.parse(`${day}T00:00:00Z`) + minutes * MS_PER_MINUTE))
      .filter(date => getTriggerVerdict({ date }).isDue);

  it('fire every day, in the shape that the other tests read', () => {
    expect(crons.length).toBeGreaterThan(0);
    for (const cron of crons) expect(cron).toMatch(/^\d+(,\d+)* \d+(,\d+)* \* \* \*$/);
  });

  it.each([
    ['in summer', '2026-07-01', ['04:05', '04:35']],
    ['in winter', '2026-12-01', ['05:05', '05:35']],
    ['the day summer time ends', '2026-10-25', ['05:05', '05:35']],
    ['the day summer time starts', '2027-03-28', ['04:05', '04:35']],
  ])('start two runs between 6:00 and 7:00 in Paris %s', (_, day, utcTimes) => {
    const dueMoments = getDueMoments(day);
    expect(dueMoments.map(date => date.toISOString().slice(11, 16))).toEqual(utcTimes);
    for (const date of dueMoments) {
      expect(getTriggerVerdict({ date }).message).toMatch(/^It is 06:[0-5]\d in Europe\/Paris/);
    }
  });

  it('leave, with the crons of deploy-production.yml, a gap over the warning threshold only after a day without any run', () => {
    const workflow = readFileSync('.github/workflows/deploy-production.yml', 'utf8');
    const [, cronMinuteList, firstHour, lastHour] =
      /^\s*- cron: '([\d,]+) (\d+)-(\d+) \* \* \*'$/m.exec(workflow);
    const cronMinutes = cronMinuteList.split(',').map(Number);
    const triggerMinutes = ['2026-07-01', '2026-12-01'].flatMap(day =>
      getDueMoments(day).map(date => date.getUTCHours() * MINUTES_PER_HOUR + date.getUTCMinutes()),
    );
    const firstMinutes = Math.min(
      Number(firstHour) * MINUTES_PER_HOUR + Math.min(...cronMinutes),
      ...triggerMinutes,
    );
    const lastMinutes = Math.max(
      Number(lastHour) * MINUTES_PER_HOUR + Math.max(...cronMinutes),
      ...triggerMinutes,
    );
    const windowMinutes = lastMinutes - firstMinutes;
    const thresholdMinutes = SCHEDULE_GAP_WARNING_HOURS * MINUTES_PER_HOUR;
    // From the first run of a day to the last run of the next
    expect(MINUTES_PER_DAY + windowMinutes).toBeLessThan(thresholdMinutes);
    // From the last run of a day to the first run two days later
    expect(2 * MINUTES_PER_DAY - windowMinutes).toBeGreaterThan(thresholdMinutes);
  });
});
