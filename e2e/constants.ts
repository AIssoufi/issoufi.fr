import type { Page } from '../src/utils/pages';

/**
 * Screen widths, in pixels, at which the browser tests open the pages, and every page must fit
 * without scrolling sideways: the narrowest phones still in use (320), two common phone widths
 * (375 and 414), which get the mobile layout, and a common desktop width (1440), at which the
 * layout of the app reaches its widest.
 */
export const SCREEN_WIDTHS_PX = [320, 375, 414, 1440] as const;

/** Screen height of the browser tests, in pixels, the height of a common laptop screen. */
export const SCREEN_HEIGHT_PX = 800;

/** Path that no page uses, opened to check the not found page. */
export const NOT_FOUND_ROUTE = '/browser-test-page-that-does-not-exist';

/**
 * `<main>` landmark that every page renders, the `Page` of `src/components/Page`, right inside the
 * app grid. The pages other than the home page show it only once their chunk is loaded, after the
 * header.
 */
export const PAGE_SELECTOR = '[data-testid="app"] > main';

/**
 * Route of the Experiences page, the only page with a timeline. Typed by `PAGES`
 * (`src/utils/pages.ts`), so the type-check fails when the route changes there.
 */
export const TIMELINE_ROUTE: Page['path'] = '/experiences';

/**
 * Attribute of the timeline of the Experiences page. Its value names the pseudo-element that
 * draws the line, one of {@link PSEUDO_ELEMENT_TYPES}.
 */
export const TIMELINE_LINE_ATTRIBUTE = 'data-timeline-line';

/**
 * Attribute of each element whose pseudo-element draws a dot on the timeline line. Its value names
 * that pseudo-element, one of {@link PSEUDO_ELEMENT_TYPES}.
 */
export const TIMELINE_DOT_ATTRIBUTE = 'data-timeline-dot';

/**
 * Pseudo-elements that can draw the line and the dots of the timeline, `::before` and `::after`,
 * named as the timeline attributes and the `pseudoType` of the DevTools protocol name them.
 */
export const PSEUDO_ELEMENT_TYPES = ['before', 'after'] as const;

/**
 * Largest distance, in pixels, allowed between the center of a timeline dot and the center of the
 * line. Half a pixel lets through subpixel rounding, but not a dot moved by 1 px.
 */
export const MAX_DOT_OFFSET_PX = 0.5;

/** Number of coordinates in a quad of the DevTools protocol: the x and the y of its 4 corners. */
export const QUAD_COORDINATE_COUNT = 8;
