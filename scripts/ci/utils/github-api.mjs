// @ts-check
import {
  DEFAULT_GITHUB_API_URL,
  GITHUB_API_MEDIA_TYPE,
  GITHUB_API_USER_AGENT,
  GITHUB_API_VERSION,
  REPOSITORY_PATTERN,
  TRAILING_SLASH_PATTERN,
} from '../constants.mjs';

/**
 * Parameters of {@link getRepositoryApiUrl}.
 * @typedef {object} GetRepositoryApiUrlParams
 * @property {string} [apiUrl] - REST API of GitHub, the `GITHUB_API_URL` variable. Defaults to
 * {@link DEFAULT_GITHUB_API_URL}.
 * @property {string} [repository] - Repository as `owner/name`, the `GITHUB_REPOSITORY` variable.
 * @property {string} [path] - Path of the endpoint under the repository, starting with a slash,
 * e.g. `/pulls`. Defaults to the repository itself.
 * @property {Record<string, string>} [query] - Query parameters, encoded in their order. None by
 * default.
 */

/**
 * Builds the address of a REST API endpoint of a repository.
 * @param {GetRepositoryApiUrlParams} params
 * @returns {string | undefined} The address, or `undefined` when the repository is not
 * `owner/name` or the API address is invalid.
 * @example
 * getRepositoryApiUrl({
 *   repository: 'AIssoufi/issoufi.fr',
 *   path: '/pulls',
 *   query: { base: 'develop' },
 * });
 * // 'https://api.github.com/repos/AIssoufi/issoufi.fr/pulls?base=develop'
 */
export const getRepositoryApiUrl = ({
  apiUrl = DEFAULT_GITHUB_API_URL,
  repository,
  path = '',
  query = {},
}) => {
  const isRepository = typeof repository === 'string' && REPOSITORY_PATTERN.test(repository);
  const canBuildUrl = isRepository && URL.canParse(apiUrl);
  if (!canBuildUrl) return undefined;

  const url = new URL(apiUrl);
  // Keeps the path of a GitHub Enterprise API, such as https://example.com/api/v3
  const apiPath = url.pathname.replace(TRAILING_SLASH_PATTERN, '');
  url.pathname = `${apiPath}/repos/${repository}${path}`;
  url.search = new URLSearchParams(query).toString();
  return url.toString();
};

/**
 * Reads the error message of an answer of the REST API, `{ "message": "…" }`.
 * @param {string} text - Body of the answer.
 * @returns {string | undefined} The message, or `undefined` when the body holds none.
 */
const readErrorMessage = text => {
  try {
    const message = JSON.parse(text)?.message;
    return typeof message === 'string' && message !== '' ? message : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Parameters of {@link requestGitHub}.
 * @typedef {object} RequestGitHubParams
 * @property {string} url - Address of the endpoint, e.g. from {@link getRepositoryApiUrl}.
 * @property {string} [method] - HTTP method. Defaults to `GET`.
 * @property {unknown} [body] - Body of the request, sent as JSON. None by default.
 * @property {string} [token] - Token to authenticate with. Defaults to the `GITHUB_TOKEN`
 * environment variable; without one, the request is anonymous.
 */

/**
 * Sends a request to the REST API of GitHub.
 * @param {RequestGitHubParams} params
 * @returns {Promise<unknown>} The parsed JSON answer, or `undefined` for an answer without a
 * body, such as `204 No Content`.
 * @throws {Error} When the API answers with an error status, with the message of the API when it
 * gives one, or with a body that is not JSON.
 * @example
 * await requestGitHub({ url, method: 'PUT', body: { merge_method: 'merge' } }); // { sha, … }
 */
export const requestGitHub = async ({
  url,
  method = 'GET',
  body,
  token = process.env.GITHUB_TOKEN,
}) => {
  /** @type {Record<string, string>} */
  const headers = {
    Accept: GITHUB_API_MEDIA_TYPE,
    'User-Agent': GITHUB_API_USER_AGENT,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = body !== undefined;
  if (hasBody) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method,
    headers,
    ...(hasBody && { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  if (!response.ok) {
    const message = readErrorMessage(text);
    throw new Error(
      `The GitHub API answered ${response.status} to ${url}${message ? `: ${message}` : ''}`,
    );
  }
  if (text === '') return undefined;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The GitHub API answered ${url} with a body that is not JSON`);
  }
};

/**
 * Parameters of {@link requestRepositoryApi}: those of {@link getRepositoryApiUrl}, whose
 * `apiUrl` and `repository` default to the `GITHUB_API_URL` and `GITHUB_REPOSITORY` variables of
 * GitHub Actions, and those of {@link requestGitHub} but the address.
 * @typedef {GetRepositoryApiUrlParams
 *   & Omit<RequestGitHubParams, 'url'>} RequestRepositoryApiParams
 */

/**
 * Sends a request to a REST API endpoint of the repository of the workflow.
 * @param {RequestRepositoryApiParams} params
 * @returns {Promise<unknown>} The parsed JSON answer, or `undefined` for an answer without a body.
 * @throws {Error} When the repository is not `owner/name` or the API address is invalid, or
 * when {@link requestGitHub} throws.
 * @example
 * await requestRepositoryApi({ path: '/actions/runs/123' }); // { id: 123, status: 'completed', … }
 */
export const requestRepositoryApi = async ({
  apiUrl = process.env.GITHUB_API_URL || DEFAULT_GITHUB_API_URL,
  repository = process.env.GITHUB_REPOSITORY,
  path,
  query,
  ...request
}) => {
  const url = getRepositoryApiUrl({ apiUrl, repository, path, query });
  if (!url) throw new Error(`Cannot reach the GitHub API of the repository "${repository ?? ''}"`);
  return requestGitHub({ url, ...request });
};
