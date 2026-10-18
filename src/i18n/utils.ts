import { DEFAULT_LANGUAGE, LANGUAGES, PATH_SEPARATOR, ROOT_PATH } from './constants';
import type { Language } from './types';

/**
 * Tells whether a value is the code of one of the site's {@link LANGUAGES}. Codes are matched
 * exactly, as i18next does: `'EN'` and `'en-US'` are not languages of the site.
 *
 * @param value - Any value, typically one read from outside the code, such as the storage.
 *
 * @example
 * isLanguage('en'); // true
 * isLanguage('de'); // false
 * isLanguage(null); // false
 */
export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(language => language === value);

/**
 * Reads a URL path, such as `location.pathname`.
 *
 * @returns The path itself, or the root path when it is missing, empty or not a string.
 */
const toPathname = (value: unknown): string =>
  typeof value === 'string' && value !== '' ? value : ROOT_PATH;

/**
 * Prefix of the URLs of a language: none for the {@link DEFAULT_LANGUAGE}, and a slash followed by
 * the language code for the others.
 *
 * @param language - Language of the URLs. A value that is not one of the {@link LANGUAGES}
 * counts as the default language.
 * @returns `''` for the default language, e.g. `'/en'` for English.
 *
 * @example
 * getLanguagePrefix('fr'); // ''
 * getLanguagePrefix('en'); // '/en'
 */
export const getLanguagePrefix = (language: unknown): string => {
  const hasPrefix = isLanguage(language) && language !== DEFAULT_LANGUAGE;
  return hasPrefix ? `${PATH_SEPARATOR}${language}` : '';
};

/** A URL path split by {@link splitLanguagePrefix}. */
interface LocalizedPath {
  /** Language of the path: the one of its prefix, or the default language without one. */
  language: Language;
  /** Path of the same page in the default language, e.g. `/projects`, or `/` for a home page. */
  pagePath: string;
}

/**
 * Splits a URL path into its language and the path of the page in the default language. The
 * prefix is matched whatever its case, as the router matches the routes.
 */
const splitLanguagePrefix = (pathname: unknown): LocalizedPath => {
  const path = toPathname(pathname);
  const [, firstSegment = '', ...pageSegments] = path.split(PATH_SEPARATOR);
  const prefixLanguage = firstSegment.toLowerCase();

  const isPrefixed = isLanguage(prefixLanguage) && prefixLanguage !== DEFAULT_LANGUAGE;
  if (!isPrefixed) return { language: DEFAULT_LANGUAGE, pagePath: path };

  return {
    language: prefixLanguage,
    pagePath: `${PATH_SEPARATOR}${pageSegments.join(PATH_SEPARATOR)}`,
  };
};

/**
 * Reads the language of a URL path from its prefix (see {@link getLanguagePrefix}).
 *
 * @param pathname - Path of a URL, e.g. `location.pathname`.
 * @returns The language of the prefix, whatever its case, or the {@link DEFAULT_LANGUAGE} for a
 * path without one, a missing path and a value that is not a string.
 *
 * @example
 * getPathLanguage('/en/projects'); // 'en'
 * getPathLanguage('/projects'); // 'fr'
 * getPathLanguage('/english'); // 'fr'
 */
export const getPathLanguage = (pathname: unknown): Language =>
  splitLanguagePrefix(pathname).language;

/**
 * Removes the language prefix of a URL path, which gives the path of the same page in the
 * {@link DEFAULT_LANGUAGE}.
 *
 * @param pathname - Path of a URL, e.g. `location.pathname`.
 * @returns The path without its prefix, `/` for the home page of a language, and the root path
 * for a missing path and a value that is not a string. A path without a prefix is returned as is.
 *
 * @example
 * removeLanguagePrefix('/en/projects'); // '/projects'
 * removeLanguagePrefix('/en/'); // '/'
 * removeLanguagePrefix('/projects'); // '/projects'
 */
export const removeLanguagePrefix = (pathname: unknown): string =>
  splitLanguagePrefix(pathname).pagePath;

/** Parameters of {@link localizePath}. */
interface LocalizePathParams {
  /** Path of a page in any language, e.g. `/projects` or `/en/projects`. @default '/' */
  path?: unknown;
  /** Language of the path to build. Any other value counts as the default language. */
  language?: unknown;
}

/**
 * Gives the path of a page in a language, from its path in any language: the path of the page in
 * the {@link DEFAULT_LANGUAGE}, behind the prefix of the language (see {@link getLanguagePrefix}).
 * The home page of a prefixed language ends with a slash, `/en/`, the folder of its HTML file.
 *
 * @returns The path in the language, the root path when `path` is missing or not a string.
 *
 * @example
 * localizePath({ path: '/projects', language: 'en' }); // '/en/projects'
 * localizePath({ path: '/', language: 'en' }); // '/en/'
 * localizePath({ path: '/en/projects', language: 'fr' }); // '/projects'
 */
export const localizePath = ({ path, language }: LocalizePathParams = {}): string =>
  `${getLanguagePrefix(language)}${removeLanguagePrefix(path)}`;

/** Parameters of {@link getStartPath}. */
interface GetStartPathParams {
  /** Path of the URL the visitor opened, e.g. `location.pathname`. @default '/' */
  pathname?: unknown;
  /** Language the visitor chose with the toggle on a previous visit, when there is one. */
  storedLanguage?: unknown;
}

/**
 * Picks the path the site opens at. The root URL, the home page of the default language, opens
 * the home page of the language the visitor chose with the toggle before. Every other URL opens
 * as it is, in the language it names, so that a shared link shows what its sender saw.
 *
 * @returns The home page of the stored language at the root, and `pathname` itself otherwise, or
 * when no language of the site is stored. The root path when `pathname` is missing.
 *
 * @example
 * getStartPath({ pathname: '/', storedLanguage: 'en' }); // '/en/'
 * getStartPath({ pathname: '/projects', storedLanguage: 'en' }); // '/projects'
 * getStartPath({ pathname: '/', storedLanguage: null }); // '/'
 */
export const getStartPath = ({ pathname, storedLanguage }: GetStartPathParams = {}): string => {
  const path = toPathname(pathname);
  const isRootWithStoredLanguage = path === ROOT_PATH && isLanguage(storedLanguage);
  if (!isRootWithStoredLanguage) return path;

  return localizePath({ path: ROOT_PATH, language: storedLanguage });
};
