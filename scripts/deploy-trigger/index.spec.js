import worker from './index.mjs';

const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

describe('the scheduled handler of the deploy trigger', () => {
  let log;

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Answers every request with the run that GitHub started. */
  const stubFetch = () => {
    const fetch = vi.fn(
      async () => new Response(JSON.stringify({ workflow_run_id: 123, html_url: RUN_URL })),
    );
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  it('starts the daily deploy with the token of its secret when the cron fires in the window', async () => {
    const fetch = stubFetch();
    await worker.scheduled(
      { scheduledTime: Date.parse('2026-12-01T05:05:00Z') },
      { GITHUB_DISPATCH_TOKEN: 'token' },
    );
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
    expect(log).toHaveBeenCalledWith(
      `It is 06:05 in Europe/Paris: the trigger starts the daily deploy. ${RUN_URL}`,
    );
  });

  it('logs why it starts nothing outside the window', async () => {
    const fetch = stubFetch();
    await worker.scheduled(
      { scheduledTime: Date.parse('2026-12-01T04:35:00Z') },
      { GITHUB_DISPATCH_TOKEN: 'token' },
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      'Skipped: it is 05:35 in Europe/Paris, outside the window of the daily deploy, from 06:00 to 07:00.',
    );
  });

  it('fails the run of the cron without the secret, so that Cloudflare logs it', async () => {
    const fetch = stubFetch();
    await expect(
      worker.scheduled({ scheduledTime: Date.parse('2026-07-01T04:35:00Z') }, {}),
    ).rejects.toThrow('The GITHUB_DISPATCH_TOKEN secret of the Worker is not set');
    await expect(
      worker.scheduled({ scheduledTime: Date.parse('2026-07-01T04:35:00Z') }),
    ).rejects.toThrow('The GITHUB_DISPATCH_TOKEN secret of the Worker is not set');
    expect(fetch).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it.each([[undefined], [{}], [{ scheduledTime: 'soon' }]])(
    'starts nothing when the event %o gives no moment',
    async controller => {
      const fetch = stubFetch();
      await worker.scheduled(controller, { GITHUB_DISPATCH_TOKEN: 'token' });
      expect(fetch).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Skipped: the moment of the cron is not a valid date.');
    },
  );
});
