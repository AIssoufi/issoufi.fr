import {
  describeRunOutcome,
  dispatchWorkflow,
  fetchLatestRun,
  fetchRun,
  getCiVerdict,
  getWorkflowRunsUrl,
  isCommitSha,
  readDispatchedRun,
  readLatestRun,
  readRun,
  shortenSha,
  waitForRun,
} from './workflow-runs.mjs';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

/** A run of the REST API answer, as GitHub writes it. */
const apiRun = (fields = {}) => ({
  id: 123,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  html_url: RUN_URL,
  ...fields,
});

/** A run as readLatestRun returns it. */
const run = (fields = {}) => ({
  sha: SHA,
  status: 'completed',
  conclusion: 'success',
  url: RUN_URL,
  ...fields,
});

describe('isCommitSha', () => {
  it('accepts a full commit SHA', () => {
    expect(isCommitSha(SHA)).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    '58ff9ea',
    SHA.toUpperCase(),
    `${SHA}0`,
    ` ${SHA}`,
    'origin/develop',
    'g'.repeat(40),
    42,
  ])('rejects %o', value => {
    expect(isCommitSha(value)).toBe(false);
  });
});

describe('shortenSha', () => {
  it('keeps the first 7 digits', () => {
    expect(shortenSha(SHA)).toBe('58ff9ea');
  });

  it('keeps a shorter text whole', () => {
    expect(shortenSha('58ff')).toBe('58ff');
  });

  it.each([undefined, null, 42])('returns an empty string for %o', value => {
    expect(shortenSha(value)).toBe('');
  });
});

describe('getWorkflowRunsUrl', () => {
  it('filters the runs of the CI on a branch, a push and a commit', () => {
    expect(
      getWorkflowRunsUrl({ repository: 'AIssoufi/issoufi.fr', branch: 'develop', sha: SHA }),
    ).toBe(
      `https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows/ci.yml/runs?branch=develop&event=push&head_sha=${SHA}&per_page=1`,
    );
  });

  it('takes another API, workflow and event', () => {
    expect(
      getWorkflowRunsUrl({
        apiUrl: 'https://example.com/api/v3/',
        repository: 'owner/repo',
        workflow: 'rebuild.yml',
        branch: 'main',
        event: 'schedule',
        sha: SHA,
      }),
    ).toBe(
      `https://example.com/api/v3/repos/owner/repo/actions/workflows/rebuild.yml/runs?branch=main&event=schedule&head_sha=${SHA}&per_page=1`,
    );
  });

  it('filters on no event for a null event', () => {
    expect(
      getWorkflowRunsUrl({ repository: 'owner/repo', branch: 'develop', event: null, sha: SHA }),
    ).toBe(
      `https://api.github.com/repos/owner/repo/actions/workflows/ci.yml/runs?branch=develop&head_sha=${SHA}&per_page=1`,
    );
  });

  it('encodes the branch in the query', () => {
    expect(
      getWorkflowRunsUrl({ repository: 'owner/repo', branch: 'feature/a&b', sha: SHA }),
    ).toContain('branch=feature%2Fa%26b&');
  });

  it.each([
    { repository: undefined },
    { repository: '' },
    { repository: 'issoufi.fr' },
    { repository: 'owner/repo/extra' },
    { repository: '../owner/repo' },
    { repository: 42 },
    { branch: undefined },
    { branch: '' },
    { sha: undefined },
    { sha: '58ff9ea' },
    { apiUrl: 'not a url' },
    { apiUrl: '' },
  ])('returns undefined for %o', fields => {
    const params = { repository: 'owner/repo', branch: 'develop', sha: SHA, ...fields };
    expect(getWorkflowRunsUrl(params)).toBeUndefined();
  });
});

describe('readRun', () => {
  it('reads a run of the API', () => {
    expect(readRun(apiRun())).toEqual(run());
  });

  it('reads a run that has not finished, without a conclusion', () => {
    expect(readRun(apiRun({ status: 'queued', conclusion: null }))).toEqual(
      run({ status: 'queued', conclusion: null }),
    );
  });

  it.each([
    undefined,
    null,
    'run',
    42,
    [],
    {},
    apiRun({ head_sha: undefined }),
    apiRun({ head_sha: '58ff9ea' }),
    apiRun({ status: undefined }),
    apiRun({ conclusion: undefined }),
    apiRun({ html_url: null }),
  ])('returns undefined for %o', value => {
    expect(readRun(value)).toBeUndefined();
  });
});

describe('describeRunOutcome', () => {
  it('says that a completed run passed', () => {
    expect(describeRunOutcome(run())).toEqual({
      isSuccess: true,
      outcome: `passed on 58ff9ea: ${RUN_URL}`,
    });
  });

  it.each(['queued', 'in_progress', 'waiting'])('says that a %s run is still running', status => {
    expect(describeRunOutcome(run({ status, conclusion: null }))).toEqual({
      isSuccess: false,
      outcome: `is still running on 58ff9ea (${status}): ${RUN_URL}`,
    });
  });

  it.each(['failure', 'cancelled', 'timed_out', 'skipped', 'action_required'])(
    'says that a run ended with %s did not pass',
    conclusion => {
      expect(describeRunOutcome(run({ conclusion }))).toEqual({
        isSuccess: false,
        outcome: `did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('names a missing conclusion', () => {
    expect(describeRunOutcome(run({ conclusion: null })).outcome).toBe(
      `did not pass on 58ff9ea (no conclusion): ${RUN_URL}`,
    );
  });

  it.each([undefined, null])('says that a missing run (%o) could not be read', missingRun => {
    expect(describeRunOutcome(missingRun)).toEqual({
      isSuccess: false,
      outcome: 'could not be read.',
    });
  });
});

describe('readDispatchedRun', () => {
  const RUN_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions/runs/123';

  it('reads the run that the dispatch started', () => {
    expect(
      readDispatchedRun({ workflow_run_id: 123, run_url: RUN_API_URL, html_url: RUN_URL }),
    ).toEqual({ id: 123, url: RUN_URL });
  });

  it.each([
    undefined,
    null,
    '',
    {},
    { workflow_run_id: 123 },
    { html_url: RUN_URL },
    { workflow_run_id: 0, html_url: RUN_URL },
    { workflow_run_id: -1, html_url: RUN_URL },
    { workflow_run_id: 1.5, html_url: RUN_URL },
    { workflow_run_id: Number.NaN, html_url: RUN_URL },
    { workflow_run_id: '123', html_url: RUN_URL },
    { workflow_run_id: 123, html_url: '' },
    { workflow_run_id: 123, html_url: 42 },
  ])('returns undefined for %o', response => {
    expect(readDispatchedRun(response)).toBeUndefined();
  });
});

describe('readLatestRun', () => {
  it('reads the first run of the list', () => {
    const response = { total_count: 2, workflow_runs: [apiRun(), apiRun({ id: 122 })] };
    expect(readLatestRun(response)).toEqual(run());
  });

  it('reads a run that has not finished, without a conclusion', () => {
    const response = { workflow_runs: [apiRun({ status: 'in_progress', conclusion: null })] };
    expect(readLatestRun(response)).toEqual(run({ status: 'in_progress', conclusion: null }));
  });

  it.each([
    undefined,
    null,
    'runs',
    {},
    { workflow_runs: null },
    { workflow_runs: {} },
    { workflow_runs: [] },
    { workflow_runs: [null] },
    { workflow_runs: ['run'] },
    { workflow_runs: [apiRun({ head_sha: undefined })] },
    { workflow_runs: [apiRun({ head_sha: '58ff9ea' })] },
    { workflow_runs: [apiRun({ status: undefined })] },
    { workflow_runs: [apiRun({ status: 1 })] },
    { workflow_runs: [apiRun({ conclusion: undefined })] },
    { workflow_runs: [apiRun({ conclusion: false })] },
    { workflow_runs: [apiRun({ html_url: undefined })] },
  ])('returns undefined for %o', response => {
    expect(readLatestRun(response)).toBeUndefined();
  });
});

describe('getCiVerdict', () => {
  it('lets a commit whose run passed through', () => {
    expect(getCiVerdict({ run: run(), sha: SHA, branch: 'develop' })).toEqual({
      isTested: true,
      message: `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('names develop by default', () => {
    expect(getCiVerdict({ run: run(), sha: SHA }).message).toBe(
      `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    );
  });

  it.each(['queued', 'in_progress', 'waiting'])('stops while the run is %s', status => {
    expect(getCiVerdict({ run: run({ status, conclusion: null }), sha: SHA })).toEqual({
      isTested: false,
      message: `Nothing deployed: the CI of develop is still running on 58ff9ea (${status}): ${RUN_URL}`,
    });
  });

  it.each(['failure', 'cancelled', 'timed_out', 'skipped', 'action_required'])(
    'stops when the run ended with %s',
    conclusion => {
      expect(getCiVerdict({ run: run({ conclusion }), sha: SHA })).toEqual({
        isTested: false,
        message: `Nothing deployed: the CI of develop did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('stops when a completed run has no conclusion', () => {
    expect(getCiVerdict({ run: run({ conclusion: null }), sha: SHA }).message).toBe(
      `Nothing deployed: the CI of develop did not pass on 58ff9ea (no conclusion): ${RUN_URL}`,
    );
  });

  it.each([undefined, null])('stops when the commit has no run (%o)', missingRun => {
    expect(getCiVerdict({ run: missingRun, sha: SHA })).toEqual({
      isTested: false,
      message: 'Nothing deployed: the CI has not run on develop for 58ff9ea.',
    });
  });

  it('stops when the run tested another commit', () => {
    expect(getCiVerdict({ run: run({ sha: OTHER_SHA }), sha: SHA }).isTested).toBe(false);
  });

  it.each([undefined, '', '58ff9ea'])('stops for the commit %o', sha => {
    const verdict = getCiVerdict({ run: run(), sha });
    expect(verdict.isTested).toBe(false);
    expect(verdict.message).toMatch(/^Nothing deployed: the CI has not run on develop for /);
  });

  it('names a missing commit', () => {
    expect(getCiVerdict({ run: run() }).message).toBe(
      'Nothing deployed: the CI has not run on develop for this commit.',
    );
  });
});

describe('fetchLatestRun', () => {
  /** Answers every request with the given status and JSON body. */
  const stubFetch = ({ status = 200, body = { workflow_runs: [apiRun()] } } = {}) => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  beforeEach(() => {
    vi.stubEnv('GITHUB_API_URL', 'https://api.github.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'AIssoufi/issoufi.fr');
    vi.stubEnv('GITHUB_TOKEN', 'token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('asks the API of GitHub Actions for the latest run, with the token', async () => {
    const fetch = stubFetch();
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).resolves.toEqual(run());
    expect(fetch).toHaveBeenCalledWith(
      `https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows/ci.yml/runs?branch=develop&event=push&head_sha=${SHA}&per_page=1`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: 'Bearer token',
        },
      },
    );
  });

  it('defaults to the public API, and sends no token without one', async () => {
    vi.stubEnv('GITHUB_API_URL', '');
    vi.stubEnv('GITHUB_TOKEN', '');
    const fetch = stubFetch();
    await fetchLatestRun({ branch: 'develop', sha: SHA });
    const [url, { headers }] = fetch.mock.calls[0];
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\//);
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('takes the repository and the token as parameters', async () => {
    const fetch = stubFetch();
    await fetchLatestRun({ repository: 'owner/repo', token: 'other', branch: 'main', sha: SHA });
    const [url, { headers }] = fetch.mock.calls[0];
    expect(url).toContain('/repos/owner/repo/');
    expect(headers.Authorization).toBe('Bearer other');
  });

  it('resolves to undefined when the commit has no run', async () => {
    stubFetch({ body: { total_count: 0, workflow_runs: [] } });
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).resolves.toBeUndefined();
  });

  it.each([401, 404, 500])('throws when the API answers %i', async status => {
    stubFetch({ status, body: { message: 'error' } });
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).rejects.toThrow(
      `The GitHub API answered ${status} to https://api.github.com/`,
    );
  });

  it.each([
    [{ branch: 'develop', sha: '58ff9ea' }, '"AIssoufi/issoufi.fr" on "develop" for "58ff9ea"'],
    [{ branch: '', sha: SHA }, `"AIssoufi/issoufi.fr" on "" for "${SHA}"`],
    [{}, '"AIssoufi/issoufi.fr" on "" for ""'],
  ])('throws without asking the API for %o', async (filters, details) => {
    const fetch = stubFetch();
    await expect(fetchLatestRun(filters)).rejects.toThrow(
      `Cannot list the workflow runs of ${details}`,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['', undefined])('throws without a repository (%o)', async repository => {
    vi.stubEnv('GITHUB_REPOSITORY', repository);
    stubFetch();
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).rejects.toThrow(
      'Cannot list the workflow runs of "" on "develop"',
    );
  });
});

describe('the API calls on runs', () => {
  const RUNS_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions';

  /** Answers the requests in turn with the given JSON bodies, then repeats the last one. */
  const stubFetch = (...bodies) => {
    const fetch = vi.fn(async () => {
      const body = bodies.length > 1 ? bodies.shift() : bodies[0];
      return new Response(JSON.stringify(body), { status: 200 });
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  beforeEach(() => {
    vi.stubEnv('GITHUB_API_URL', 'https://api.github.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'AIssoufi/issoufi.fr');
    vi.stubEnv('GITHUB_TOKEN', 'token');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('fetchRun', () => {
    it('reads a run by its identifier', async () => {
      const fetch = stubFetch(apiRun({ status: 'in_progress', conclusion: null }));
      await expect(fetchRun({ runId: 123 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
      expect(fetch.mock.calls[0][0]).toBe(`${RUNS_API_URL}/runs/123`);
    });

    it('resolves to undefined for an answer that is not a run', async () => {
      stubFetch({ message: 'odd' });
      await expect(fetchRun({ runId: 123 })).resolves.toBeUndefined();
    });

    it.each([undefined, 0, -1, 1.5, Number.NaN, '123'])(
      'throws without asking the API for the run %o',
      async runId => {
        const fetch = stubFetch(apiRun());
        await expect(fetchRun({ runId })).rejects.toThrow('Invalid workflow run');
        expect(fetch).not.toHaveBeenCalled();
      },
    );
  });

  describe('dispatchWorkflow', () => {
    it('starts a workflow on a branch and reads the run it started', async () => {
      const fetch = stubFetch({ workflow_run_id: 123, html_url: RUN_URL });
      await expect(dispatchWorkflow({ workflow: 'ci.yml', ref: 'develop' })).resolves.toEqual({
        id: 123,
        url: RUN_URL,
      });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(`${RUNS_API_URL}/workflows/ci.yml/dispatches`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ ref: 'develop', return_run_details: true });
    });

    it('throws when GitHub does not say which run it started', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 204 })),
      );
      await expect(dispatchWorkflow({ workflow: 'release.yml', ref: 'develop' })).rejects.toThrow(
        'GitHub started release.yml on develop without saying which run',
      );
    });

    it.each([
      [{ workflow: 'ci.yml', ref: '' }, '"ci.yml" on ""'],
      [{ workflow: '', ref: 'develop' }, '"" on "develop"'],
      [{ ref: 'develop' }, '"" on "develop"'],
      [{ workflow: 'ci.yml' }, '"ci.yml" on ""'],
      [{ workflow: 42, ref: 'develop' }, '"42" on "develop"'],
    ])('throws without asking the API for %o', async (params, details) => {
      const fetch = stubFetch({});
      await expect(dispatchWorkflow(params)).rejects.toThrow(
        `Cannot start the workflow ${details}`,
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('waitForRun', () => {
    it('reads the run until it is completed', async () => {
      const fetch = stubFetch(
        apiRun({ status: 'queued', conclusion: null }),
        apiRun({ status: 'in_progress', conclusion: null }),
        apiRun({ conclusion: 'failure' }),
      );
      await expect(waitForRun({ runId: 123, delayMs: 0 })).resolves.toEqual(
        run({ conclusion: 'failure' }),
      );
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('gives the run as last read when it is still going after every attempt', async () => {
      const fetch = stubFetch(apiRun({ status: 'in_progress', conclusion: null }));
      await expect(waitForRun({ runId: 123, attempts: 2, delayMs: 0 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('resolves to undefined when the run can never be read', async () => {
      stubFetch({});
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toBeUndefined();
    });

    it('reads the run once for a single attempt, and never for none', async () => {
      const fetch = stubFetch(apiRun({ status: 'in_progress', conclusion: null }));
      await waitForRun({ runId: 123, attempts: 1, delayMs: 0 });
      expect(fetch).toHaveBeenCalledTimes(1);
      await expect(waitForRun({ runId: 123, attempts: 0, delayMs: 0 })).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('waits between two reads', async () => {
      vi.useFakeTimers();
      const fetch = stubFetch(apiRun({ status: 'queued', conclusion: null }), apiRun());
      const promise = waitForRun({ runId: 123 });
      await vi.advanceTimersByTimeAsync(29_999);
      expect(fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toEqual(run());
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('tries a failed read again', async () => {
      const answers = [
        new Response('{}', { status: 502 }),
        new Response(JSON.stringify(apiRun({ status: 'in_progress', conclusion: null }))),
        new Response('{}', { status: 500 }),
        new Response(JSON.stringify(apiRun())),
      ];
      const fetch = vi.fn(async () => answers.shift());
      vi.stubGlobal('fetch', fetch);
      await expect(waitForRun({ runId: 123, delayMs: 0 })).resolves.toEqual(run());
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('gives the run as last read when the last reads failed', async () => {
      const answers = [
        new Response(JSON.stringify(apiRun({ status: 'in_progress', conclusion: null }))),
        new Response('{}', { status: 500 }),
      ];
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => answers.shift() ?? new Response('{}', { status: 500 })),
      );
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
    });

    it('resolves to undefined when the only answer was not a run and the other reads failed', async () => {
      const answers = [new Response('{}', { status: 500 }), new Response('{}')];
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => answers.shift() ?? new Response('{}', { status: 500 })),
      );
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).resolves.toBeUndefined();
    });

    it('throws the error of the last read when every read failed', async () => {
      const fetch = vi.fn(async () => new Response('{}', { status: 500 }));
      vi.stubGlobal('fetch', fetch);
      await expect(waitForRun({ runId: 123, attempts: 3, delayMs: 0 })).rejects.toThrow(
        'The GitHub API answered 500',
      );
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it.each([undefined, 0, -1, 1.5, Number.NaN, '123'])(
      'throws at once without asking the API for the run %o',
      async runId => {
        const fetch = stubFetch(apiRun());
        await expect(waitForRun({ runId, delayMs: 0 })).rejects.toThrow('Invalid workflow run');
        expect(fetch).not.toHaveBeenCalled();
      },
    );
  });
});
