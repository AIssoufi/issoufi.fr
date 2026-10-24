import { type Dirent, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PATH_SEPARATOR } from '../../src/i18n/constants.ts';
import { NOT_FOUND_FILE_NAME } from '../../src/utils/pages.ts';
import { HEADER_PATH_PATTERN, HEADER_RULES, LINE_BREAK_PATTERN } from '../constants.ts';
import type { HeaderRule } from '../types.ts';
import { escapeRegExp } from '../utils/strings.ts';
import {
  CACHE_CONTROL_HEADER,
  FOLDER_INDEX_FILE_NAME,
  HEADER_PATH_WILDCARD,
  HEADER_VALUE_SEPARATOR,
  PAGE_FILE_EXTENSION,
  URL_QUERY_AND_FRAGMENT_PATTERN,
} from './constants.ts';

/**
 * Reads the path of a request URL, without its query and fragment, decoded.
 *
 * @param url - URL of the request, as Node.js gives it (`request.url`), e.g. `/en/projects?a=1`.
 * @returns The decoded path, e.g. `/en/projects`, or `undefined` for a value that is not a string,
 * a URL that does not start with `/` (`*`, a proxy request) and a path that does not decode.
 *
 * @example
 * getRequestPathname('/projets/un%20lien?a=1'); // '/projets/un lien'
 * getRequestPathname('/%E0%A4%A'); // undefined
 */
export const getRequestPathname = (url: unknown): string | undefined => {
  const isPathUrl = typeof url === 'string' && url.startsWith(PATH_SEPARATOR);
  if (!isPathUrl) return undefined;

  try {
    return decodeURIComponent(url.replace(URL_QUERY_AND_FRAGMENT_PATTERN, ''));
  } catch {
    return undefined;
  }
};

/**
 * Lists the files of the build that a path names for Cloudflare Pages, which serves the first one
 * that exists, or redirects to it: the file itself, the page without its extension, and the index
 * of a folder. A path with a trailing slash names the index of its folder, or the page that
 * Cloudflare Pages redirects it to (`/projects/` to `/projects`).
 *
 * @param pathname - Decoded path of a request, starting with `/` (see {@link getRequestPathname}).
 * @returns The paths of the files from the root of the build, without a leading `/`.
 *
 * @example
 * getServedFiles('/projects'); // ['projects', 'projects.html', 'projects/index.html']
 * getServedFiles('/en/'); // ['en/index.html', 'en.html']
 * getServedFiles('/'); // ['index.html']
 */
export const getServedFiles = (pathname: string): string[] => {
  const file = pathname.slice(PATH_SEPARATOR.length);
  const isFolderPath = pathname.endsWith(PATH_SEPARATOR);
  if (!isFolderPath) {
    return [
      file,
      `${file}${PAGE_FILE_EXTENSION}`,
      `${file}${PATH_SEPARATOR}${FOLDER_INDEX_FILE_NAME}`,
    ];
  }

  const folderIndex = `${file}${FOLDER_INDEX_FILE_NAME}`;
  const isRoot = file === '';
  if (isRoot) return [folderIndex];

  return [folderIndex, `${file.slice(0, -PATH_SEPARATOR.length)}${PAGE_FILE_EXTENSION}`];
};

/**
 * Lists the not found pages that Cloudflare Pages may serve for a path that names no file: the
 * {@link NOT_FOUND_FILE_NAME} of each folder of the path, the closest first, up to the root of
 * the build. `en/404.html` thus answers the paths under `/en/`, and `404.html` the others.
 *
 * @param pathname - Decoded path of a request, starting with `/` (see {@link getRequestPathname}).
 * @returns The paths of the files from the root of the build, without a leading `/`.
 *
 * @example
 * getNotFoundPageFiles('/en/a/b'); // ['en/a/404.html', 'en/404.html', '404.html']
 * getNotFoundPageFiles('/nope'); // ['404.html']
 */
export const getNotFoundPageFiles = (pathname: string): string[] => {
  const folders = pathname.split(PATH_SEPARATOR).slice(1, -1);

  return Array.from({ length: folders.length + 1 }, (_, depth) =>
    [...folders.slice(0, folders.length - depth), NOT_FOUND_FILE_NAME].join(PATH_SEPARATOR),
  );
};

/** Parameters of {@link hasEntry}. */
interface HasEntryParams {
  /** Absolute path of the folder to read. */
  folder: string;
  /** Name of the entry, matched with case. */
  name: string;
  /** Whether the entry must be a folder, rather than a file. */
  isFolder: boolean;
}

/** Tells whether a folder holds a file or a folder of that exact name, `false` when it is none. */
const hasEntry = ({ folder, name, isFolder }: HasEntryParams): boolean => {
  const isWantedEntry = (entry: Dirent) => {
    const hasWantedType = isFolder ? entry.isDirectory() : entry.isFile();
    return entry.name === name && hasWantedType;
  };
  try {
    return readdirSync(folder, { withFileTypes: true }).some(isWantedEntry);
  } catch {
    return false;
  }
};

/** Parameters of {@link isExactFile} and {@link findExactFile}. */
interface ExactFileParams {
  /** Absolute path of the root of the build. */
  root: string;
}

/** Parameters of {@link isExactFile}. */
interface IsExactFileParams extends ExactFileParams {
  /** Path of the file from the root, without a leading `/`, e.g. `en/404.html`. */
  file: string;
}

/**
 * Tells whether the build holds a file at that path, case included, as Cloudflare Pages matches
 * it, even on a disk that ignores case, such as that of macOS. The path is read folder by folder,
 * from the names that the disk lists, so `..` and an empty segment name no file.
 *
 * @returns `true` for a file, `false` for a folder, a path that differs in case, a missing path
 * and a missing root.
 *
 * @example
 * isExactFile({ root: '/app/dist', file: 'en/404.html' }); // true
 * isExactFile({ root: '/app/dist', file: 'Projects.html' }); // false
 */
export const isExactFile = ({ root, file }: IsExactFileParams): boolean => {
  const segments = file.split(PATH_SEPARATOR);
  const lastIndex = segments.length - 1;

  return segments.every((name, index) =>
    hasEntry({
      folder: join(root, ...segments.slice(0, index)),
      name,
      isFolder: index < lastIndex,
    }),
  );
};

/** Parameters of {@link findExactFile}. */
interface FindExactFileParams extends ExactFileParams {
  /** Paths of the files from the root, without a leading `/`, in the order to try them. */
  files: readonly string[];
}

/**
 * Finds the first of the files that the build holds, case included (see {@link isExactFile}).
 *
 * @returns Its path from the root, or `undefined` when the build holds none.
 *
 * @example
 * findExactFile({ root: '/app/dist', files: ['en/a/404.html', 'en/404.html'] }); // 'en/404.html'
 */
export const findExactFile = ({ root, files }: FindExactFileParams): string | undefined =>
  files.find(file => isExactFile({ root, file }));

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
  /** Decoded path of a request, starting with `/` (see {@link getRequestPathname}). */
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
