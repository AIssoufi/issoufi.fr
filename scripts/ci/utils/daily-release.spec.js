import { releaseVersionOfTheDay } from './daily-release.mjs';
import {
  BRANCH,
  MERGE_SHA,
  OTHER_SHA,
  PULL_REQUEST_URL,
  REPOSITORY,
  RUNS_URL,
  SHA,
  WAITS,
  apiPullRequestState,
  apiReleasePullRequest,
  apiRun,
  releaseRoutes,
  routesOf,
  stubGitHub,
  stubGitHubEnv,
} from './testUtils.js';

describe('releaseVersionOfTheDay', () => {
  beforeEach(() => {
    stubGitHubEnv();
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
    expect(routesOf(requests).slice(1, 7)).toEqual([
      'GET /actions/workflows/ci.yml/runs',
      'POST /actions/runs/501/approve',
      'GET /actions/workflows/pull-request-title.yml/runs',
      'GET /actions/runs/501',
      'GET /actions/runs/501',
      'GET /actions/runs/501',
    ]);
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
  });

  it('approves the held run of the title lint along with the CI, on the same head', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['GET /actions/workflows/pull-request-title.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ id: 511, conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['POST /actions/runs/511/approve'] = [{ status: 201 }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(routesOf(requests).slice(1, 6)).toEqual([
      'GET /actions/workflows/ci.yml/runs',
      'POST /actions/runs/501/approve',
      'GET /actions/workflows/pull-request-title.yml/runs',
      'POST /actions/runs/511/approve',
      'GET /actions/runs/501',
    ]);
    const titleRunsQuery = new URL(requests[3].url).searchParams;
    expect(titleRunsQuery.get('event')).toBe('pull_request');
    expect(titleRunsQuery.get('branch')).toBe(BRANCH);
    expect(titleRunsQuery.get('head_sha')).toBe(SHA);
    expect(console.log).toHaveBeenCalledWith(
      `Approved the CI of the release pull request #162, which GitHub held: ${RUNS_URL}/501`,
    );
    expect(console.log).toHaveBeenCalledWith(
      `Approved the pull-request-title.yml run of the release pull request #162, which GitHub held: ${RUNS_URL}/511`,
    );
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
  });

  it('leaves the other runs alone when the CI is not held, as with the release App', async () => {
    const requests = stubGitHub(releaseRoutes());

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toMatchObject({ level: 'notice' });
    expect(routesOf(requests)).not.toContain('GET /actions/workflows/pull-request-title.yml/runs');
    expect(routesOf(requests).filter(route => route.endsWith('/approve'))).toEqual([]);
    expect(routesOf(requests)).toContain('PUT /pulls/162/merge');
  });

  it('warns with the link of the held title lint when its approval is refused', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['GET /actions/workflows/pull-request-title.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ id: 511, conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['POST /actions/runs/511/approve'] = [
      { status: 403, body: { message: 'Resource not accessible by integration' } },
    ];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).resolves.toEqual({
      level: 'warning',
      message: `No release today: GitHub holds the pull-request-title.yml run of the release pull request #162 until someone approves it, and refused to let this job do it (The GitHub API answered 403 to https://api.github.com/repos/${REPOSITORY}/actions/runs/511/approve: Resource not accessible by integration). Approve the run, then start deploy-production.yml by hand to release it: ${RUNS_URL}/511`,
    });
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('throws when the runs of the title lint cannot be listed', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['GET /actions/workflows/pull-request-title.yml/runs'] = [
      { status: 500, body: { message: 'Server Error' } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    const requests = stubGitHub(routes);

    await expect(releaseVersionOfTheDay(WAITS)).rejects.toThrow('The GitHub API answered 500');
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
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
