import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseRedirectRules, type RedirectRule } from '../../scripts/ci/utils/redirects.mjs';
import { PATH_SEPARATOR } from '../../src/i18n/constants.ts';
import { REDIRECTS_FILE_NAME } from '../constants.ts';
import {
  CLOUDFLARE_CONFIG_FILES,
  FOLDER_INDEX_FILE_NAME,
  PAGE_FILE_EXTENSION,
  REQUEST_URL_BASE,
  TARGET_QUERY_POSITION_PATTERN,
  URL_QUERY_AND_FRAGMENT_PATTERN,
} from './constants.ts';
import { isExactFile } from './utils/files.ts';

/**
 * Reads the path at which Cloudflare Pages serves a file of the build, to which it redirects the
 * other paths that name it: the index of a folder at the path of its folder, with a trailing slash,
 * a page without its {@link PAGE_FILE_EXTENSION}, and any other file at its own path.
 *
 * @param file - Path of the file from the root of the build, without a leading `/`, as
 * `findExactFile` finds it, e.g. `en/projects.html`.
 * @returns The path, starting with `/`, e.g. `/en/projects`.
 *
 * @example
 * getCanonicalPath('en/index.html'); // '/en/'
 * getCanonicalPath('en/projects.html'); // '/en/projects'
 * getCanonicalPath('favicon.svg'); // '/favicon.svg'
 */
export const getCanonicalPath = (file: string): string => {
  const path = `${PATH_SEPARATOR}${file}`;
  const isFolderIndex = path.endsWith(`${PATH_SEPARATOR}${FOLDER_INDEX_FILE_NAME}`);
  if (isFolderIndex) return path.slice(0, -FOLDER_INDEX_FILE_NAME.length);

  // A file named only `.html` is no page of a name
  const isNamedPage =
    path.endsWith(PAGE_FILE_EXTENSION) && !path.endsWith(`${PATH_SEPARATOR}${PAGE_FILE_EXTENSION}`);
  return isNamedPage ? path.slice(0, -PAGE_FILE_EXTENSION.length) : path;
};

/**
 * Reads the query of a URL, which Cloudflare Pages keeps in its redirects.
 *
 * @param url - URL of a request, as Node.js gives it (`request.url`), e.g. `/en?a=1`, or target of
 * a redirect, an address or a path.
 * @returns The query with its `?`, e.g. `?a=1`, or an empty string for a URL without a query, a
 * value that is not a string and a URL that does not parse.
 *
 * @example
 * getUrlQuery('/en?a=1#top'); // '?a=1'
 * getUrlQuery('/en'); // ''
 */
export const getUrlQuery = (url: unknown): string => {
  if (typeof url !== 'string') return '';

  try {
    return new URL(url, REQUEST_URL_BASE).search;
  } catch {
    return '';
  }
};

/** Parameters of {@link getRedirectLocation}. */
interface GetRedirectLocationParams {
  /** Decoded path of the request, starting with `/` (see `getRequestPathname`). */
  pathname: string;
  /** Path of the file of the build that the request names, without a leading `/`. */
  file: string;
  /** URL of the request, as Node.js gives it, whose query the redirect keeps. */
  url?: unknown;
}

/**
 * Reads where Cloudflare Pages redirects a request that names a file of the build by another path
 * than its canonical one (see {@link getCanonicalPath}): `/en` to `/en/`, `/projects/` and
 * `/projects.html` to `/projects`, with the query of the request.
 *
 * @returns The value of the `Location` header, a path encoded as a URL, or `undefined` when the
 * request already names the canonical path.
 *
 * @example
 * getRedirectLocation({ pathname: '/en', file: 'en/index.html', url: '/en?a=1' }); // '/en/?a=1'
 * getRedirectLocation({ pathname: '/projects', file: 'projects.html' }); // undefined
 */
export const getRedirectLocation = ({
  pathname,
  file,
  url,
}: GetRedirectLocationParams): string | undefined => {
  const canonicalPath = getCanonicalPath(file);
  if (canonicalPath === pathname) return undefined;

  return `${encodeURI(canonicalPath)}${getUrlQuery(url)}`;
};

/**
 * Reads the redirects of the `_redirects` file at the root of the build, named in that exact case
 * (see `parseRedirectRules`). It reads a build of the disk, so it is called for each request.
 *
 * @param root - Absolute path of the build that the preview serves, `dist/`.
 * @returns The redirects in the order of the file, none for a build without that file.
 *
 * @example
 * readRedirectRules('/app/dist');
 * // [{ source: '/code', target: 'https://github.com/AIssoufi/issoufi.fr', status: 302 }]
 */
export const readRedirectRules = (root: string): RedirectRule[] => {
  if (!isExactFile({ root, file: REDIRECTS_FILE_NAME })) return [];

  return parseRedirectRules(readFileSync(join(root, REDIRECTS_FILE_NAME), 'utf8'));
};

/** Parameters of {@link findRedirectRule}. */
interface FindRedirectRuleParams {
  /** Redirects of the build, in the order of the file. */
  rules: readonly RedirectRule[];
  /** URL of the request, as Node.js gives it (`request.url`). */
  url?: unknown;
}

/**
 * Finds the first redirect whose source is the path of a request, as Cloudflare Pages matches it:
 * whole, case included and not decoded, so `/Code` and `/c%6Fde` match no `/code`, and `/code/`
 * matches it only by a rule of its own. A source with a splat or a placeholder only matches
 * itself, since the preview reads no pattern.
 *
 * @returns The redirect, or `undefined` when none matches or the URL is not a string.
 *
 * @example
 * findRedirectRule({ rules, url: '/code?a=1' }); // { source: '/code', … }
 */
export const findRedirectRule = ({
  rules,
  url,
}: FindRedirectRuleParams): RedirectRule | undefined => {
  if (typeof url !== 'string') return undefined;

  const requestPath = url.replace(URL_QUERY_AND_FRAGMENT_PATTERN, '');
  return rules.find(({ source }) => source === requestPath);
};

/** Parameters of {@link getRuleLocation}. */
interface GetRuleLocationParams {
  /** Target of the redirect, an address or a path. */
  target: string;
  /** URL of the request, as Node.js gives it, whose query the redirect keeps. */
  url?: unknown;
}

/**
 * Reads the location of a redirect of `_redirects`: its target with the query of the request, as
 * Cloudflare Pages keeps it, unless the target has a query of its own.
 *
 * @returns The value of the `Location` header.
 *
 * @example
 * getRuleLocation({ target: 'https://example.com/a#b', url: '/code?c=1' });
 * // 'https://example.com/a?c=1#b'
 */
export const getRuleLocation = ({ target, url }: GetRuleLocationParams): string => {
  const hasOwnQuery = getUrlQuery(target) !== '';
  if (hasOwnQuery) return target;

  return target.replace(TARGET_QUERY_POSITION_PATTERN, () => getUrlQuery(url));
};

/**
 * Tells whether a path names a configuration file of Cloudflare Pages at the root of the build
 * (see {@link CLOUDFLARE_CONFIG_FILES}), which it answers with its not found page, case included.
 *
 * @param pathname - Decoded path of a request, starting with `/`.
 *
 * @example
 * isCloudflareConfigFile('/_headers'); // true
 * isCloudflareConfigFile('/en/_headers'); // false
 */
export const isCloudflareConfigFile = (pathname: string): boolean =>
  pathname.startsWith(PATH_SEPARATOR) &&
  CLOUDFLARE_CONFIG_FILES.has(pathname.slice(PATH_SEPARATOR.length));
