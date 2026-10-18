import {
  fetchLatestRun,
  getCiVerdict,
  getWorkflowRunsUrl,
  isCommitSha,
  readLatestRun,
  shortenSha,
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
