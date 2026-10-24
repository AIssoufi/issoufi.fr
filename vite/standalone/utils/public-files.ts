import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { OPTIONAL_ESCAPE_PATTERN, QUOTE_PATTERN } from '../constants.ts';
import { escapeRegExp } from '../../utils/strings.ts';
import { isServerOnlyFile } from './bundle.ts';
import { isFileName } from './strings.ts';

/** Tells whether a value is the path of a folder that exists. */
const isFolderPath = (dir?: unknown): dir is string =>
  typeof dir === 'string' && dir !== '' && existsSync(dir) && statSync(dir).isDirectory();

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
  if (!isFolderPath(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name);
};

/**
 * Lists the files of a folder, such as `public/`, that the standalone build copies next to its
 * page: every file, in its subfolders too, but those that only a web server or a crawler reads
 * (see {@link isServerOnlyFile}), such as `robots.txt` or the `_redirects` of Cloudflare Pages.
 *
 * @param dir - Absolute path of the folder, Vite's `publicDir`, empty when the project has none.
 * @returns The paths of its files from the folder, with `/` between folders, sorted, or none when
 * the path is missing, empty or not a folder.
 *
 * @example
 * listStandalonePublicFiles('/app/public'); // ['favicon.ico', 'fonts/montserrat.woff2', …]
 */
export const listStandalonePublicFiles = (dir?: unknown): string[] => {
  if (!isFolderPath(dir)) return [];

  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .filter(fileName => !isServerOnlyFile(fileName))
    .sort();
};

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
