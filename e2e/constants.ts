import type { Language } from '../src/i18n/types';
import { theme } from '../src/theme/theme';
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

/**
 * Route of the Projects page, whose sections show the project cards. Typed by `PAGES`
 * (`src/utils/pages.ts`), so the type-check fails when the route changes there.
 */
export const PROJECTS_ROUTE: Page['path'] = '/projects';

/**
 * Screen widths, in pixels, at which the browser test of the project cards compares the row of
 * each section with its "Show all" rows: a phone (375), the tablet breakpoint, where the desktop
 * layout starts while the row still scrolls (800), two laptop widths (1280 and 1440), then past
 * the `wide` breakpoint (1600), with the page content at its largest width (1720 and 2400).
 */
export const PROJECT_CARD_SCREEN_WIDTHS_PX = [375, 800, 1280, 1440, 1720, 2400] as const;

/**
 * Largest difference, in pixels, allowed between the sizes or the positions of two project cards
 * that should match. Half a pixel lets through subpixel rounding, but not a card 1 px wider.
 */
export const MAX_CARD_OFFSET_PX = 0.5;

/**
 * Screen widths, in pixels, at which the language toggle floats on the right edge of the screen,
 * with the GitHub icon under it: the tablet breakpoint (800), two laptops (1280 and 1440), then a
 * screen wider than the app container (1920).
 */
export const FLOATING_CONTROLS_SCREEN_WIDTHS_PX = [800, 1280, 1440, 1920] as const;

/**
 * Screen widths, in pixels, below the tablet breakpoint, at which the mobile menu holds the GitHub
 * icon.
 */
export const MOBILE_SCREEN_WIDTHS_PX = [320, 375, 414] as const;

/**
 * Route of a page longer than the screen, scrolled to check what stays fixed. Typed by `PAGES`
 * (`src/utils/pages.ts`), so the type-check fails when the route changes there.
 */
export const LONG_PAGE_ROUTE: Page['path'] = '/experiences';

/**
 * Largest distance, in pixels, allowed between the horizontal center of the GitHub icon and the
 * center of the control it is centered under. Half a pixel lets through subpixel rounding, but not
 * a 1 px shift.
 */
export const MAX_ICON_OFFSET_PX = 0.5;

/**
 * Name of the file that the CV button downloads in each language, the end of its URL (`CV_URLS`,
 * `src/App/Header/CvLink/constants.ts`).
 */
export const CV_FILE_NAMES = {
  fr: 'CV - Adam Issoufi.pdf',
  en: 'CV - Adam Issoufi (EN).pdf',
} as const satisfies Record<Language, string>;

/**
 * Largest distance, in pixels, allowed between the center of a tooltip and the center of the
 * control it is centered on, across or along the side it shows on. Half a pixel lets through
 * subpixel rounding, but not a 1 px shift.
 */
export const MAX_TOOLTIP_OFFSET_PX = 0.5;

/**
 * Space, in pixels, between a tooltip and the control it describes: the `tooltip-gap` of the
 * theme, which an invisible bridge fills.
 */
export const TOOLTIP_GAP_PX = Number.parseFloat(theme.space['tooltip-gap']);
