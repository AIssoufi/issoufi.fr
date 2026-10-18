import { existsSync, readdirSync, statSync } from 'node:fs';

import {
  HTML_FILE_PATTERN,
  OPTIONAL_ESCAPE_PATTERN,
  QUOTE_PATTERN,
  REGEXP_SPECIAL_CHARACTERS,
  ROUTER_MODULE,
  STANDALONE_PAGE_FILE_NAME,
  TRAILING_SLASHES_PATTERN,
} from './constants';

/** Parameters of {@link isAppRouterImport}. */
interface IsAppRouterImportParams {
  /** Module being imported, as written in the import, e.g. `react-router`. */
  source?: string;
  /**
   * Absolute path, with `/` separators, of the module that imports it. Missing for an entry
   * point.
   */
  importer?: string;
  /** Absolute path, with `/` separators, of the folder of the app's code, e.g. `/app/src`. */
  appDir?: string;
}

/**
 * Tells whether a module of the app imports the router, `react-router`, which the standalone
 * build replaces with `vite/standalone/react-router.ts`. Imports from anywhere else keep the real
 * module, such as the one of that replacement module, so it can re-export it.
 *
 * @returns `true` for an import of `react-router` from a file inside `appDir`, `false` otherwise,
 * and when the importer or the folder is missing or empty.
 *
 * @example
 * const appDir = '/app/src';
 * isAppRouterImport({ source: 'react-router', importer: '/app/src/App/App.tsx', appDir }); // true
 * isAppRouterImport({ source: 'react-router', importer: '/app/vite/x.ts', appDir }); // false
 */
export const isAppRouterImport = ({
  source,
  importer,
  appDir,
}: IsAppRouterImportParams = {}): boolean => {
  const isRouterImport = source === ROUTER_MODULE;
  const appDirPath = typeof appDir === 'string' ? appDir.replace(TRAILING_SLASHES_PATTERN, '') : '';
  const canComparePaths = isRouterImport && typeof importer === 'string' && appDirPath !== '';
  if (!canComparePaths) return false;

  return importer.startsWith(`${appDirPath}/`);
};

/** Escapes the characters of a text that have a meaning in a regular expression. */
const escapeRegExp = (text: string) => text.replace(REGEXP_SPECIAL_CHARACTERS, '\\$&');

/** Tells whether a value is the name of a file: a string that is not empty or blank. */
const isFileName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** Parameters of {@link toRelativePublicUrls}. */
interface ToRelativePublicUrlsParams {
  /** Code of a module of the app. Missing or not a string, it counts as empty. */
  code?: string;
  /**
   * Names of the files at the root of `public/`, e.g. `home.webp`. Missing, empty or blank names
   * are ignored.
   */
  fileNames?: readonly string[];
}

/**
 * Turns the absolute URLs of the files of `public/` that the code of the app writes as strings,
 * such as `'/home.webp'`, into URLs relative to the page, `'./home.webp'`. The standalone build is
 * opened from the disk, where an absolute URL points to the root of the disk instead of the
 * folder of the page. Only a whole string naming one of the files changes, between single, double
 * or back quotes, escaped or not (as in a JSON module that Vite turns into a string):
 * `'/home.webp.bak'` or `'/assets/home.webp'` stay as they are.
 *
 * @returns The code with relative URLs, or the code unchanged when it names none of the files.
 *
 * @example
 * toRelativePublicUrls({ code: 'const url = "/home.webp";', fileNames: ['home.webp'] });
 * // 'const url = "./home.webp";'
 */
export const toRelativePublicUrls = ({
  code,
  fileNames,
}: ToRelativePublicUrlsParams = {}): string => {
  const source = typeof code === 'string' ? code : '';
  const names = Array.isArray(fileNames) ? fileNames.filter(isFileName) : [];
  const canNameAFile = source !== '' && names.length > 0;
  if (!canNameAFile) return source;

  const namePattern = names.map(escapeRegExp).join('|');
  const urlPattern = new RegExp(
    `(?<=${QUOTE_PATTERN})/(?:${namePattern})(?=${OPTIONAL_ESCAPE_PATTERN}${QUOTE_PATTERN})`,
    'g',
  );
  return source.replace(urlPattern, url => `.${url}`);
};

/**
 * Tells whether a file of the build is an HTML page that only a web server needs: every page but
 * `index.html`, such as `projects.html` or `404.html`. Opened from the disk, the standalone build
 * shows every route from `index.html`.
 *
 * @param fileName - Path of the file in the build, e.g. `projects.html`.
 * @returns `true` for an HTML page other than `index.html`, `false` otherwise, and when the name
 * is missing or not a string.
 *
 * @example
 * isServerOnlyPage('404.html'); // true
 * isServerOnlyPage('index.html'); // false
 */
export const isServerOnlyPage = (fileName?: unknown): boolean => {
  const isHtmlFile = typeof fileName === 'string' && HTML_FILE_PATTERN.test(fileName);
  const isStandalonePage = fileName === STANDALONE_PAGE_FILE_NAME;
  return isHtmlFile && !isStandalonePage;
};

/**
 * Lists the names of the files at the root of a folder, such as `public/`, without its
 * subfolders.
 *
 * @param dir - Absolute path of the folder, Vite's `publicDir`, empty when the project has none.
 * @returns The names of its files, or none when the path is missing, empty or not a folder.
 *
 * @example
 * listFileNames('/app/public'); // ['favicon.ico', 'home.webp', …]
 */
export const listFileNames = (dir?: unknown): string[] => {
  const isFolder =
    typeof dir === 'string' && dir !== '' && existsSync(dir) && statSync(dir).isDirectory();
  if (!isFolder) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
};
