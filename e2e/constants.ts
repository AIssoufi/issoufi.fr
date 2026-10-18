/**
 * Screen widths, in pixels, at which every page must fit without scrolling sideways: the
 * narrowest phones still in use (320), two common phone widths (375 and 414), and a desktop
 * screen as wide as the layout (1440, the `max-width` of the app).
 */
export const SCREEN_WIDTHS_PX = [320, 375, 414, 1440] as const;

/** Screen height of the browser tests, in pixels, the height of a common laptop screen. */
export const SCREEN_HEIGHT_PX = 800;

/** Path that no page uses, opened to check the not found page. */
export const NOT_FOUND_ROUTE = '/browser-test-page-that-does-not-exist';

/** Element the app renders into, as declared in `index.html` and mounted by `src/index.tsx`. */
export const APP_ROOT_SELECTOR = '#welcome';
