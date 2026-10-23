import {
  approveRun,
  describeRunOutcome,
  dispatchWorkflow,
  fetchLatestRun,
  fetchRun,
  fetchWorkflowRuns,
  getCiVerdict,
  getWorkflowRunsUrl,
  isCommitSha,
  isHeldRun,
  readDispatchedRun,
  readLatestRun,
  readRun,
  readRuns,
  shortenSha,
  waitForLatestRun,
  waitForLatestRunToFinish,
  waitForRun,
} from './workflow-runs.mjs';
import { stubGitHub, stubGitHubEnv } from './testUtils.js';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';
const CREATED_AT = '2026-10-19T05:00:00Z';

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

  it.each(['Scheduled deploy to production', ''])('reads the title %o of the run', title => {
    expect(readRun(apiRun({ display_title: title }))).toEqual(run({ title }));
  });

  it.each([undefined, null, 42, { text: 'Deploy' }])('leaves out the title %o', title => {
    const result = readRun(apiRun({ display_title: title }));
    expect(result).toEqual(run());
    expect(result).not.toHaveProperty('title');
  });

  it.each([
    undefined,
    null,
    'run',
    42,
    [],
    {},
    apiRun({ id: undefined }),
    apiRun({ id: 0 }),
    apiRun({ id: '123' }),
    apiRun({ head_sha: undefined }),
    apiRun({ head_sha: '58ff9ea' }),
    apiRun({ status: undefined }),
    apiRun({ conclusion: undefined }),
    apiRun({ created_at: undefined }),
    apiRun({ created_at: 'yesterday' }),
    apiRun({ created_at: 1_760_850_000_000 }),
    apiRun({ html_url: null }),
  ])('returns undefined for %o', value => {
    expect(readRun(value)).toBeUndefined();
  });
});

describe('isHeldRun', () => {
  it('spots a run that waits for approval', () => {
    expect(isHeldRun(run({ conclusion: 'action_required' }))).toBe(true);
  });

  it.each([
    run(),
    run({ conclusion: 'failure' }),
    run({ status: 'queued', conclusion: null }),
    run({ status: 'waiting', conclusion: 'action_required' }),
    undefined,
    null,
  ])('leaves out %o', value => {
    expect(isHeldRun(value)).toBe(false);
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

  it.each(['failure', 'cancelled', 'timed_out', 'skipped'])(
    'says that a run ended with %s did not pass',
    conclusion => {
      expect(describeRunOutcome(run({ conclusion }))).toEqual({
        isSuccess: false,
        outcome: `did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('says that a held run waits for approval', () => {
    expect(describeRunOutcome(run({ conclusion: 'action_required' }))).toEqual({
      isSuccess: false,
      outcome: `is waiting for someone to approve it on 58ff9ea: ${RUN_URL}`,
    });
  });

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

describe('readRuns', () => {
  it('reads every run of the list, in its order', () => {
    const response = { workflow_runs: [apiRun(), apiRun({ id: 122, conclusion: 'failure' })] };
    expect(readRuns(response)).toEqual([run(), run({ id: 122, conclusion: 'failure' })]);
  });

  it('leaves out the runs it cannot read', () => {
    const response = { workflow_runs: [null, apiRun({ id: 0 }), apiRun(), 'run'] };
    expect(readRuns(response)).toEqual([run()]);
  });

  it.each([undefined, null, 'runs', {}, { workflow_runs: null }, { workflow_runs: {} }])(
    'returns an empty list for %o',
    response => {
      expect(readRuns(response)).toEqual([]);
    },
  );
});

describe('getCiVerdict', () => {
  /** Start of the message of a deploy that stops. */
  const STOPPED = 'Nothing deployed: a later scheduled run tries again, since';

  it('lets a commit whose run passed through', () => {
    expect(getCiVerdict({ run: run(), sha: SHA, branch: 'develop' })).toEqual({
      isTested: true,
      level: 'notice',
      message: `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('names develop by default', () => {
    expect(getCiVerdict({ run: run(), sha: SHA }).message).toBe(
      `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    );
  });

  it('names another branch', () => {
    expect(getCiVerdict({ run: run({ conclusion: 'failure' }), sha: SHA, branch: 'main' })).toEqual(
      {
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of main did not pass on 58ff9ea (failure): ${RUN_URL}`,
      },
    );
  });

  it.each(['queued', 'in_progress', 'waiting', 'pending', 'requested'])(
    'stops with a notice while the run is %s',
    status => {
      expect(getCiVerdict({ run: run({ status, conclusion: null }), sha: SHA })).toEqual({
        isTested: false,
        level: 'notice',
        message: `${STOPPED} the CI of develop is still running on 58ff9ea (${status}): ${RUN_URL}`,
      });
    },
  );

  it.each(['failure', 'cancelled', 'timed_out', 'skipped', 'startup_failure', 'neutral'])(
    'stops with a warning when the run ended with %s',
    conclusion => {
      expect(getCiVerdict({ run: run({ conclusion }), sha: SHA })).toEqual({
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of develop did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('stops with a warning while the run waits for approval', () => {
    expect(getCiVerdict({ run: run({ conclusion: 'action_required' }), sha: SHA })).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of develop is waiting for someone to approve it on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('stops with a warning when a completed run has no conclusion', () => {
    expect(getCiVerdict({ run: run({ conclusion: null }), sha: SHA })).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of develop did not pass on 58ff9ea (no conclusion): ${RUN_URL}`,
    });
  });

  it.each([undefined, null])('stops with a notice when the commit has no run (%o)', missingRun => {
    expect(getCiVerdict({ run: missingRun, sha: SHA })).toEqual({
      isTested: false,
      level: 'notice',
      message: `${STOPPED} the CI has not run on develop for 58ff9ea.`,
    });
  });

  it('stops with a notice when the run tested another commit', () => {
    expect(getCiVerdict({ run: run({ sha: OTHER_SHA }), sha: SHA })).toEqual({
      isTested: false,
      level: 'notice',
      message: `${STOPPED} the CI has not run on develop for 58ff9ea.`,
    });
  });

  it.each([undefined, '', '58ff9ea', SHA.toUpperCase()])('stops for the commit %o', sha => {
    const verdict = getCiVerdict({ run: run(), sha });
    expect(verdict.isTested).toBe(false);
    expect(verdict.level).toBe('notice');
    expect(verdict.message.startsWith(`${STOPPED} the CI has not run on develop for `)).toBe(true);
  });

  it('names a missing commit', () => {
    expect(getCiVerdict({ run: run() }).message).toBe(
      `${STOPPED} the CI has not run on develop for this commit.`,
    );
  });
});

/** Route of the list of the runs of the CI. */
const CI_RUNS_ROUTE = 'GET /actions/workflows/ci.yml/runs';

/** Route of the run 123. */
const RUN_ROUTE = 'GET /actions/runs/123';

describe('fetchLatestRun', () => {
  /** Answers the list of the runs of the CI with the given status and JSON body. */
  const stubRuns = ({ status = 200, body = { workflow_runs: [apiRun()] } } = {}) =>
    stubGitHub({ [CI_RUNS_ROUTE]: [{ status, body }] });

  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('asks the API of GitHub Actions for the latest run, with the token', async () => {
    const requests = stubRuns();
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).resolves.toEqual(run());
    expect(requests).toEqual([
      {
        route: CI_RUNS_ROUTE,
        url: `https://api.github.com/repos/AIssoufi/issoufi.fr/actions/workflows/ci.yml/runs?branch=develop&event=push&head_sha=${SHA}&per_page=1`,
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'issoufi.fr',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: 'Bearer token',
        },
        body: undefined,
      },
    ]);
  });

  it('defaults to the public API, and sends no token without one', async () => {
    vi.stubEnv('GITHUB_API_URL', '');
    vi.stubEnv('GITHUB_TOKEN', '');
    const requests = stubRuns();
    await fetchLatestRun({ branch: 'develop', sha: SHA });
    const [{ url, headers }] = requests;
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\//);
    expect(headers).not.toHaveProperty('Authorization');
  });

  it('takes the repository and the token as parameters', async () => {
    const requests = stubGitHub({
      'GET /repos/owner/repo/actions/workflows/ci.yml/runs': [
        { body: { workflow_runs: [apiRun()] } },
      ],
    });
    await fetchLatestRun({ repository: 'owner/repo', token: 'other', branch: 'main', sha: SHA });
    const [{ url, headers }] = requests;
    expect(url).toContain('/repos/owner/repo/');
    expect(headers.Authorization).toBe('Bearer other');
  });

  it('resolves to undefined when the commit has no run', async () => {
    stubRuns({ body: { total_count: 0, workflow_runs: [] } });
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).resolves.toBeUndefined();
  });

  it.each([401, 404, 500])('throws when the API answers %i', async status => {
    stubRuns({ status, body: { message: 'error' } });
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).rejects.toThrow(
      `The GitHub API answered ${status} to https://api.github.com/`,
    );
  });

  it.each([
    [{ branch: 'develop', sha: '58ff9ea' }, '"AIssoufi/issoufi.fr" on "develop" for "58ff9ea"'],
    [{ branch: '', sha: SHA }, `"AIssoufi/issoufi.fr" on "" for "${SHA}"`],
    [{}, '"AIssoufi/issoufi.fr" on "" for ""'],
  ])('throws without asking the API for %o', async (filters, details) => {
    const requests = stubRuns();
    await expect(fetchLatestRun(filters)).rejects.toThrow(
      `Cannot list the workflow runs of ${details}`,
    );
    expect(requests).toEqual([]);
  });

  it.each(['', undefined])('throws without a repository (%o)', async repository => {
    vi.stubEnv('GITHUB_REPOSITORY', repository);
    stubRuns();
    await expect(fetchLatestRun({ branch: 'develop', sha: SHA })).rejects.toThrow(
      'Cannot list the workflow runs of "" on "develop"',
    );
  });
});

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

  describe('fetchRun', () => {
    it('reads a run by its identifier', async () => {
      const requests = stubRun(apiRun({ status: 'in_progress', conclusion: null }));
      await expect(fetchRun({ runId: 123 })).resolves.toEqual(
        run({ status: 'in_progress', conclusion: null }),
      );
      expect(requests[0].url).toBe(`${RUNS_API_URL}/runs/123`);
    });

    it('resolves to undefined for an answer that is not a run', async () => {
      stubRun({ message: 'odd' });
      await expect(fetchRun({ runId: 123 })).resolves.toBeUndefined();
    });

    it.each([undefined, 0, -1, 1.5, Number.NaN, '123'])(
      'throws without asking the API for the run %o',
      async runId => {
        const requests = stubRun(apiRun());
        await expect(fetchRun({ runId })).rejects.toThrow('Invalid workflow run');
        expect(requests).toEqual([]);
      },
    );
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

  describe('approveRun', () => {
    const APPROVE_ROUTE = 'POST /actions/runs/123/approve';

    it('approves a held run', async () => {
      const requests = stubGitHub({ [APPROVE_ROUTE]: [{ status: 201 }] });
      await expect(approveRun({ runId: 123 })).resolves.toBeUndefined();
      const [{ route, url, headers }] = requests;
      expect(url).toBe(`${RUNS_API_URL}/runs/123/approve`);
      expect(route).toBe(APPROVE_ROUTE);
      expect(headers.Authorization).toBe('Bearer token');
    });

    it('throws when GitHub refuses', async () => {
      stubGitHub({
        [APPROVE_ROUTE]: [
          { status: 403, body: { message: 'Resource not accessible by integration' } },
        ],
      });
      await expect(approveRun({ runId: 123 })).rejects.toThrow(
        `The GitHub API answered 403 to ${RUNS_API_URL}/runs/123/approve: Resource not accessible by integration`,
      );
    });

    it.each([undefined, 0, 1.5, '123'])(
      'throws without asking the API for the run %o',
      async runId => {
        const requests = stubGitHub({ [APPROVE_ROUTE]: [{ status: 201 }] });
        await expect(approveRun({ runId })).rejects.toThrow('Invalid workflow run');
        expect(requests).toEqual([]);
      },
    );
  });

  describe('fetchWorkflowRuns', () => {
    const DEPLOY_RUNS_ROUTE = 'GET /actions/workflows/deploy-production.yml/runs';

    it('lists the latest runs of a workflow started by an event', async () => {
      const requests = stubGitHub({
        [DEPLOY_RUNS_ROUTE]: [{ body: { workflow_runs: [apiRun(), apiRun({ id: 122 })] } }],
      });
      await expect(
        fetchWorkflowRuns({ workflow: 'deploy-production.yml', event: 'schedule', perPage: 20 }),
      ).resolves.toEqual([run(), run({ id: 122 })]);
      expect(requests[0].url).toBe(
        `${RUNS_API_URL}/workflows/deploy-production.yml/runs?event=schedule&per_page=20`,
      );
    });

    it('resolves to an empty list when the workflow has no such run', async () => {
      stubGitHub({ [DEPLOY_RUNS_ROUTE]: [{ body: { total_count: 0, workflow_runs: [] } }] });
      await expect(
        fetchWorkflowRuns({ workflow: 'deploy-production.yml', event: 'schedule', perPage: 20 }),
      ).resolves.toEqual([]);
    });

    it('throws when the API answers with an error', async () => {
      stubGitHub({ [DEPLOY_RUNS_ROUTE]: [{ status: 500, body: {} }] });
      await expect(
        fetchWorkflowRuns({ workflow: 'deploy-production.yml', event: 'schedule', perPage: 20 }),
      ).rejects.toThrow('The GitHub API answered 500');
    });
  });

  describe('dispatchWorkflow', () => {
    /** Answers the start of the given workflow with the run 123. */
    const stubDispatch = workflow =>
      stubGitHub({
        [`POST /actions/workflows/${workflow}/dispatches`]: [
          { body: { workflow_run_id: 123, html_url: RUN_URL } },
        ],
      });

    it('starts a workflow on a branch and reads the run it started', async () => {
      const requests = stubDispatch('ci.yml');
      await expect(dispatchWorkflow({ workflow: 'ci.yml', ref: 'develop' })).resolves.toEqual({
        id: 123,
        url: RUN_URL,
      });
      const [{ route, url, body }] = requests;
      expect(url).toBe(`${RUNS_API_URL}/workflows/ci.yml/dispatches`);
      expect(route).toBe('POST /actions/workflows/ci.yml/dispatches');
      expect(body).toEqual({ ref: 'develop', return_run_details: true });
    });

    it('sends the inputs of the workflow', async () => {
      const requests = stubDispatch('deploy-production.yml');
      await dispatchWorkflow({
        workflow: 'deploy-production.yml',
        ref: 'develop',
        inputs: { scheduled: 'true' },
      });
      expect(requests[0].body).toEqual({
        ref: 'develop',
        inputs: { scheduled: 'true' },
        return_run_details: true,
      });
    });

    it('throws when GitHub does not say which run it started', async () => {
      stubGitHub({ 'POST /actions/workflows/release.yml/dispatches': [{ status: 204 }] });
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
      const requests = stubDispatch('ci.yml');
      await expect(dispatchWorkflow(params)).rejects.toThrow(
        `Cannot start the workflow ${details}`,
      );
      expect(requests).toEqual([]);
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
