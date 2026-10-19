import { theme } from '../../theme';

/**
 * Media query of the desktop layout, the one of the style files: the navigation is a bar of the
 * page and the burger button is hidden, so the mobile menu never covers the page.
 */
export const DESKTOP_MEDIA_QUERY = `(min-width: ${theme.screens.tablet})`;

/**
 * Attribute that takes an element and its content out of the focus order, clicks and screen
 * readers.
 */
export const INERT_ATTRIBUTE = 'inert';

/** Letter written before a version number, as in `v1.0.0`. */
export const VERSION_PREFIX = 'v';
