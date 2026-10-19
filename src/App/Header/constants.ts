import { theme } from '../../theme/index.ts';
import { NO_SCRIPT_QUERY } from '../../theme/constants.ts';

/**
 * Media query of the desktop layout, the one of the style files: the navigation is a bar of the
 * page and the burger button is hidden, so the mobile menu never covers the page.
 */
export const DESKTOP_MEDIA_QUERY = `(min-width: ${theme.screens.tablet})`;

/**
 * Media query of the mobile layout in a browser that runs no script: links stand for the burger
 * button there, and the menu opens while the fragment of the URL names it (`:target`).
 */
export const NO_SCRIPT_MOBILE_MEDIA_QUERY = `${NO_SCRIPT_QUERY} and (width < ${theme.screens.tablet})`;

/**
 * `id` of the navigation, which the burger button names as the menu it controls, and which the
 * fragment of the URL names to open the mobile menu without JavaScript, as in `/projects#menu`.
 */
export const MOBILE_MENU_ID = 'menu';

/**
 * Attribute that takes an element and its content out of the focus order, clicks and screen
 * readers.
 */
export const INERT_ATTRIBUTE = 'inert';

/** Letter written before a version number, as in `v1.0.0`. */
export const VERSION_PREFIX = 'v';
