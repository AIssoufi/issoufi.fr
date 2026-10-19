import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants.ts';
import type { Language } from './types.ts';
import { getPathLanguage, getStartPath, isLanguage } from './utils.ts';

/**
 * Returns the language the visitor chose with the toggle on a previous visit, read from
 * `localStorage`.
 *
 * @returns The stored language, or `undefined` when none is stored, when the stored value is not
 * one of the site's languages, or when the browser blocks the storage.
 */
export function getStoredLanguage(): Language | undefined {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : undefined;
  } catch {
    // Reading the storage throws when the browser blocks it, as with cookies disabled
    return undefined;
  }
}

/**
 * Stores the language chosen by the visitor, so that the root URL opens in it on the next visit
 * (see {@link resolveInitialLanguage}). Does nothing when the storage is blocked or full: the
 * choice then only lasts as long as the visitor stays on the URLs of that language.
 *
 * @param language - Language the visitor switched to.
 */
export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The language still changes on the current page, it is just not remembered
  }
}

/**
 * Returns the language to start the site in: the language of the current URL. At the root URL, a
 * visitor who chose another language with the toggle on a previous visit is first taken to the
 * home page of that language (see {@link getStartPath}), in place of the current history entry,
 * so the root URL keeps their choice while every other URL keeps its own language. Must run
 * before the router reads the URL. Outside a browser, as in the Node.js tests, returns the default
 * language.
 */
export function resolveInitialLanguage(): Language {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return DEFAULT_LANGUAGE;

  const { pathname, search, hash } = window.location;
  const startPath = getStartPath({ pathname, storedLanguage: getStoredLanguage() });

  const isRedirected = startPath !== pathname;
  if (isRedirected) {
    window.history.replaceState(window.history.state, '', `${startPath}${search}${hash}`);
  }

  return getPathLanguage(startPath);
}
