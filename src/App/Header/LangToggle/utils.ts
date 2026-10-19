import type { MouseEvent } from 'react';

import { getPage, HOME_PAGE } from '../../../utils/pages.ts';
import { MAIN_MOUSE_BUTTON } from './constants.ts';

/** What {@link isPlainClick} reads of a click: its button and its modifier keys. */
type ClickEvent = Pick<MouseEvent, 'button' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

/**
 * Tells whether a click on a link opens it in place, as the router follows it: a click of the main
 * button without any modifier key. With one, the browser opens the link in a new tab or window, or
 * downloads it, and leaves the page as it is.
 *
 * @param event - Click on the link.
 * @returns `false` for another button, a modifier key, and a missing event.
 *
 * @example
 * const click = { button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };
 * isPlainClick(click); // true
 * isPlainClick({ ...click, metaKey: true }); // false
 */
export const isPlainClick = (event?: ClickEvent): boolean => {
  if (!event) return false;

  const hasModifierKey = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  return event.button === MAIN_MOUSE_BUTTON && !hasModifierKey;
};

/**
 * Path of the page that the build renders for a path, which the browser hydrates: that of its
 * page of `PAGES`, without a language prefix nor a trailing slash. A path of no page gets the
 * home, since the build renders the not found page that answers it at a path of its own, which the
 * visitor never typed.
 *
 * @param pathname - Path of the current URL, in any language, e.g. `location.pathname`.
 * @returns The path of the page, in the default language, or that of the home.
 *
 * @example
 * getRenderedPagePath('/en/projects/'); // '/projects'
 * getRenderedPagePath('/en/page-inconnue'); // '/'
 */
export const getRenderedPagePath = (pathname: string): string =>
  getPage(pathname)?.path ?? HOME_PAGE.path;
