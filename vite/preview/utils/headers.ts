import { PATH_SEPARATOR } from '../../../src/i18n/constants.ts';
import { HEADER_PATH_PATTERN, HEADER_RULES, LINE_BREAK_PATTERN } from '../../constants.ts';
import type { HeaderRule } from '../../types.ts';
import { escapeRegExp } from '../../utils/strings.ts';
import {
  CACHE_CONTROL_HEADER,
  HEADER_PATH_WILDCARD,
  HEADER_VALUE_SEPARATOR,
} from '../constants.ts';

/**
 * Turns the path pattern of a rule of `_headers` into a regular expression of the whole path,
 * where each {@link HEADER_PATH_WILDCARD} matches any part, slashes included, as Cloudflare Pages
 * reads it: `/assets/*` matches `/assets/a.js` and `/assets/a/b.js`, not `/assets`. A placeholder
 * of Cloudflare Pages (`/:lang/*`) matches only itself, since no rule of the site uses one.
 */
const toHeaderPathRegExp = (pattern: string): RegExp => {
  const parts = pattern.split(HEADER_PATH_WILDCARD).map(escapeRegExp);
  return new RegExp(`^${parts.join('.*')}$`, 's');
};

/**
 * Tells whether a header of a rule is a cache policy that `_headers` writes: its name is
 * {@link CACHE_CONTROL_HEADER}, without case, and its value a string that is not blank and holds
 * no line break.
 */
const isCacheControlHeader = (header: [string, unknown]): header is [string, string] => {
  const [name, value] = header;
  const isCacheControlName = name.toLowerCase() === CACHE_CONTROL_HEADER.toLowerCase();
  const isWritableValue =
    typeof value === 'string' && value.trim() !== '' && !LINE_BREAK_PATTERN.test(value);
  return isCacheControlName && isWritableValue;
};

/** Parameters of {@link readRuleCacheControl}. */
interface ReadRuleCacheControlParams {
  /** Rule of `_headers`, from a list that may hold anything. */
  rule: unknown;
  /** Decoded path of a request, starting with `/`. */
  pathname: string;
}

/**
 * Reads the cache policies that a rule of `_headers` gives to a path, trimmed: none for a value
 * that is not a rule, a rule that names a host, a rule whose path the build does not write (see
 * {@link HEADER_PATH_PATTERN}), and a rule whose path pattern does not match.
 */
const readRuleCacheControl = ({ rule, pathname }: ReadRuleCacheControlParams): string[] => {
  const isObject = typeof rule === 'object' && rule !== null;
  if (!isObject) return [];

  const { path, headers } = rule as Partial<HeaderRule>;
  const isPathRule =
    typeof path === 'string' && path.startsWith(PATH_SEPARATOR) && HEADER_PATH_PATTERN.test(path);
  const hasHeaders = typeof headers === 'object' && headers !== null;
  if (!isPathRule || !hasHeaders) return [];

  const isMatchingPath = toHeaderPathRegExp(path).test(pathname);
  if (!isMatchingPath) return [];

  return Object.entries(headers as Record<string, unknown>)
    .filter(isCacheControlHeader)
    .map(([, value]) => value.trim());
};

/** Parameters of {@link getCacheControl}. */
interface GetCacheControlParams {
  /** Decoded path of a request, starting with `/` (see `getRequestPathname`). */
  pathname: string;
  /**
   * Rules of `_headers` to read. Defaults to {@link HEADER_RULES}, which the build writes to
   * `dist/_headers`. Any value that is not an array counts as none.
   */
  rules?: readonly HeaderRule[];
}

/**
 * Reads the cache policy that Cloudflare Pages sends with a path: the {@link CACHE_CONTROL_HEADER}
 * of every rule of `_headers` whose path pattern, starting with `/`, matches it, in the order of
 * the rules, joined as Cloudflare Pages joins them. A rule that names a host
 * (`https://issoufi-fr.pages.dev/*`) is left out, since the preview serves no host of the site.
 *
 * @returns The value of the header, or `undefined` when no rule gives the path one.
 *
 * @example
 * getCacheControl({ pathname: '/assets/montserrat-latin-a1b2.woff2' });
 * // 'public, max-age=31536000, immutable'
 * getCacheControl({ pathname: '/experiences' }); // undefined
 */
export const getCacheControl = ({
  pathname,
  rules = HEADER_RULES,
}: GetCacheControlParams): string | undefined => {
  const values = (Array.isArray(rules) ? rules : []).flatMap((rule: unknown) =>
    readRuleCacheControl({ rule, pathname }),
  );
  return values.length > 0 ? values.join(HEADER_VALUE_SEPARATOR) : undefined;
};
