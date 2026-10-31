// @ts-check
import {
  DEFAULT_REDIRECT_STATUS,
  LINE_BREAK_PATTERN,
  MAX_REDIRECT_FIELD_COUNT,
  MAX_REDIRECT_HOPS,
  MIN_REDIRECT_FIELD_COUNT,
  REDIRECT_COMMENT_MARK,
  REDIRECT_FIELD_SEPARATOR_PATTERN,
  REDIRECT_PATTERN_MARK_PATTERN,
  REDIRECT_STATUSES,
} from '../constants.mjs';
import { getErrorMessage } from './errors.mjs';
import { toList } from './lists.mjs';

/**
 * Tells whether an HTTP status is a redirect, whose `Location` header gives the new address.
 * @param {unknown} status - Status to check.
 * @returns {boolean} True for one of {@link REDIRECT_STATUSES}.
 */
const isRedirectStatus = status =>
  REDIRECT_STATUSES.some(redirectStatus => redirectStatus === status);

/**
 * Addresses of a redirect check, read by {@link hasValidAddresses}.
 * @typedef {object} RedirectAddresses
 * @property {string} [url] - Address requested.
 * @property {string} [expectedUrl] - Address it must redirect to.
 */

/**
 * Tells whether both addresses of a redirect check are absolute addresses.
 * @param {RedirectAddresses} addresses
 * @returns {boolean} False when one of them is missing, relative or malformed.
 */
const hasValidAddresses = ({ url, expectedUrl }) =>
  URL.canParse(url ?? '') && URL.canParse(expectedUrl ?? '');

/**
 * Parameters of {@link resolveRedirectUrl}.
 * @typedef {object} ResolveRedirectUrlParams
 * @property {string} [url] - Address that was requested, against which a relative location is
 * resolved.
 * @property {number} [status] - Status the address answered with.
 * @property {string | null} [location] - `Location` header of the answer, `null` when it has none.
 */

/**
 * Reads the address that an answer redirects to, as a browser or curl's `%{redirect_url}` does:
 * the `Location` header of a redirect status, resolved against the address requested.
 * @param {ResolveRedirectUrlParams} params
 * @returns {string} The absolute address, normalized as `URL` writes it, or `''` when the status
 * is not one of {@link REDIRECT_STATUSES}, or the location is missing, empty or not a valid
 * address.
 * @example
 * resolveRedirectUrl({ url: 'http://issoufi.fr/', status: 301, location: 'https://issoufi.fr' });
 * // 'https://issoufi.fr/'
 */
export const resolveRedirectUrl = ({ url, status, location }) => {
  // An empty location would resolve to the address requested itself
  const hasValidLocation =
    typeof location === 'string' && location.trim() !== '' && URL.canParse(location, url);
  if (!isRedirectStatus(status) || !hasValidLocation) return '';

  return new URL(location, url).href;
};

/**
 * Parameters of {@link compareRedirect}.
 * @typedef {object} CompareRedirectParams
 * @property {string} [url] - Address that was requested, e.g. `http://issoufi.fr/`.
 * @property {number} [status] - Status it answered with. Missing or not an integer, it is reported
 * as unknown.
 * @property {string | null} [location] - `Location` header of the answer, `null` when it has none.
 * @property {string} [expectedUrl] - Address it must redirect to, normalized as `URL` writes it,
 * e.g. `https://issoufi.fr/`.
 */

/**
 * Compares where an address redirects to with the address it must redirect to.
 * @param {CompareRedirectParams} params
 * @returns {string[]} The problems found, empty when the address redirects to `expectedUrl`, and
 * a single problem when the address or the expected address is missing or invalid.
 * @example
 * compareRedirect({
 *   url: 'https://www.issoufi.fr/',
 *   status: 200,
 *   location: null,
 *   expectedUrl: 'https://issoufi.fr/',
 * }); // ['https://www.issoufi.fr/: status 200 instead of a redirect to https://issoufi.fr/']
 */
export const compareRedirect = ({ url, status, location, expectedUrl }) => {
  if (!hasValidAddresses({ url, expectedUrl })) {
    return ['A redirect check without a valid address and expected address cannot be compared'];
  }

  if (!isRedirectStatus(status)) {
    const servedStatus = Number.isInteger(status) ? status : 'unknown';
    return [`${url}: status ${servedStatus} instead of a redirect to ${expectedUrl}`];
  }

  const redirectUrl = resolveRedirectUrl({ url, status, location });
  if (redirectUrl === '') {
    return [`${url}: redirect without a valid location instead of ${expectedUrl}`];
  }
  if (redirectUrl !== expectedUrl) {
    return [`${url}: redirects to "${redirectUrl}" instead of ${expectedUrl}`];
  }
  return [];
};

/**
 * Answer of an address to a request that does not follow its redirect: one hop of a chain of
 * redirects.
 * @typedef {object} RedirectAnswer
 * @property {string} [url] - Address requested.
 * @property {number} [status] - Status it answered with.
 * @property {string | null} [location] - `Location` header of the answer, `null` when it has none.
 */

/**
 * Reads the addresses that a chain of answers redirects to, hop after hop, up to the first answer
 * that does not redirect to a valid address.
 * @param {(RedirectAnswer | null | undefined)[]} answers - Answers of the chain, in the order of
 * the requests.
 * @returns {string[]} The addresses, as {@link resolveRedirectUrl} reads them, one per answer
 * before the first one that does not redirect.
 */
const readRedirectUrls = answers => {
  const redirectUrls = answers.map(answer => resolveRedirectUrl({ ...answer }));
  const brokenHopIndex = redirectUrls.indexOf('');
  const hasBrokenHop = brokenHopIndex !== -1;
  return hasBrokenHop ? redirectUrls.slice(0, brokenHopIndex) : redirectUrls;
};

/**
 * Parameters of {@link compareRedirectChain}.
 * @typedef {object} CompareRedirectChainParams
 * @property {(RedirectAnswer | null | undefined)[]} [answers] - Answers of the chain of
 * redirects, in the order of the requests: the address checked, then each address that the
 * previous answer redirects to. Missing or empty, the check has no address.
 * @property {string} [expectedUrl] - Address that the first answer must redirect to, normalized as
 * `URL` writes it, e.g. `https://issoufi.fr/`.
 */

/**
 * Compares a chain of redirects with the address that its first answer must redirect to, in one
 * hop: a target reached through another address costs visitors and search engines a request more.
 * @param {CompareRedirectChainParams} params
 * @returns {string[]} The problems found, empty when the first answer redirects to `expectedUrl`.
 * When a later answer of the chain redirects to it, a single problem names the addresses in
 * between; otherwise, the problems of the first answer, as {@link compareRedirect} gives them.
 * @example
 * compareRedirectChain({
 *   answers: [
 *     { url: 'http://www.issoufi.fr/', status: 301, location: 'https://www.issoufi.fr/' },
 *     { url: 'https://www.issoufi.fr/', status: 301, location: 'https://issoufi.fr/' },
 *   ],
 *   expectedUrl: 'https://issoufi.fr/',
 * });
 * // ['http://www.issoufi.fr/: reaches https://issoufi.fr/ in 2 redirects instead of 1, through
 * // "https://www.issoufi.fr/"']
 */
export const compareRedirectChain = ({ answers, expectedUrl }) => {
  const chain = toList(answers);
  const firstAnswer = { ...chain[0] };
  const problems = compareRedirect({ ...firstAnswer, expectedUrl });

  const redirectUrls = readRedirectUrls(chain);
  const hopCount = redirectUrls.indexOf(expectedUrl ?? '') + 1;
  const isReachedInLaterHop =
    hopCount > 1 && hasValidAddresses({ url: firstAnswer.url, expectedUrl });
  if (!isReachedInLaterHop) return problems;

  const throughUrls = redirectUrls.slice(0, hopCount - 1).map(redirectUrl => `"${redirectUrl}"`);
  return [
    `${firstAnswer.url}: reaches ${expectedUrl} in ${hopCount} redirects instead of 1, through ` +
      throughUrls.join(', '),
  ];
};

/**
 * Requests an address without following its redirect.
 * @param {string} url - Address to request.
 * @returns {Promise<RedirectAnswer>} Its answer, whose body is not read.
 */
const requestWithoutRedirect = async url => {
  // The redirect is what is checked, so it is not followed
  const response = await fetch(url, { redirect: 'manual' });
  await response.body?.cancel();
  return { url, status: response.status, location: response.headers.get('location') };
};

/**
 * Parameters of {@link requestRedirectChain}.
 * @typedef {object} RequestRedirectChainParams
 * @property {string} url - Address to request first.
 * @property {string} expectedUrl - Address that ends the chain, without a request.
 */

/**
 * Requests an address, then each address that it redirects to, one request per hop, until an
 * answer that redirects to the expected address, an answer that does not redirect, a request that
 * fails after the first one, or {@link MAX_REDIRECT_HOPS} answers, which also ends a loop.
 * @param {RequestRedirectChainParams} params
 * @returns {Promise<RedirectAnswer[]>} The answers, in the order of the requests.
 * @throws {Error} When the first request fails.
 */
const requestRedirectChain = async ({ url, expectedUrl }) => {
  const answers = [await requestWithoutRedirect(url)];
  for (let hop = 1; hop < MAX_REDIRECT_HOPS; hop += 1) {
    const nextUrl = resolveRedirectUrl(answers[hop - 1]);
    const isChainOver = nextUrl === '' || nextUrl === expectedUrl;
    if (isChainOver) break;

    try {
      answers.push(await requestWithoutRedirect(nextUrl));
    } catch {
      // The first answer already tells where the chain goes wrong
      break;
    }
  }
  return answers;
};

/**
 * Parameters of {@link checkRedirect}.
 * @typedef {object} CheckRedirectParams
 * @property {string} [url] - Address to request, e.g. `http://issoufi.fr/`.
 * @property {string} [expectedUrl] - Address it must redirect to, normalized as `URL` writes it,
 * e.g. `https://issoufi.fr/`.
 */

/**
 * Requests an address without following its redirect, and checks that it redirects to the
 * expected address in one hop. When it redirects elsewhere, the check follows the chain, one
 * request per hop, to tell a target reached in several hops from a wrong target.
 * @param {CheckRedirectParams} params
 * @returns {Promise<string[]>} The problems found, empty when the address redirects to
 * `expectedUrl` in one hop, as {@link compareRedirectChain} gives them. A first request that
 * fails is a problem too, and a missing or invalid address a single problem, without a request.
 * @example
 * await checkRedirect({ url: 'http://issoufi.fr/', expectedUrl: 'https://issoufi.fr/' }); // []
 */
export const checkRedirect = async ({ url, expectedUrl }) => {
  // compareRedirect reports the invalid addresses
  if (!hasValidAddresses({ url, expectedUrl })) return compareRedirect({ url, expectedUrl });

  try {
    const answers = await requestRedirectChain({
      url: /** @type {string} */ (url),
      expectedUrl: /** @type {string} */ (expectedUrl),
    });
    return compareRedirectChain({ answers, expectedUrl });
  } catch (error) {
    return [`${url}: request failed (${getErrorMessage(error)})`];
  }
};

/**
 * Redirect of the `_redirects` file of Cloudflare Pages, read by {@link parseRedirectRules}.
 * @typedef {object} RedirectRule
 * @property {string} source - Path that redirects, e.g. `/code`.
 * @property {string} target - Address or path that it redirects to.
 * @property {number} status - Status of the redirect.
 */

/**
 * Tells whether the fields of a line of `_redirects` make a redirect: a source path, a target,
 * then a redirect status or none.
 * @param {string[]} fields - Fields of the line, split on its spaces.
 * @returns {boolean} False for fewer than two or more than three fields, a source that is not a
 * path, or a status that is not one of {@link REDIRECT_STATUSES}, such as the 200 of a rewrite.
 */
const isRedirectLine = fields => {
  const [source, target, status] = fields;
  const hasFieldCount =
    fields.length >= MIN_REDIRECT_FIELD_COUNT && fields.length <= MAX_REDIRECT_FIELD_COUNT;
  const isSourcePath = typeof source === 'string' && source.startsWith('/');
  const hasRedirectStatus = status === undefined || isRedirectStatus(Number(status));
  return hasFieldCount && isSourcePath && Boolean(target) && hasRedirectStatus;
};

/**
 * Tells whether a line of `_redirects`, trimmed, holds a rule: neither blank nor a comment.
 * @param {string} line - Line of the file, without its spaces around.
 * @returns {boolean} False for an empty line or a comment.
 */
const isRuleLine = line => line !== '' && !line.startsWith(REDIRECT_COMMENT_MARK);

/**
 * Reads the redirects of a `_redirects` file of Cloudflare Pages, one per line: its source path,
 * its target, then its status, {@link DEFAULT_REDIRECT_STATUS} when the line gives none. Blank
 * lines and comments are left out, and so is a line that is no redirect (see
 * {@link isRedirectLine}).
 * @param {unknown} text - Content of the file.
 * @returns {RedirectRule[]} The redirects, in the order of the file, none when `text` is not a
 * string.
 * @example
 * parseRedirectRules('# Short links\n/code https://github.com/AIssoufi/issoufi.fr 302\n');
 * // [{ source: '/code', target: 'https://github.com/AIssoufi/issoufi.fr', status: 302 }]
 */
export const parseRedirectRules = text =>
  (typeof text === 'string' ? text : '')
    .split(LINE_BREAK_PATTERN)
    .map(line => line.trim())
    .filter(isRuleLine)
    .map(line => line.split(REDIRECT_FIELD_SEPARATOR_PATTERN))
    .filter(isRedirectLine)
    .map(([source, target, status]) => ({
      source,
      target,
      status: status === undefined ? DEFAULT_REDIRECT_STATUS : Number(status),
    }));

/**
 * Parameters of {@link getRedirectChecks}.
 * @typedef {object} GetRedirectChecksParams
 * @property {RedirectRule[]} rules - Redirects of the build, from {@link parseRedirectRules}.
 * @property {string} siteUrl - Address of the deployed site, against which the paths resolve.
 */

/**
 * Turns the redirects of the build into the checks of {@link checkRedirect} on a deployed site:
 * the address of each source on the site, and the address of its target, a path of the site
 * resolved against it. A source that matches many paths, a splat or a placeholder, has no single
 * address to request, so it gets no check.
 * @param {GetRedirectChecksParams} params
 * @returns {CheckRedirectParams[]} One check per redirect whose source is a single path and whose
 * addresses are valid.
 * @example
 * getRedirectChecks({
 *   rules: [{ source: '/code', target: 'https://github.com/AIssoufi/issoufi.fr', status: 302 }],
 *   siteUrl: 'https://develop.issoufi-fr.pages.dev/',
 * });
 * // [{
 * //   url: 'https://develop.issoufi-fr.pages.dev/code',
 * //   expectedUrl: 'https://github.com/AIssoufi/issoufi.fr',
 * // }]
 */
export const getRedirectChecks = ({ rules, siteUrl }) => {
  /** @param {unknown} rule */
  const isCheckableRule = rule => {
    const { source, target } = /** @type {Partial<RedirectRule>} */ (rule ?? {});
    const hasTexts = typeof source === 'string' && typeof target === 'string';
    if (!hasTexts) return false;

    const isSinglePath = !REDIRECT_PATTERN_MARK_PATTERN.test(source);
    const canResolve = URL.canParse(source, siteUrl) && URL.canParse(target, siteUrl);
    return isSinglePath && canResolve;
  };

  return toList(rules)
    .filter(isCheckableRule)
    .map(({ source, target }) => ({
      url: new URL(source, siteUrl).href,
      expectedUrl: new URL(target, siteUrl).href,
    }));
};
