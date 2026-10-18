import { existsSync, readdirSync, statSync } from 'node:fs';

import { OPTIONAL_ESCAPE_PATTERN, QUOTE_PATTERN } from '../constants';
import { escapeRegExp, isFileName } from './strings';

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
