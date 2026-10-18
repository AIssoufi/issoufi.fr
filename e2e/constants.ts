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
 * each section with its "Show all" rows, and moves the row with its arrows: the narrowest phones
 * still in use (320), two common phone widths (375 and 414), with one column of cards, a tablet in
 * portrait (768), with two, the tablet breakpoint, where the desktop layout starts with two
 * columns still (800), two laptop widths (1280 and 1440), with three, then past the `wide`
 * breakpoint (1600), with the page content at its largest width (1720 and 2400).
 */
export const PROJECT_CARD_SCREEN_WIDTHS_PX = [
  320, 375, 414, 768, 800, 1280, 1440, 1720, 2400,
] as const;

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

/** Name of the "Show all" buttons of the Projects page, in both languages, whatever their count. */
export const SHOW_ALL_BUTTON_NAME = /^(Tout afficher|Show all) \(\d+\)$/;

/**
 * Screen widths, in pixels, at which the sticky header must stay on the screen down to the end of
 * the long pages: a phone (375), a tablet held upright, still on the mobile layout (768), a tablet
 * held sideways (1024) and a laptop (1440).
 */
export const STICKY_HEADER_SCREEN_WIDTHS_PX = [375, 768, 1024, 1440] as const;

/**
 * Screen height, in pixels, of the sticky header test: the height left to a page on a 1366 × 768
 * laptop once the browser shows its bars. The Projects page, the shorter of the long pages, then
 * scrolls by more than one screen at every width, beyond which a header stuck within one screen
 * would leave it.
 */
export const STICKY_HEADER_SCREEN_HEIGHT_PX = 600;

/**
 * Largest difference, in pixels, allowed between the blurred band of the header and the header
 * itself, at the top or in height. Half a pixel lets through subpixel rounding, but not a band
 * 1 px shorter.
 */
export const MAX_BAND_OFFSET_PX = 0.5;

/**
 * Phones held sideways, on which the open mobile menu must show each of its links whole without
 * scrolling: the smallest still in use (568 × 320, an iPhone SE of the first generation) and a
 * common one (667 × 375, an iPhone 8).
 */
export const LANDSCAPE_PHONE_SCREENS = [
  { width: 568, height: 320 },
  { width: 667, height: 375 },
] as const;

/**
 * Short screens, on which the compact header must take at most {@link MAX_HEADER_SCREEN_SHARE} of
 * the height: the phones held sideways, then a larger one that gets the desktop layout (896 × 414,
 * an iPhone 11 held sideways).
 */
export const SHORT_SCREENS = [...LANDSCAPE_PHONE_SCREENS, { width: 896, height: 414 }] as const;

/** Largest share of the height of a short screen that the header may take: 15 %. */
export const MAX_HEADER_SCREEN_SHARE = 0.15;

/**
 * Smallest height, in pixels, of a link that a finger taps: the target size that the Web Content
 * Accessibility Guidelines 2.2 require at level AA (success criterion 2.5.8).
 */
export const MIN_TARGET_SIZE_PX = 24;

/**
 * Smallest height, in pixels, of the CV button of the mobile menu, compact or not: the
 * `round-button` size of the theme, the target size that the guidelines recommend for a finger.
 */
export const FINGER_TARGET_HEIGHT_PX = Number.parseFloat(theme.sizes['round-button']);

/**
 * Screen lower than the open mobile menu, even compact, as a phone held sideways with the bars of
 * its browser shown: the menu must scroll to show each of its links whole.
 */
export const SHORTER_THAN_MENU_SCREEN = { width: 568, height: 240 } as const;

/**
 * Screens below the tablet breakpoint, on which the open mobile menu covers the page: phones held
 * upright (320 × 568, 375 × 667 and 414 × 896) and sideways ({@link LANDSCAPE_PHONE_SCREENS}), and
 * a tablet held upright (768 × 1024).
 */
export const MOBILE_LAYOUT_SCREENS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 414, height: 896 },
  ...LANDSCAPE_PHONE_SCREENS,
  { width: 768, height: 1024 },
] as const;

/**
 * Scroll position of the page, in pixels, when the mobile menu opens over it: the page must still
 * be there once the menu closes.
 */
export const MENU_OPENING_SCROLL_Y_PX = 300;

/**
 * Distance, in pixels, of each wheel scroll or swipe of the browser tests: more than half a phone
 * screen, so that a page left free to scroll visibly moves.
 */
export const SCROLL_GESTURE_DISTANCE_PX = 600;

/**
 * Speed of the wheel scrolls and swipes of the browser tests, in pixels per second: fast, so that
 * each one lasts a fifth of a second.
 */
export const SCROLL_GESTURE_SPEED_PX_PER_S = 3000;

/**
 * Domains of Google that no page may request, nor any of their subdomains: the fonts and the APIs,
 * the analytics, the ads, the maps and the videos, YouTube and reCAPTCHA. The country domains of
 * the search engine, such as `google.fr`, are matched by {@link GOOGLE_COUNTRY_HOST_PATTERN}.
 */
export const GOOGLE_DOMAINS = [
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'googleusercontent.com',
  'googletagmanager.com',
  'google-analytics.com',
  'googlesyndication.com',
  'googleadservices.com',
  'doubleclick.net',
  'googlevideo.com',
  'ggpht.com',
  'gvt1.com',
  'gvt2.com',
  'youtube.com',
  'youtube-nocookie.com',
  'ytimg.com',
  'recaptcha.net',
  'withgoogle.com',
  'app-measurement.com',
  'goo.gl',
  'g.co',
] as const;

/**
 * Host of a country domain of Google, or one of its subdomains: `google.fr`, `www.google.co.uk`,
 * `google.com.br`.
 */
export const GOOGLE_COUNTRY_HOST_PATTERN = /(?:^|\.)google\.(?:[a-z]{2,3}|com?\.[a-z]{2})$/i;

/** Dot that may end a fully qualified host name, such as `google.com.`. */
export const TRAILING_DOT_PATTERN = /\.$/;

/** Protocols of the requests that go to a host: the others, such as `data:`, go nowhere. */
export const NETWORK_PROTOCOLS = ['http:', 'https:', 'ws:', 'wss:'] as const;

/**
 * Screen widths, in pixels, at which the browser test of reduced motion opens the pages: a phone
 * (375), with the mobile menu, and a common desktop width (1440).
 */
export const REDUCED_MOTION_SCREEN_WIDTHS_PX = [375, 1440] as const;

/**
 * Longest time, in milliseconds, that an animation or a transition may last with reduced motion,
 * its delay included: the `instant` duration of the theme (0.01 ms), with room for the rounding
 * of the browser, far shorter than a frame.
 */
export const INSTANT_ANIMATION_MAX_MS = 1;

/**
 * Time, in milliseconds, between the two screenshots of the home page that must be identical with
 * reduced motion: long enough for the dots, the glow or a pushed word to move.
 */
export const STILLNESS_DELAY_MS = 1000;
