/** Repository that the specs of the GitHub helpers run in, as `GITHUB_REPOSITORY` names it. */
export const REPOSITORY = 'AIssoufi/issoufi.fr';

/** Branch of the release pull request that release-please keeps open against develop. */
export const BRANCH = 'release-please--branches--develop--components--issoufi-v3';

/**
 * Full SHA of the commit the specs work on, such as the head of the release pull request, the
 * commit a workflow ran on or the deployed one.
 */
export const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';

/** Page under which GitHub shows each workflow run of the repository, by its id. */
export const RUNS_URL = `https://github.com/${REPOSITORY}/actions/runs`;

/** When the workflow runs of the specs started, as the REST API writes it. */
const CREATED_AT = '2026-10-19T04:07:00Z';

/**
 * Full SHA of a commit other than {@link SHA}, such as a newer head that release-please pushed
 * to the release pull request.
 */
export const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';

/** Full SHA of the merge commit of the release pull request. */
export const MERGE_SHA = '3c1b0a9f858ff9ea0c3f4e1b2a9d8c7b6a5f4e3d';

/** Page of the release pull request on GitHub. */
export const PULL_REQUEST_URL = `https://github.com/${REPOSITORY}/pull/162`;

/** Waits of the release helpers, as short as they go: three reads, without delay. */
export const WAITS = {
  runLookup: { attempts: 3, delayMs: 0 },
  runWait: { attempts: 3, delayMs: 0 },
  mergeableWait: { attempts: 3, delayMs: 0 },
};

/** A workflow run, as the REST API writes it, by default the passed pull request run of the CI. */
export const apiRun = ({ id = 501, ...fields } = {}) => ({
  id,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: CREATED_AT,
  html_url: `${RUNS_URL}/${id}`,
  ...fields,
});

/** The same run as {@link apiRun}, as `readRun` gives it. */
export const workflowRun = ({ id = 501, ...fields } = {}) => ({
  id,
  sha: SHA,
  status: 'completed',
  conclusion: 'success',
  createdAt: new Date(CREATED_AT),
  url: `${RUNS_URL}/${id}`,
  ...fields,
});

/** The release pull request, as the REST API lists it. */
export const apiReleasePullRequest = {
  number: 162,
  html_url: PULL_REQUEST_URL,
  labels: [{ name: 'autorelease: pending' }],
  head: { ref: BRANCH, sha: SHA, repo: { full_name: REPOSITORY } },
};

/** The release pull request, as the REST API gives it alone, with whether it can merge. */
export const apiPullRequestState = ({ mergeableState, sha = SHA }) => ({
  number: 162,
  head: { ref: BRANCH, sha },
  mergeable_state: mergeableState,
});

/** The routes of a release that goes well, from pull request runs that already passed. */
export const releaseRoutes = () => ({
  'GET /pulls': [{ body: [apiReleasePullRequest] }],
  'GET /actions/workflows/ci.yml/runs': [{ body: { workflow_runs: [apiRun()] } }],
  'GET /actions/workflows/pull-request-title.yml/runs': [
    { body: { workflow_runs: [apiRun({ id: 511 })] } },
  ],
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

/** Address of the REST API that the GitHub helpers read from `GITHUB_API_URL`. */
const API_URL = 'https://api.github.com';

/** Prefix of the paths of the repository under the REST API, which the routes leave out. */
const REPOSITORY_PATH = `/repos/${REPOSITORY}`;

/**
 * Sets the variables that the GitHub helpers read in the CI: the address of the API, the
 * repository and a token. Undo it with `vi.unstubAllEnvs()`.
 */
export const stubGitHubEnv = () => {
  vi.stubEnv('GITHUB_API_URL', API_URL);
  vi.stubEnv('GITHUB_REPOSITORY', REPOSITORY);
  vi.stubEnv('GITHUB_TOKEN', 'token');
};

/**
 * One answer of a route of {@link stubGitHub}.
 * @typedef {object} GitHubAnswer
 * @property {number} [status] - Status of the response. Defaults to 200.
 * @property {unknown} [body] - Body of the response, written as JSON, none when left out.
 * @property {unknown} [rejection] - Error that the request fails with, as when the network is down.
 */

/**
 * A request that {@link stubGitHub} answered.
 * @typedef {object} GitHubRequest
 * @property {string} route - Its route, `<method> <path>` under the API of the repository, query
 * left out, such as `GET /pulls/162`.
 * @property {string} url - Its whole address.
 * @property {Record<string, string> | undefined} headers - Its headers, as the request gave them,
 * `undefined` without any.
 * @property {unknown} body - Its body, read as JSON, `undefined` without one.
 */

/**
 * Stubs `fetch` with an API of GitHub that answers from routes, `<method> <path>` under the API of
 * the repository, query left out: each answer of a route serves one request, and the last one all
 * the next. A route written with the exact query of a request, parameters in their order, such as
 * `GET /runs?event=schedule`, answers it before the route without one. A request without a route,
 * or whose route has no answer, gets a 404. Undo it with `vi.unstubAllGlobals()`.
 * @param {Record<string, GitHubAnswer[]>} routes - Answers of each route, in their order. The
 * stub takes them out of the lists as it serves them.
 * @returns {GitHubRequest[]} The requests, in their order, filled as they arrive.
 * @example
 * const requests = stubGitHub({ 'GET /pulls/162': [{ status: 403 }, { body: pullRequest }] });
 */
export const stubGitHub = routes => {
  const requests = [];
  const fetch = vi.fn(async (url, init = {}) => {
    const { pathname, search } = new URL(url);
    const route = `${init.method ?? 'GET'} ${pathname.replace(REPOSITORY_PATH, '')}`;
    const { headers, body: requestBody } = init;
    requests.push({ route, url, headers, body: requestBody ? JSON.parse(requestBody) : undefined });

    const answers = routes[`${route}${search}`] ?? routes[route] ?? [];
    if (answers.length === 0) {
      return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
    }
    const isLastAnswer = answers.length === 1;
    const { status = 200, body, rejection } = isLastAnswer ? answers[0] : answers.shift();
    if (rejection !== undefined) throw rejection;
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetch);
  return requests;
};

/**
 * Lists the routes of the requests that {@link stubGitHub} answered.
 * @param {GitHubRequest[]} requests - The requests, as the stub returned them.
 * @returns {string[]} Their routes, in their order.
 */
export const routesOf = requests => requests.map(({ route }) => route);
