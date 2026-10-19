import type { Language } from '../src/i18n/types';
import { theme } from '../src/theme/theme';
import type { BackgroundPhoto, Page } from '../src/utils/pages';

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
 * Unknown path wider than any phone screen, as a link shared by mail can be: percent-encoded words,
 * which the not found page names decoded, then a word of 64 letters, with no space to wrap at.
 */
export const LONG_NOT_FOUND_ROUTE = `/projets/2024/un%20lien%20partag%C3%A9%20tr%C3%A8s%20long%20depuis%20un%20mail/${'a'.repeat(64)}`;

/**
 * Screens on which the browser tests open the error pages, whose message must be centered in the
 * height of the page: a phone (375 × 667), a laptop (1440 × 900) and a large desktop screen
 * (2560 × 1440), where the message once sat near the top.
 */
export const ERROR_PAGE_SCREENS = [
  { width: 375, height: 667 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
] as const;

/**
 * Largest distance allowed between the vertical center of the message of an error page and the
 * center of the page, as a share of the height of the page: 10 %.
 */
export const MAX_ERROR_MESSAGE_CENTER_OFFSET_RATIO = 0.1;

/**
 * Chunks of the Projects page, which the test of the unexpected error keeps from loading, so the
 * page fails to load (see `getChunkName`, `vite/utils.ts`).
 */
export const PROJECTS_CHUNK_PATTERN = '**/assets/Projects-*.js';

/**
 * `<main>` landmark that every page renders, the `Page` of `src/components/Page`, right inside the
 * app grid. The pages other than the home page show it only once their chunk is loaded, after the
 * header.
 */
export const PAGE_SELECTOR = '[data-testid="app"] > main';

/**
 * Message of an error page, the `StatusMessage` of `src/components/StatusPage`: the block of the
 * code, the title, the explanation and the buttons, right inside the `<main>` landmark.
 */
export const ERROR_MESSAGE_SELECTOR = `${PAGE_SELECTOR} > section`;

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

/**
 * Screen widths, in pixels, at which the browser test of the Experiences page checks what screen
 * readers read: the narrowest phones still in use (320), two common phone widths (375 and 414)
 * and a tablet in portrait (768), below the tablet breakpoint, where the header of each card shows
 * the period of its job, then a common desktop width (1440), where the period column of the
 * timeline shows it.
 */
export const EXPERIENCES_SCREEN_WIDTHS_PX = [320, 375, 414, 768, 1440] as const;

/**
 * Row of each job of the timeline of the Experiences page, a job alone at its company or one of
 * the roles of a company: the list item that holds its period column, the only element whose
 * `::after` draws a dot ({@link TIMELINE_DOT_ATTRIBUTE}).
 */
export const JOB_ROW_SELECTOR = `li:has(> [${TIMELINE_DOT_ATTRIBUTE}="after"])`;

/**
 * Characters that only decorate the Experiences page, which screen readers must not read: the
 * arrow of the period column, the dash of the period in the header of a card, and the chevron
 * before each bullet point. The texts of the page use none of them.
 */
export const DECORATION_PATTERN = /[↓–›]/;

/** Number of coordinates in a quad of the DevTools protocol: the x and the y of its 4 corners. */
export const QUAD_COORDINATE_COUNT = 8;

/** Screen of the browser test of the background photos, with the version of the photo it shows. */
interface PhotoScreen {
  /** Width of the screen, in pixels. */
  width: number;
  /** Height of the screen, in pixels. */
  height: number;
  /** Version of the background photo that the screen downloads and shows. */
  version: keyof BackgroundPhoto;
}

/**
 * Screens at which the browser test of the background photos opens every page, with the version
 * that each one downloads (`PORTRAIT_PHOTO_MEDIA_QUERY`, `src/utils/pages.ts`): two phones and a
 * tablet in portrait, just under the tablet breakpoint (799), get the portrait version; a tablet
 * in portrait at the breakpoint (800), a phone in landscape and a laptop, the whole photo.
 */
export const PHOTO_SCREENS: readonly PhotoScreen[] = [
  { width: 375, height: 812, version: 'portraitUrl' },
  { width: 414, height: 896, version: 'portraitUrl' },
  { width: 799, height: 1024, version: 'portraitUrl' },
  { width: 800, height: 1024, version: 'url' },
  { width: 667, height: 375, version: 'url' },
  { width: 1440, height: 800, version: 'url' },
];

/**
 * `initiatorType` of the resource timing of a file that a `<link>` loaded, such as a background
 * photo preloaded by the app when it starts, rather than by the style that shows it (`css`).
 */
export const LINK_INITIATOR_TYPE = 'link';

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
 * Screen widths, in pixels, of the desktop layout, at which the header shows its links, the
 * GitHub and LinkedIn icons and the CV link on one line: the tablet breakpoint (800), two laptops
 * (1280 and 1440), then a screen wider than the app container (1920).
 */
export const DESKTOP_SCREEN_WIDTHS_PX = [800, 1280, 1440, 1920] as const;

/**
 * Screen widths, in pixels, below the tablet breakpoint, at which the mobile menu holds the GitHub
 * and LinkedIn icons and the CV link.
 */
export const MOBILE_SCREEN_WIDTHS_PX = [320, 375, 414] as const;

/**
 * Route of a page longer than the screen, scrolled to check what stays fixed. Typed by `PAGES`
 * (`src/utils/pages.ts`), so the type-check fails when the route changes there.
 */
export const LONG_PAGE_ROUTE: Page['path'] = '/experiences';

/**
 * Largest distance, in pixels, allowed between the centers of two items of the header that should
 * line up: the vertical centers of the items of its bar on desktop, or the horizontal center of an
 * item of the mobile menu and the center of the menu. Half a pixel lets through subpixel rounding,
 * but not a 1 px shift.
 */
export const MAX_ALIGNMENT_OFFSET_PX = 0.5;

/**
 * Name of the file that the CV link downloads in each language, the end of its URL (`CV_URLS`,
 * `src/App/Header/NavMenu/CvLink/constants.ts`).
 */
export const CV_FILE_NAMES = {
  fr: 'CV - Adam Issoufi.pdf',
  en: 'CV - Adam Issoufi (EN).pdf',
} as const satisfies Record<Language, string>;

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
 * Smallest height, in pixels, of the CV link of the mobile menu, compact or not: the
 * `finger-target` size of the theme, the target size that the guidelines recommend for a finger.
 */
export const FINGER_TARGET_HEIGHT_PX = Number.parseFloat(theme.sizes['finger-target']);

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

/**
 * Message of the browser console about a security policy of the page: Chrome writes one for each
 * resource or inline code that the Content Security Policy blocks ("Loading the script '…'
 * violates the following Content Security Policy directive: …"), for a directive it cannot read,
 * and for a feature that the Permissions-Policy header denies or does not know.
 */
export const SECURITY_POLICY_MESSAGE_PATTERN =
  /content[ -]security[ -]policy|permissions[ -]policy/i;

/**
 * Function that the browser tests add to each page, through which the page reports to them each
 * `securitypolicyviolation` event, a resource or inline code that its Content Security Policy
 * blocked.
 */
export const REPORT_POLICY_VIOLATION_FUNCTION = 'reportSecurityPolicyViolation';

/**
 * Screens on which the home page must show its title and both of its buttons without scrolling: a
 * small phone held upright (320 × 568), phones held sideways (568 × 320 and 667 × 375, then
 * 844 × 390 and 896 × 414, which get the desktop layout), a tablet held upright (768 × 1024), a
 * laptop (1440 × 900) and a large desktop screen (2560 × 1440).
 */
export const HERO_SCREENS = [
  { width: 320, height: 568 },
  { width: 568, height: 320 },
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 896, height: 414 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
] as const;

/**
 * Screens on which aiming at a button of the home page with the mouse must move no word of its
 * title: two laptops (1280 × 800 and 1440 × 900) and a desktop screen (1920 × 1080), then short
 * screens (568 × 320, 844 × 390 and 896 × 414), where the buttons stand within the push radius of
 * the closest words, so only the rule that a mouse over a control pushes nothing keeps them still.
 */
export const HERO_POINTER_SCREENS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 568, height: 320 },
  { width: 844, height: 390 },
  { width: 896, height: 414 },
] as const;

/**
 * Largest distance, in pixels, that a word of the home title may move while the pointer rests on a
 * button of the page: a few pixels, far from the 30 px that "UX" once jumped by.
 */
export const MAX_WORD_SHIFT_PX = 2;

/**
 * Time, in milliseconds, that the pointer rests at a point before the words of the home title are
 * measured: about 30 frames, in which a word within reach of the pointer moves by far more than
 * {@link MAX_WORD_SHIFT_PX}.
 */
export const POINTER_REST_MS = 500;

/**
 * Screen widths, in pixels, at which no thumbnail or logo may be enlarged on a 2x screen: a phone,
 * with one column of cards (375), and a laptop, with three (1440).
 */
export const SHARP_IMAGE_SCREEN_WIDTHS_PX = [375, 1440] as const;

/** Device pixels per CSS pixel of the screens of {@link SHARP_IMAGE_SCREEN_WIDTHS_PX}. */
export const HIGH_DENSITY_SCALE = 2;

/**
 * Most device pixels that a pixel of an image file may take on the screen, as `getImageEnlargement`
 * (`e2e/images.ts`) computes it: more, the screen enlarges the image, which then looks blurred.
 */
export const MAX_IMAGE_ENLARGEMENT = 1;

/** Width, in pixels, of the phone on which no image may download a file much wider than needed. */
export const LIGHT_IMAGE_SCREEN_WIDTH_PX = 375;

/**
 * Largest ratio between the width of the file that an image downloads and the width that it shows
 * at, on a screen of one device pixel per CSS pixel: a file twice as wide still serves a 2x screen.
 */
export const MAX_FILE_TO_SHOWN_WIDTH_RATIO = 2;

/**
 * `nameKey` of the projects whose screenshot is smaller than their card needs on a 2x screen: their
 * site is offline, and its original the largest file there is, until the site owner replaces it.
 * The browser test of the image sizes leaves their thumbnails out.
 */
export const LOW_RESOLUTION_PROJECT_NAME_KEYS: readonly string[] = [
  'trouilletDecors',
  'yyServicies',
];
