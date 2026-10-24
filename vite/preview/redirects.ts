import { PATH_SEPARATOR } from '../../src/i18n/constants.ts';
import {
  CLOUDFLARE_CONFIG_FILES,
  FOLDER_INDEX_FILE_NAME,
  PAGE_FILE_EXTENSION,
  REQUEST_URL_BASE,
} from './constants.ts';

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
 * Reads the query of a request URL, which Cloudflare Pages keeps in its redirects.
 *
 * @param url - URL of the request, as Node.js gives it (`request.url`), e.g. `/en?a=1`.
 * @returns The query with its `?`, e.g. `?a=1`, or an empty string for a URL without a query, a
 * value that is not a string and a URL that does not parse.
 *
 * @example
 * getRequestQuery('/en?a=1#top'); // '?a=1'
 * getRequestQuery('/en'); // ''
 */
export const getRequestQuery = (url: unknown): string => {
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

  return `${encodeURI(canonicalPath)}${getRequestQuery(url)}`;
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
