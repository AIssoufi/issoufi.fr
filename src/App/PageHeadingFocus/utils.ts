import { getPathLanguage, removeLanguagePrefix } from '../../i18n/utils';
import { PAGE_HEADING_SELECTOR, SCRIPT_ONLY_TAB_INDEX } from './constants';

/** Parameters of {@link focusPageHeading}. */
interface FocusPageHeadingParams {
  /** Element or document holding the page. Nothing is focused when `null`. @default document */
  root?: ParentNode | null;
}

/**
 * Moves the focus to the main heading of the page, the first `h1` of `root`, so that keyboard and
 * screen reader users start on the new page after a navigation. A heading cannot take the focus
 * by itself: it gets `tabindex="-1"`, which lets this script focus it without adding it to the
 * `Tab` order, unless it already has a `tabindex`. Does nothing when `root` holds no `h1`.
 *
 * @example
 * focusPageHeading(); // the first h1 of the document has the focus
 */
export function focusPageHeading({ root = document }: FocusPageHeadingParams = {}): void {
  const heading = root?.querySelector<HTMLElement>(PAGE_HEADING_SELECTOR);
  if (!heading) return;

  const hasOwnTabIndex = heading.hasAttribute('tabindex');
  if (!hasOwnTabIndex) heading.tabIndex = SCRIPT_ONLY_TAB_INDEX;
  heading.focus();
}

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
