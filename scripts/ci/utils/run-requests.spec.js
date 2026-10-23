import {
  approveRun,
  assertRunId,
  fetchLatestRun,
  fetchRun,
  fetchWorkflowRuns,
  getWorkflowRunsUrl,
} from './run-requests.mjs';
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

describe('assertRunId', () => {
  it.each([1, 123])('accepts the run %i', runId => {
    expect(() => assertRunId(runId)).not.toThrow();
  });

  it.each([
    [0, '"0"'],
    [-1, '"-1"'],
    [1.5, '"1.5"'],
    [Number.NaN, '"NaN"'],
    ['123', '"123"'],
    [undefined, '""'],
    [null, '""'],
  ])('throws for the run %o', (runId, shownId) => {
    expect(() => assertRunId(runId)).toThrow(`Invalid workflow run ${shownId}`);
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
});
