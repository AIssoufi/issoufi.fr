/** Repository that the specs of the GitHub helpers run in, as `GITHUB_REPOSITORY` names it. */
export const REPOSITORY = 'AIssoufi/issoufi.fr';

/** Branch of the release pull request that release-please keeps open against develop. */
export const BRANCH = 'release-please--branches--develop--components--issoufi-v3';

/** Full SHA of the head commit of the release pull request. */
export const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';

/** Page under which GitHub shows each workflow run of the repository, by its id. */
export const RUNS_URL = `https://github.com/${REPOSITORY}/actions/runs`;

/** When the workflow runs of the specs started, as the REST API writes it. */
export const CREATED_AT = '2026-10-19T04:07:00Z';

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
 * @property {unknown} body - Its body, read as JSON, `undefined` without one.
 */

/**
 * Stubs `fetch` with an API of GitHub that answers from routes, `<method> <path>` under the API of
 * the repository, query left out: each answer of a route serves one request, and the last one all
 * the next. A request without a route, or whose route has no answer, gets a 404. Undo it with
 * `vi.unstubAllGlobals()`.
 * @param {Record<string, GitHubAnswer[]>} routes - Answers of each route, in their order. The
 * stub takes them out of the lists as it serves them.
 * @returns {GitHubRequest[]} The requests, in their order, filled as they arrive.
 * @example
 * const requests = stubGitHub({ 'GET /pulls/162': [{ status: 403 }, { body: pullRequest }] });
 */
export const stubGitHub = routes => {
  const requests = [];
  const fetch = vi.fn(async (url, init = {}) => {
    const path = new URL(url).pathname.replace(REPOSITORY_PATH, '');
    const route = `${init.method ?? 'GET'} ${path}`;
    requests.push({ route, url, body: init.body ? JSON.parse(init.body) : undefined });

    const answers = routes[route] ?? [];
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
