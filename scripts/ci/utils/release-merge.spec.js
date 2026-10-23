import { mergeReleasePullRequest } from './release-merge.mjs';
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
  apiRun,
  releaseRoutes,
  routesOf,
  stubGitHub,
  stubGitHubEnv,
} from './testUtils.js';

/** The release pull request, as `fetchReleasePullRequest` gives it. */
const PULL_REQUEST = { number: 162, branch: BRANCH, sha: SHA, url: PULL_REQUEST_URL };

/** The requests of an attempt that merges, from the run of the CI to the merge. */
const MERGE_ROUTES = [
  'GET /actions/workflows/ci.yml/runs',
  'GET /actions/runs/501',
  'GET /pulls/162',
  'PUT /pulls/162/merge',
];

/** Tries once to merge the release pull request, with the short waits of the specs. */
const attempt = ({ isDryRun = false } = {}) =>
  mergeReleasePullRequest({ pullRequest: PULL_REQUEST, isDryRun, ...WAITS });

/** An attempt that stopped with the given report. */
const stopped = ({ level, message }) => ({ status: 'stopped', report: { level, message } });

describe('mergeReleasePullRequest', () => {
  beforeEach(() => {
    stubGitHubEnv();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('merges the pull request at the commit that its CI tested', async () => {
    const requests = stubGitHub(releaseRoutes());

    await expect(attempt()).resolves.toEqual({ status: 'merged', mergeSha: MERGE_SHA });
    expect(routesOf(requests)).toEqual(MERGE_ROUTES);
    expect(requests.at(-1).body).toEqual({ sha: SHA, merge_method: 'merge' });
    expect(console.log).toHaveBeenCalledWith(
      `The CI of the release pull request #162 passed on 58ff9ea: ${RUNS_URL}/501`,
    );
  });

  it('merges without a merge commit when the answer of GitHub gives none', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [{ body: { merged: true } }];
    stubGitHub(routes);

    await expect(attempt()).resolves.toEqual({ status: 'merged', mergeSha: undefined });
  });

  it('approves the CI that GitHub holds before it waits for it', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['GET /actions/workflows/pull-request-title.yml/runs'] = [
      { body: { workflow_runs: [] } },
    ];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toMatchObject({ status: 'merged' });
    expect(routesOf(requests).slice(0, 3)).toEqual([
      'GET /actions/workflows/ci.yml/runs',
      'POST /actions/runs/501/approve',
      'GET /actions/workflows/pull-request-title.yml/runs',
    ]);
  });

  it('warns with the link of the held CI that GitHub refuses to approve', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [
      { body: { workflow_runs: [apiRun({ conclusion: 'action_required' })] } },
    ];
    routes['POST /actions/runs/501/approve'] = [{ status: 403, body: { message: 'Forbidden' } }];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'warning',
        message: `No release today: GitHub holds the CI of the release pull request #162 until someone approves it, and refused to let this job do it (The GitHub API answered 403 to https://api.github.com/repos/${REPOSITORY}/actions/runs/501/approve: Forbidden). Approve the run, then start deploy-production.yml by hand to release it: ${RUNS_URL}/501`,
      }),
    );
    expect(routesOf(requests)).not.toContain('GET /actions/runs/501');
  });

  it('stops with a notice when the CI has not run on the head yet', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [{ body: { workflow_runs: [] } }];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'notice',
        message: `No release today: the CI has not run on the release pull request #162 for 58ff9ea yet: ${PULL_REQUEST_URL}`,
      }),
    );
    expect(routesOf(requests).every(route => route === 'GET /actions/workflows/ci.yml/runs')).toBe(
      true,
    );
  });

  it('warns when the approved CI still waits for someone to approve it', async () => {
    const heldRun = apiRun({ conclusion: 'action_required' });
    const routes = releaseRoutes();
    routes['GET /actions/workflows/ci.yml/runs'] = [{ body: { workflow_runs: [heldRun] } }];
    routes['POST /actions/runs/501/approve'] = [{ status: 201 }];
    routes['GET /actions/workflows/pull-request-title.yml/runs'] = [
      { body: { workflow_runs: [] } },
    ];
    routes['GET /actions/runs/501'] = [{ body: heldRun }];
    stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'warning',
        message: `No release today: the CI of the release pull request #162 is waiting for someone to approve it on 58ff9ea: ${RUNS_URL}/501`,
      }),
    );
  });

  it('throws when the run of the CI cannot be read', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/runs/501'] = [{ status: 500, body: { message: 'Server Error' } }];
    const requests = stubGitHub(routes);

    await expect(attempt()).rejects.toThrow('The GitHub API answered 500');
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('starts another attempt when a newer push of release-please cancelled the CI', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/runs/501'] = [{ body: apiRun({ conclusion: 'cancelled' }) }];
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual({ status: 'moved' });
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it.each([
    ['still has the head of the run', [{ body: apiPullRequestState({ mergeableState: 'clean' }) }]],
    ['cannot be read again', [{ status: 500, body: { message: 'Server Error' } }]],
    ['is no longer found', []],
  ])(
    'stops when the CI did not pass and the pull request %s',
    async (_case, pullRequestAnswers) => {
      const routes = releaseRoutes();
      routes['GET /actions/runs/501'] = [{ body: apiRun({ conclusion: 'failure' }) }];
      routes['GET /pulls/162'] = pullRequestAnswers;
      stubGitHub(routes);

      await expect(attempt()).resolves.toEqual(
        stopped({
          level: 'notice',
          message: `No release today: the CI of the release pull request #162 did not pass on 58ff9ea (failure): ${RUNS_URL}/501`,
        }),
      );
    },
  );

  it('starts another attempt when the head moved before the merge', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual({ status: 'moved' });
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('warns with the required checks when the pull request cannot merge', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [{ body: apiPullRequestState({ mergeableState: 'blocked' }) }];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'warning',
        message: `No release today: the release pull request #162 is blocked by a rule of the base branch (blocked): the required checks format (missing) did not pass, though its CI passed: ${PULL_REQUEST_URL}`,
      }),
    );
    expect(routesOf(requests)).not.toContain('PUT /pulls/162/merge');
  });

  it('stops before the merge in a dry run', async () => {
    const requests = stubGitHub(releaseRoutes());

    await expect(attempt({ isDryRun: true })).resolves.toEqual(
      stopped({
        level: 'notice',
        message:
          'Dry run: the release pull request #162 passed its CI and can be merged. Nothing was merged.',
      }),
    );
    expect(routesOf(requests)).toEqual(MERGE_ROUTES.slice(0, -1));
  });

  it('starts another attempt when GitHub refuses the merge of a head that moved', async () => {
    const routes = releaseRoutes();
    routes['GET /pulls/162'] = [
      { body: apiPullRequestState({ mergeableState: 'clean' }) },
      { body: apiPullRequestState({ mergeableState: 'clean', sha: OTHER_SHA }) },
    ];
    routes['PUT /pulls/162/merge'] = [
      { status: 409, body: { message: 'Head branch was modified' } },
    ];
    const requests = stubGitHub(routes);

    await expect(attempt()).resolves.toEqual({ status: 'moved' });
    expect(routesOf(requests).slice(-2)).toEqual(['PUT /pulls/162/merge', 'GET /pulls/162']);
  });

  it('stops with a warning naming the required checks when GitHub refuses the merge', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [
      { status: 405, body: { message: 'Repository rule violations found' } },
    ];
    stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'warning',
        message: `No release today: GitHub refused to merge the release pull request #162, where the required checks format (missing) did not pass (${PULL_REQUEST_URL}): The GitHub API answered 405 to https://api.github.com/repos/${REPOSITORY}/pulls/162/merge: Repository rule violations found`,
      }),
    );
  });

  it('gives the reason of a refused merge alone when the checks cannot be read', async () => {
    const routes = releaseRoutes();
    routes['PUT /pulls/162/merge'] = [{ rejection: new TypeError('fetch failed') }];
    routes['GET /rules/branches/develop'] = [{ status: 403, body: { message: 'Forbidden' } }];
    stubGitHub(routes);

    await expect(attempt()).resolves.toEqual(
      stopped({
        level: 'warning',
        message: `No release today: GitHub refused to merge the release pull request #162 (${PULL_REQUEST_URL}): fetch failed`,
      }),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^Could not read the required checks of 58ff9ea: /),
    );
  });
});
