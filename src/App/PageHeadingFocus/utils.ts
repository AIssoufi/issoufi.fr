import { getPathLanguage, removeLanguagePrefix } from '../../i18n/utils';

/** Parameters of {@link isLanguageSwitch}. */
interface IsLanguageSwitchParams {
  /** Path of the URL before the navigation, e.g. `/projects`. */
  from?: unknown;
  /** Path of the URL after the navigation, e.g. `/en/projects`. */
  to?: unknown;
}

/**
 * Tells whether a navigation only changed the language of the page, as the language toggle does:
 * the same page, in another language (see `localizePath`).
 *
 * @returns False for a navigation to another page, and for one to the same page in the same
 * language. Missing paths count as the home page of the default language.
 *
 * @example
 * isLanguageSwitch({ from: '/projects', to: '/en/projects' }); // true
 * isLanguageSwitch({ from: '/', to: '/en/projects' }); // false
 */
export function isLanguageSwitch({ from, to }: IsLanguageSwitchParams = {}): boolean {
  const isSamePage = removeLanguagePrefix(from) === removeLanguagePrefix(to);
  const isOtherLanguage = getPathLanguage(from) !== getPathLanguage(to);
  return isSamePage && isOtherLanguage;
}
