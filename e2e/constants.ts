/**
 * Screen widths, in pixels, at which every page must fit without scrolling sideways: the
 * narrowest phones still in use (320), two common phone widths (375 and 414), and a common
 * desktop width (1440), at which the layout of the app reaches its widest.
 */
export const SCREEN_WIDTHS_PX = [320, 375, 414, 1440] as const;

/** Screen height of the browser tests, in pixels, the height of a common laptop screen. */
export const SCREEN_HEIGHT_PX = 800;

/** Path that no page uses, opened to check the not found page. */
export const NOT_FOUND_ROUTE = '/browser-test-page-that-does-not-exist';

/**
 * Section that every page renders, the `Page` of `src/App/App.styled.ts`, right inside the app
 * grid. The pages other than the home page show it only once their chunk is loaded, after the
 * header.
 */
export const PAGE_SELECTOR = '[data-testid="app"] > section';
