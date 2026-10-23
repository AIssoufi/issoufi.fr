import { publishRelease } from './release-publish.mjs';
import {
  MERGE_SHA,
  RUNS_URL,
  WAITS,
  apiRun,
  releaseRoutes,
  routesOf,
  stubGitHub,
  stubGitHubEnv,
} from './testUtils.js';

const NAME = 'the release pull request #162';

/** Publishes the release of the merged pull request, with the short waits of the specs. */
const publish = ({ mergeSha = MERGE_SHA } = {}) =>
  publishRelease({ name: NAME, mergeSha, runWait: WAITS.runWait });

describe('publishRelease', () => {
  beforeEach(() => {
    stubGitHubEnv();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts the release and the CI on develop, and reports once the CI passed', async () => {
    const requests = stubGitHub(releaseRoutes());

    await expect(publish()).resolves.toEqual({
      level: 'notice',
      message: `Released ${NAME}, and the CI of develop passed on 3c1b0a9: ${RUNS_URL}/602`,
    });
    expect(routesOf(requests)).toEqual([
      'POST /actions/workflows/release.yml/dispatches',
      'POST /actions/workflows/ci.yml/dispatches',
      'GET /actions/runs/602',
    ]);
    expect(requests[0].body).toMatchObject({ ref: 'develop' });
    expect(requests[1].body).toMatchObject({ ref: 'develop' });
    expect(vi.mocked(console.log).mock.calls).toEqual([
      [`Merged ${NAME} into develop with 3c1b0a9.`],
      [`Started the release and its standalone build: ${RUNS_URL}/601`],
      [`Started the CI on develop: ${RUNS_URL}/602`],
    ]);
  });

  it.each([undefined, ''])('logs a merge whose merge commit is %j without it', async mergeSha => {
    stubGitHub(releaseRoutes());

    await publishRelease({ name: NAME, mergeSha, runWait: WAITS.runWait });

    expect(console.log).toHaveBeenCalledWith(`Merged ${NAME} into develop.`);
  });

  it('warns that nothing is deployed when the CI of develop does not pass', async () => {
    const routes = releaseRoutes();
    routes['GET /actions/runs/602'] = [
      { body: apiRun({ id: 602, head_sha: MERGE_SHA, conclusion: 'failure' }) },
    ];
    stubGitHub(routes);

    await expect(publish()).resolves.toEqual({
      level: 'warning',
      message: `Merged ${NAME}, but nothing is deployed until the CI of develop passes: it did not pass on 3c1b0a9 (failure): ${RUNS_URL}/602`,
    });
  });

  it('throws without starting the CI when the release cannot be started', async () => {
    const routes = releaseRoutes();
    routes['POST /actions/workflows/release.yml/dispatches'] = [
      { status: 500, body: { message: 'Server Error' } },
    ];
    const requests = stubGitHub(routes);

    await expect(publish()).rejects.toThrow('The GitHub API answered 500');
    expect(routesOf(requests)).toEqual(['POST /actions/workflows/release.yml/dispatches']);
  });

  it('throws without waiting for a run when the CI of develop cannot be started', async () => {
    const routes = releaseRoutes();
    routes['POST /actions/workflows/ci.yml/dispatches'] = [
      { status: 500, body: { message: 'Server Error' } },
    ];
    const requests = stubGitHub(routes);

    await expect(publish()).rejects.toThrow('The GitHub API answered 500');
    expect(routesOf(requests)).toEqual([
      'POST /actions/workflows/release.yml/dispatches',
      'POST /actions/workflows/ci.yml/dispatches',
    ]);
  });
});
