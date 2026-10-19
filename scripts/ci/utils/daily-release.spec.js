import { releaseVersionOfTheDay } from './daily-release.mjs';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const MERGE_SHA = '3c1b0a9f858ff9ea0c3f4e1b2a9d8c7b6a5f4e3d';
const REPOSITORY = 'AIssoufi/issoufi.fr';
const BRANCH = 'release-please--branches--develop--components--issoufi-v3';
const PULL_REQUEST_URL = `https://github.com/${REPOSITORY}/pull/162`;
const RUNS_URL = `https://github.com/${REPOSITORY}/actions/runs`;
const WAITS = {
  runLookup: { attempts: 3, delayMs: 0 },
  runWait: { attempts: 3, delayMs: 0 },
  mergeableWait: { attempts: 3, delayMs: 0 },
};

/** A run of the CI, as the REST API writes it, by default the passed pull request run. */
const apiRun = ({ id = 501, ...fields } = {}) => ({
  id,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-10-19T04:07:00Z',
  html_url: `${RUNS_URL}/${id}`,
  ...fields,
});

/** The release pull request, as the REST API lists it. */
const apiReleasePullRequest = {
  number: 162,
  html_url: PULL_REQUEST_URL,
  labels: [{ name: 'autorelease: pending' }],
  head: { ref: BRANCH, sha: SHA, repo: { full_name: REPOSITORY } },
};

/** The release pull request, as the REST API gives it alone, with whether it can merge. */
const apiPullRequestState = ({ mergeableState, sha = SHA }) => ({
  number: 162,
  head: { ref: BRANCH, sha },
  mergeable_state: mergeableState,
});

/** The routes of a release that goes well, from a pull request run that already passed. */
const releaseRoutes = () => ({
  'GET /pulls': [{ body: [apiReleasePullRequest] }],
  'GET /actions/workflows/ci.yml/runs': [{ body: { workflow_runs: [apiRun()] } }],
  'GET /actions/runs/501': [{ body: apiRun() }],
  'GET /pulls/162': [{ body: apiPullRequestState({ mergeableState: 'clean' }) }],
  'PUT /pulls/162/merge': [{ body: { sha: MERGE_SHA, merged: true } }],
  'POST /actions/workflows/release.yml/dispatches': [
    { body: { workflow_run_id: 601, html_url: `${RUNS_URL}/601` } },
  ],
  'POST /actions/workflows/ci.yml/dispatches': [
    { body: { workflow_run_id: 602, html_url: `${RUNS_URL}/602` } },
  ],
  'GET /actions/runs/602': [{ body: apiRun({ id: 602, head_sha: MERGE_SHA }) }],
  'GET /rules/branches/develop': [
    {
      body: [
        {
          type: 'required_status_checks',
          parameters: { required_status_checks: [{ context: 'format' }, { context: 'lint' }] },
        },
      ],
    },
  ],
  [`GET /commits/${SHA}/check-runs`]: [
    { body: { check_runs: [{ name: 'lint', status: 'completed', conclusion: 'success' }] } },
  ],
});

/**
 * Answers the requests of the daily release from its routes, `<method> <path>` under the API of
 * the repository, query left out: each answer serves one request, and the last one all the next.
 * An answer with `rejection` makes the request fail with it, as when the network is down. A
 * request without a route gets a 404.
 */
const stubGitHub = routes => {
  const requests = [];
  const fetch = vi.fn(async (url, init = {}) => {
    const path = new URL(url).pathname.replace(`/repos/${REPOSITORY}`, '');
    const route = `${init.method ?? 'GET'} ${path}`;
    requests.push({ route, url, body: init.body ? JSON.parse(init.body) : undefined });

    const answers = routes[route];
    if (!answers) return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    const { status = 200, body, rejection } = answers.length > 1 ? answers.shift() : answers[0];
    if (rejection !== undefined) throw rejection;
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetch);
  return requests;
};

/** The routes that the release requested, in their order. */
const routesOf = requests => requests.map(({ route }) => route);

describe('releaseVersionOfTheDay', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_API_URL', 'https://api.github.com');
    vi.stubEnv('GITHUB_REPOSITORY', REPOSITORY);
    vi.stubEnv('GITHUB_TOKEN', 'token');
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('merges the release pull request whose CI passed, then releases and tests develop', async () => {
    const requests = stubGitHub(releaseRoutes());

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'notice',
      message: `Released the release pull request #162, and the CI of develop passed on 3c1b0a9: ${RUNS_URL}/602`,
    });
    expect(routesOf(requests)).toEqual([
      'GET /pulls',
      'GET /actions/workflows/ci.yml/runs',
      'GET /actions/runs/501',
      'GET /pulls/162',
      'PUT /pulls/162/merge',
      'POST /actions/workflows/release.yml/dispatches',
      'POST /actions/workflows/ci.yml/dispatches',
      'GET /actions/runs/602',
    ]);
    const runsQuery = new URL(requests[1].url).searchParams;
    expect(runsQuery.get('event')).toBe('pull_request');
    expect(runsQuery.get('branch')).toBe(BRANCH);
    expect(runsQuery.get('head_sha')).toBe(SHA);
    expect(requests[4].body).toEqual({ sha: SHA, merge_method: 'merge' });
    expect(requests[6].body).toEqual({ ref: 'develop', return_run_details: true });
  });

  it('approves the CI that GitHub holds, and waits for it', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['GET /actions/runs/501'] = [
      { body: apiRun({ conclusion: 'action_required' }) },
      { body: apiRun({ status: 'in_progress', conclusion: null }) },
      { body: apiRun() },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(routesOf(requests).slice(1, 6)).toEqual([
      'GET /actions/workflows/ci.yml/runs',
      'POST /actions/runs/501/approve',
      'GET /actions/runs/501',
      'GET /actions/runs/501',
      'GET /actions/runs/501',
    ]);
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
  });

  it('warns with the link of the held CI when GitHub refuses to let the job approve it', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [
      { status: 403, body: { message: 'Resource not accessible by integration' } },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: GitHub holds the CI of the release pull request #162 until someone approves it, and refused to let this job do it (The GitHub API answered 403 to https://api.github.com/repos/${REPOSITORY}/actions/runs/501/approve: Resource not accessible by integration). Approve the run, then start deploy-production.yml by hand to release it: ${RUNS_URL}/501`,
    });
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('writes a failed approval that is not an error as text', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ rejection: 'offline' }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({
      level: 'warning',
      message: expect.stringContaining('refused to let this job do it (offline)'),
    });
  });

  it('waits for a pull request that is not mergeable yet', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'unknown' }) },
      { body: apiPullRequestState({ mergeableState: 'blocked' }) },
      { body: apiPullRequestState({ mergeableState: 'unstable' }) },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(routesOf(requests).filter(route => route === 'GET /pulls/162')).toHaveLength(3);
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
  });

  it('names the required checks that block a pull request that never becomes mergeable', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [{ body: apiPullRequestState({ mergeableState: 'blocked' }) }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: the release pull request #162 is blocked by a rule of the base branch (blocked): the required checks format (missing) did not pass, though its CI passed: ${PULL_REQUEST_URL}`,
    });
    expect(routesOf(requests).filter(route => route === 'GET /pulls/162')).toHaveLength(3);
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('still says why the pull request cannot merge when its checks cannot be read', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [{ body: apiPullRequestState({ mergeableState: 'dirty' }) }];
    routes['GET /rules/branches/develop'] = [{ status: 403, body: { message: 'Forbidden' } }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: the release pull request #162 conflicts with its base branch (dirty), though its CI passed: ${PULL_REQUEST_URL}`,
    });
  });

  it('warns when GitHub refuses the merge, naming the required checks that did not pass', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [
      { status: 405, body: { message: 'Repository rule violations found' } },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: GitHub refused to merge the release pull request #162, where the required checks format (missing) did not pass (${PULL_REQUEST_URL}): The GitHub API answered 405 to https://api.github.com/repos/${REPOSITORY}/pulls/162/merge: Repository rule violations found`,
    });
    expect(routesOf(requests)).not.toContain('POST /actions/workflows/release.yml/dispatches');
  });

  it('gives the reason of a refused merge alone when every required check passed', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [
      { status: 409, body: { message: 'Head branch was modified' } },
    ];
    routes[`GET /commits/${SHA}/check-runs`] = [
      {
        body: {
          check_runs: ['format', 'lint'].map(name => ({
            name,
            status: 'completed',
            conclusion: 'success',
          })),
        },
      },
    ];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: GitHub refused to merge the release pull request #162 (${PULL_REQUEST_URL}): The GitHub API answered 409 to https://api.github.com/repos/${REPOSITORY}/pulls/162/merge: Head branch was modified`,
    });
  });

  /**
   * The routes of a release whose branch release-please moves from SHA to OTHER_SHA during the
   * first attempt: the second attempt finds the new head and its run, 502, which passed.
   */
  const movedReleaseRoutes = () => {
    const routes = releaseRoutes();
    routes['GET /pulls'] = [
      { body: [apiReleasePullRequest] },
      {
        body: [
          { ...apiReleasePullRequest, head: { ...apiReleasePullRequest.head, sha: OTHER_SHA } },
        ],
      },
    ];
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun()] } },
      { body: { workflow_runs: [apiRun({ id: 502, head_sha: OTHER_SHA })] } },
    ];
    routes['GET /actions/runs/502'] = [{ body: apiRun({ id: 502, head_sha: OTHER_SHA }) }];
    return routes;
  };

  /** The commits that the release asked GitHub to merge, in their order. */
  const mergedShasOf = requests =>
    requests.filter(({ route }) => route === 'PUT /pulls/162/merge').map(({ body }) => body.sha);

  it('starts again from the new head when release-please moved the branch after the CI', async () => {
    const routes = movedReleaseRoutes();
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'blocked', sha: OTHER_SHA }) },
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({
      level: 'notice',
      message: expect.stringMatching(/^Released the release pull request #162/),
    });
    expect(mergedShasOf(requests)).toEqual([OTHER_SHA]);
    expect(console.log).toHaveBeenCalledWith(
      'release-please moved the release pull request #162 away from 58ff9ea.',
    );
  });

  it('starts again when GitHub refuses the merge because the head was modified', async () => {
    const routes = movedReleaseRoutes();
    routes['GET /pulls/162'] = [
      // The wait of the first attempt, then the read after the refused merge, then the second wait
      { body: apiPullRequestState({ mergeableState: 'clean' }) },
      { body: apiPullRequestState({ mergeableState: 'blocked', sha: OTHER_SHA }) },
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    routes['PUT /pulls/162/merge'] = [
      {
        status: 409,
        body: { message: 'Head branch was modified. Review and try the merge again.' },
      },
      { body: { sha: MERGE_SHA, merged: true } },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(mergedShasOf(requests)).toEqual([SHA, OTHER_SHA]);
  });

  it('starts again when a newer push of release-please cancelled the CI', async () => {
    const routes = movedReleaseRoutes();
    routes['GET /actions/runs/501'] = [{ body: apiRun({ conclusion: 'cancelled' }) }];
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'blocked', sha: OTHER_SHA }) },
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(mergedShasOf(requests)).toEqual([OTHER_SHA]);
  });

  it('gives up when release-please moves the branch at every attempt', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'blocked', sha: OTHER_SHA }) },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'notice',
      message:
        'No release today: release-please moved the release pull request 2 times while its CI ran, so the next run releases it.',
    });
    expect(routesOf(requests).filter(route => route === 'GET /pulls')).toHaveLength(2);
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('keeps the reason of a refused merge when the head did not move', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [
      { status: 409, body: { message: 'Head branch was modified' } },
    ];
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'clean' }) },
      { status: 500, body: { message: 'Server Error' } },
    ];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({
      level: 'warning',
      message: expect.stringContaining('GitHub refused to merge the release pull request #162'),
    });
  });

  it('waits for the run that GitHub creates after a push of release-please', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [] } },
      { body: { workflow_runs: [apiRun()] } },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(mergedShasOf(requests)).toEqual([SHA]);
  });

  it('stops without a release pull request', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls'] = [{ body: [] }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'notice',
      message:
        'No release today: no release pull request is open, so develop holds nothing to release.',
    });
    expect(routesOf(requests)).toEqual(['GET /pulls']);
  });

  it('stops when the CI has not run on the release pull request yet', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [{ body: { workflow_runs: [] } }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'notice',
      message: `No release today: the CI has not run on the release pull request #162 for 58ff9ea yet: ${PULL_REQUEST_URL}`,
    });
  });

  it.each([
    [apiRun({ conclusion: 'failure' }), `did not pass on 58ff9ea (failure): ${RUNS_URL}/501`],
    [
      apiRun({ status: 'in_progress', conclusion: null }),
      `is still running on 58ff9ea (in_progress): ${RUNS_URL}/501`,
    ],
  ])('stops when the CI of the release pull request did not pass (%#)', async (run, outcome) => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [{ body: { workflow_runs: [run] } }];
    routes['GET /actions/runs/501'] = [{ body: run }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'notice',
      message: `No release today: the CI of the release pull request #162 ${outcome}`,
    });
    expect(routesOf(requests).filter(route => route === 'GET /pulls')).toHaveLength(1);
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('warns when the approved CI still waits for approval after every read', async () => {
    const heldRun = apiRun({ conclusion: 'action_required' });
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [{ body: { workflow_runs: [heldRun] } }];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['GET /actions/runs/501'] = [{ body: heldRun }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: the CI of the release pull request #162 is waiting for someone to approve it on 58ff9ea: ${RUNS_URL}/501`,
    });
  });

  it('approves a held CI and checks the pull request, but merges nothing, in a dry run', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay({ ...WAITS, isDryRun: true })).resolves.toEqual({
      level: 'notice',
      message:
        'Dry run: the release pull request #162 passed its CI and can be merged. Nothing was merged.',
    });
    expect(routesOf(requests)).toContain('POST /actions/runs/501/approve');
    expect(routesOf(requests)).toContain('GET /pulls/162');
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('warns when the CI of develop does not pass after the merge', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/runs/602'] = [
      { body: apiRun({ id: 602, head_sha: MERGE_SHA, conclusion: 'failure' }) },
    ];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `Merged the release pull request #162, but nothing is deployed until the CI of develop passes: it did not pass on 3c1b0a9 (failure): ${RUNS_URL}/602`,
    });
  });

  it('logs a merge whose answer does not give the merge commit', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [{ body: { merged: true } }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(console.log).toHaveBeenCalledWith('Merged the release pull request #162 into develop.');
  });

  it('throws when the pull requests cannot be listed', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls'] = [{ status: 500, body: { message: 'Server Error' } }];
    stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).rejects.toThrow('The GitHub API answered 500');
  });

  it('defaults to a real release', async () => {
    vi.useFakeTimers();
    const requests = stubGitHub(releaseRoutes());
    const promise = releaseVersionOfTheDay();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ level: 'notice' });
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
    vi.useRealTimers();
  });
});
