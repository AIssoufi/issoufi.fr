import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from './constants';
import type { Language } from './types';
import { isLanguage } from './utils';

/**
 * Returns the language to start the site in: the one the visitor chose on a previous visit,
 * read from `localStorage`, or else {@link DEFAULT_LANGUAGE}. The default is also used when the
 * stored value is not one of the site's languages, or when the browser blocks the storage.
 */
export function getInitialLanguage(): Language {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  } catch {
    // Reading the storage throws when the browser blocks it, as with cookies disabled
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Stores the language chosen by the visitor, so that {@link getInitialLanguage} restores it on
 * the next visit. Does nothing when the storage is blocked or full: the choice then only lasts
 * until the page is reloaded.
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
