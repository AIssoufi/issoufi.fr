import { readRun } from './run-reading.mjs';
import { waitForLatestRun, waitForLatestRunToFinish, waitForRun } from './run-waiting.mjs';
import { CREATED_AT, SHA, stubGitHub, stubGitHubEnv } from './testUtils.js';

const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

/** A run of the REST API answer, as GitHub writes it. */
const apiRun = (fields = {}) => ({
  id: 123,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: CREATED_AT,
  html_url: RUN_URL,
  ...fields,
});

/** A run as readLatestRun returns it. */
const run = (fields = {}) => ({
  id: 123,
  sha: SHA,
  status: 'completed',
  conclusion: 'success',
  createdAt: new Date(CREATED_AT),
  url: RUN_URL,
  ...fields,
});

/** Route of the list of the runs of the CI. */
const CI_RUNS_ROUTE = 'GET /actions/workflows/ci.yml/runs';

/** Route of the run 123. */
const RUN_ROUTE = 'GET /actions/runs/123';

describe('the API calls on runs', () => {
  const RUNS_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions';

  /** Answers the reads of the run 123 with the given JSON bodies in turn, then the last again. */
  const stubRun = (...bodies) => stubGitHub({ [RUN_ROUTE]: bodies.map(body => ({ body })) });

  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('waitForLatestRun', () => {
    const filters = { branch: 'release', event: 'pull_request', sha: SHA };

    /** Answers the lists of the runs of the CI with the given JSON bodies in turn. */
    const stubRunLists = (...bodies) =>
      stubGitHub({ [CI_RUNS_ROUTE]: bodies.map(body => ({ body })) });

    it('looks for the run until GitHub created it', async () => {
      const requests = stubRunLists({ workflow_runs: [] }, { workflow_runs: [apiRun()] });
      await expect(waitForLatestRun({ ...filters, delayMs: 0 })).resolves.toEqual(run());
      expect(requests).toHaveLength(2);
      expect(requests[0].url).toBe(
        `${RUNS_API_URL}/workflows/ci.yml/runs?branch=release&event=pull_request&head_sha=${SHA}&per_page=1`,
      );
    });

    it('resolves to undefined when the run never appears, and asks nothing for no attempt', async () => {
      const requests = stubRunLists({ workflow_runs: [] });
      await expect(
        waitForLatestRun({ ...filters, attempts: 2, delayMs: 0 }),
      ).resolves.toBeUndefined();
      await expect(
        waitForLatestRun({ ...filters, attempts: 0, delayMs: 0 }),
      ).resolves.toBeUndefined();
      expect(requests).toHaveLength(2);
    });

    it('waits between two lookups', async () => {
      vi.useFakeTimers();
      const requests = stubRunLists({ workflow_runs: [] }, { workflow_runs: [apiRun()] });
      const promise = waitForLatestRun(filters);
      await vi.advanceTimersByTimeAsync(9_999);
      expect(requests).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toEqual(run());
    });

    it('throws when a lookup fails', async () => {
      stubGitHub({ [CI_RUNS_ROUTE]: [{ status: 500, body: {} }] });
      await expect(waitForLatestRun({ ...filters, delayMs: 0 })).rejects.toThrow(
        'The GitHub API answered 500',
      );
    });
  });

  describe('waitForRun', () => {
    /** Answers the reads of the run 123 with the given answers in turn, then the last again. */
    const stubReads = (...answers) => stubGitHub({ [RUN_ROUTE]: answers });

    it('reads the run until it is completed', async () => {
      const requests = stubRun(
        apiRun({ status: 'queued', conclusion: null }),
        apiRun({ status: 'in_progress', conclusion: null }),
        apiRun({ conclusion: 'failure' }),
      );
      await expect(waitForRun({ runId: 123, delayMs: 0 })).resolves.toEqual(
        run({ conclusion: 'failure' }),
      );
      expect(requests).toHaveLength(3);
    });

    it('waits for an approved run that still reads as held to run again', async () => {
      const requests = stubRun(
        apiRun({ conclusion: 'action_required' }),
        apiRun({ status: 'queued', conclusion: null }),
        apiRun(),
      );
      await expect(waitForRun({ runId: 123, delayMs: 0 })).resolves.toEqual(run());
      expect(requests).toHaveLength(3);
    });

    it('gives a run that stays held as last read', async () => {
      stubRun(apiRun({ conclusion: 'action_required' }));
      await expect(waitForRun({ runId: 123, attempts: 2, delayMs: 0 })).resolves.toEqual(
        run({ conclusion: 'action_required' }),
      );
    });

    it('gives the run as last read when it is still going after every attempt', async () => {
      const requests = stubRun(apiRun({ status: 'in_progress', conclusion: null }));
      await expect(waitForRun({ runId: 123, attempts: 2, delayMs: 0 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
      expect(requests).toHaveLength(2);
    });

    it('resolves to undefined when the run can never be read', async () => {
      stubRun({});
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toBeUndefined();
    });

    it('reads the run once for a single attempt, and never for none', async () => {
      const requests = stubRun(apiRun({ status: 'in_progress', conclusion: null }));
      await waitForRun({ runId: 123, attempts: 1, delayMs: 0 });
      expect(requests).toHaveLength(1);
      await expect(waitForRun({ runId: 123, attempts: 0, delayMs: 0 })).resolves.toBeUndefined();
      expect(requests).toHaveLength(1);
    });

    it('waits between two reads', async () => {
      vi.useFakeTimers();
      const requests = stubRun(apiRun({ status: 'queued', conclusion: null }), apiRun());
      const promise = waitForRun({ runId: 123 });
      await vi.advanceTimersByTimeAsync(29_999);
      expect(requests).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toEqual(run());
      expect(requests).toHaveLength(2);
    });

    it('tries a failed read again', async () => {
      const requests = stubReads(
        { status: 502, body: {} },
        { body: apiRun({ status: 'in_progress', conclusion: null }) },
        { status: 500, body: {} },
        { body: apiRun() },
      );
      await expect(waitForRun({ runId: 123, delayMs: 0 })).resolves.toEqual(run());
      expect(requests).toHaveLength(4);
    });

    it('gives the run as last read when the last reads failed', async () => {
      stubReads(
        { body: apiRun({ status: 'in_progress', conclusion: null }) },
        { status: 500, body: {} },
      );
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
    });

    it('resolves to undefined when the only answer was not a run and the other reads failed', async () => {
      stubReads({ status: 500, body: {} }, { body: {} }, { status: 500, body: {} });
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toBeUndefined();
    });

    it('throws the error of the last read when every read failed', async () => {
      const requests = stubReads({ status: 500, body: {} });
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).rejects.toThrow(
        'The GitHub API answered 500',
      );
      expect(requests).toHaveLength(3);
    });

    it.each([undefined, 0, -1, 1.5, Number.NaN, '123'])(
      'throws at once without asking the API for the run %o',
      async runId => {
        const requests = stubRun(apiRun());
        await expect(waitForRun({ runId, delayMs: 0 })).rejects.toThrow('Invalid workflow run');
        expect(requests).toEqual([]);
      },
    );
  });

  describe('waitForLatestRunToFinish', () => {
    const filters = { branch: 'develop', event: null, sha: SHA };
    const LIST_URL = `${RUNS_API_URL}/workflows/ci.yml/runs?branch=develop&head_sha=${SHA}&per_page=1`;
    const RUN_API_URL = `${RUNS_API_URL}/runs/123`;
    const runningApiRun = (status = 'in_progress') => apiRun({ status, conclusion: null });

    /** Answers the list of the runs with the given answer, and the reads of the run 123 in turn. */
    const stubWait = ({ list, reads = [] }) =>
      stubGitHub({ [CI_RUNS_ROUTE]: [list], [RUN_ROUTE]: reads });

    /** Lists the given run as the latest one, and answers its reads with the given runs in turn. */
    const stubListedRun = ({ listedRun, readRuns = [] }) =>
      stubWait({
        list: { body: { workflow_runs: [listedRun] } },
        reads: readRuns.map(body => ({ body })),
      });

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      ['passed', apiRun()],
      ['failed', apiRun({ conclusion: 'failure' })],
      ['waits for approval', apiRun({ conclusion: 'action_required' })],
    ])('gives a run that %s at once', async (_, listedRun) => {
      const requests = stubListedRun({ listedRun });
      await expect(waitForLatestRunToFinish(filters)).resolves.toEqual(readRun(listedRun));
      expect(requests.map(({ url }) => url)).toEqual([LIST_URL]);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('resolves to undefined at once when the commit has no run', async () => {
      const requests = stubWait({ list: { body: { workflow_runs: [] } } });
      await expect(waitForLatestRunToFinish(filters)).resolves.toBeUndefined();
      expect(requests).toHaveLength(1);
    });

    it.each(['queued', 'waiting', 'in_progress'])(
      'waits for a run that is %s until it finishes',
      async status => {
        const requests = stubListedRun({
          listedRun: runningApiRun(status),
          readRuns: [runningApiRun(), apiRun({ conclusion: 'failure' })],
        });
        await expect(
          waitForLatestRunToFinish({ ...filters, runWait: { delayMs: 0 } }),
        ).resolves.toEqual(run({ conclusion: 'failure' }));
        expect(requests.map(({ url }) => url)).toEqual([LIST_URL, RUN_API_URL, RUN_API_URL]);
        expect(console.log).toHaveBeenCalledWith(
          `Waiting for the run still going on 58ff9ea (${status}): ${RUN_URL}`,
        );
      },
    );

    it('gives the run as last read when it is still going after the wait', async () => {
      const requests = stubListedRun({
        listedRun: runningApiRun('queued'),
        readRuns: [runningApiRun()],
      });
      await expect(
        waitForLatestRunToFinish({ ...filters, runWait: { attempts: 2, delayMs: 0 } }),
      ).resolves.toEqual(run({ status: 'in_progress', conclusion: null }));
      expect(requests).toHaveLength(3);
    });

    it('gives the run as listed when no answer of the wait is a run', async () => {
      stubListedRun({ listedRun: runningApiRun(), readRuns: [{ message: 'odd' }] });
      await expect(
        waitForLatestRunToFinish({ ...filters, runWait: { attempts: 2, delayMs: 0 } }),
      ).resolves.toEqual(run({ status: 'in_progress', conclusion: null }));
    });

    it('gives the run as listed when the wait has no attempt', async () => {
      const requests = stubListedRun({ listedRun: runningApiRun() });
      await expect(
        waitForLatestRunToFinish({ ...filters, runWait: { attempts: 0 } }),
      ).resolves.toEqual(run({ status: 'in_progress', conclusion: null }));
      expect(requests).toHaveLength(1);
    });

    it('waits 30 seconds between two reads by default', async () => {
      vi.useFakeTimers();
      const requests = stubListedRun({
        listedRun: runningApiRun(),
        readRuns: [runningApiRun(), apiRun()],
      });
      const promise = waitForLatestRunToFinish(filters);
      await vi.advanceTimersByTimeAsync(29_999);
      expect(requests).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toEqual(run());
      expect(requests).toHaveLength(3);
    });

    it('reads the run of the wait from the same API, repository and token', async () => {
      const requests = stubGitHub({
        'GET /api/v3/repos/owner/repo/actions/workflows/ci.yml/runs': [
          { body: { workflow_runs: [runningApiRun()] } },
        ],
        'GET /api/v3/repos/owner/repo/actions/runs/123': [{ body: apiRun() }],
      });
      await waitForLatestRunToFinish({
        ...filters,
        apiUrl: 'https://example.com/api/v3',
        repository: 'owner/repo',
        token: 'other',
        runWait: { delayMs: 0 },
      });
      const [{ url: listUrl }, { url: runUrl, headers }] = requests;
      expect(listUrl).toMatch(/^https:\/\/example\.com\/api\/v3\/repos\/owner\/repo\/actions\//);
      expect(runUrl).toBe('https://example.com/api/v3/repos/owner/repo/actions/runs/123');
      expect(headers.Authorization).toBe('Bearer other');
    });

    it('throws when the runs cannot be listed', async () => {
      stubWait({ list: { status: 500, body: {} } });
      await expect(waitForLatestRunToFinish(filters)).rejects.toThrow(
        'The GitHub API answered 500',
      );
    });

    it('throws when every read of the wait failed', async () => {
      stubWait({
        list: { body: { workflow_runs: [runningApiRun()] } },
        reads: [{ status: 502, body: {} }],
      });
      await expect(
        waitForLatestRunToFinish({ ...filters, runWait: { attempts: 2, delayMs: 0 } }),
      ).rejects.toThrow('The GitHub API answered 502');
    });

    it.each([undefined, '', '58ff9ea'])(
      'throws without asking the API for the commit %o',
      async sha => {
        const requests = stubListedRun({ listedRun: apiRun() });
        await expect(waitForLatestRunToFinish({ ...filters, sha })).rejects.toThrow(
          'Cannot list the workflow runs',
        );
        expect(requests).toEqual([]);
      },
    );
  });
});
