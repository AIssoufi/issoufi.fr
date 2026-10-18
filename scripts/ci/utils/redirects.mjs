// @ts-check
import { REDIRECT_STATUSES } from '../constants.mjs';

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
  const hasLocation =
    typeof location === 'string' && location.trim() !== '' && URL.canParse(location, url);
  if (!isRedirectStatus(status) || !hasLocation) return '';

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
 * Parameters of {@link checkRedirect}.
 * @typedef {object} CheckRedirectParams
 * @property {string} [url] - Address to request, e.g. `http://issoufi.fr/`.
 * @property {string} [expectedUrl] - Address it must redirect to, normalized as `URL` writes it,
 * e.g. `https://issoufi.fr/`.
 */

/**
 * Requests an address without following its redirect, and checks that it redirects to the
 * expected address.
 * @param {CheckRedirectParams} params
 * @returns {Promise<string[]>} The problems found, empty when the address redirects to
 * `expectedUrl`. A request that fails is a problem too, and a missing or invalid address a single
 * problem, without a request.
 * @example
 * await checkRedirect({ url: 'http://issoufi.fr/', expectedUrl: 'https://issoufi.fr/' }); // []
 */
export const checkRedirect = async ({ url, expectedUrl }) => {
  // compareRedirect reports the invalid addresses
  if (!hasValidAddresses({ url, expectedUrl })) return compareRedirect({ url, expectedUrl });

  try {
    // The redirect is what is checked, so it is not followed
    const response = await fetch(/** @type {string} */ (url), { redirect: 'manual' });
    await response.body?.cancel();
    return compareRedirect({
      url,
      status: response.status,
      location: response.headers.get('location'),
      expectedUrl,
    });
  } catch (error) {
    return [`${url}: request failed (${error instanceof Error ? error.message : error})`];
  }
};
