import { MAIN_CONTENT_ID } from '../src/constants/landmarks.ts';
import type { Language } from '../src/i18n/types.ts';
import { theme } from '../src/theme/theme.ts';
import type { BackgroundPhoto, Page } from '../src/utils/pages.ts';

/**
 * Screen widths, in pixels, at which the browser tests open the pages, and every page must fit
 * without scrolling sideways: the narrowest phones still in use (320), two common phone widths
 * (375 and 414) and a tablet held upright (768), which get the mobile layout, a tablet held
 * sideways (1024) and a laptop (1280), which get the desktop layout, and a common desktop width
 * (1440), at which the layout of the app reaches its widest below the `wide` breakpoint.
 */
export const SCREEN_WIDTHS_PX = [320, 375, 414, 768, 1024, 1280, 1440] as const;

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
 * Screen widths, in pixels, at which the dots of the timeline must be centered on its line: those
 * of {@link SCREEN_WIDTHS_PX}, then a desktop screen past the `wide` breakpoint (1920), where the
 * period column, along whose right edge the line runs, is wider.
 */
export const TIMELINE_SCREEN_WIDTHS_PX = [...SCREEN_WIDTHS_PX, 1920] as const;

/**
 * Period column of each row of the timeline, a job alone at its company or one of the roles of a
 * company, shown from the tablet breakpoint: the only element whose `::after` draws a dot
 * ({@link TIMELINE_DOT_ATTRIBUTE}).
 */
export const PERIOD_COLUMN_SELECTOR = `[${TIMELINE_DOT_ATTRIBUTE}="after"]`;

/**
 * Screen widths, in pixels, at which every date of the period column must stay inside the column:
 * a laptop (1440), below the `wide` breakpoint, then a desktop screen past it (1920), where the
 * column and its dates are larger.
 */
export const PERIOD_COLUMN_SCREEN_WIDTHS_PX = [1440, 1920] as const;

/**
 * Largest distance, in pixels, that a text may pass the edge of its box. Half a pixel lets through
 * subpixel rounding, but not a date 1 px out of its column.
 */
export const MAX_TEXT_OVERFLOW_PX = 0.5;

/**
 * Screen widths, in pixels, at which the browser test of the Experiences page checks what screen
 * readers read: the narrowest phones still in use (320), two common phone widths (375 and 414)
 * and a tablet in portrait (768), below the tablet breakpoint, where the header of each card shows
 * the period of its job, then a common desktop width (1440), where the period column of the
 * timeline shows it.
 */
export const EXPERIENCES_SCREEN_WIDTHS_PX = [320, 375, 414, 768, 1440] as const;

/**
 * Screen widths, in pixels, at which each job card of the Experiences page must stack its summary,
 * its description and its technologies, as a tablet does: a small laptop (1024), common desktop
 * widths (1280 and 1440), then screens past the `wide` breakpoint (1920 and 2560), where the cards
 * are widest.
 */
export const STACKED_JOB_CARD_SCREEN_WIDTHS_PX = [1024, 1280, 1440, 1920, 2560] as const;

/**
 * Card of each job of the Experiences page, an `article` that holds its summary, its description
 * and its technologies, in this order.
 */
export const JOB_CARD_SELECTOR = `${PAGE_SELECTOR} article`;

/**
 * Largest difference, in pixels, between the width of a part of a job card and that of its
 * summary: each part spans the whole card, and half a pixel lets through subpixel rounding.
 */
export const MAX_CARD_PART_WIDTH_OFFSET_PX = 0.5;

/**
 * Header of each project of a job card of the Experiences page: the `header` that holds the title
 * of the project, its `h4`, and its state badge, the `span` after it.
 */
export const PROJECT_HEADER_SELECTOR = 'header:has(> h4)';

/**
 * Screen widths, in pixels, at which the state badge of each project of the Experiences page must
 * stay inside its job card and leave its title a readable width: the narrowest phones still in use
 * (320), where the badges once crossed the edge of their card, then a common phone width (360),
 * where they once squeezed their titles onto 3 or 4 lines.
 */
export const PROJECT_HEADER_SCREEN_WIDTHS_PX = [320, 360] as const;

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
 * Card of each project of the Projects page: an item of the list of cards of its section, which
 * holds the list of its tools.
 */
export const PROJECT_CARD_SELECTOR = `${PAGE_SELECTOR} section > ul > li`;

/** List of the tools of each project card. */
export const PROJECT_TOOLS_SELECTOR = `${PROJECT_CARD_SELECTOR} ul`;

/**
 * Dot that the screen shows between two tools of a project card, a decoration that screen readers
 * must not read. The texts of the cards use none.
 */
export const TOOL_SEPARATOR = '·';

/**
 * Screen widths, in pixels, at which the browser test of the Projects page reads its cards as
 * screen readers do: a phone, with one column of cards, and a laptop, with three.
 */
export const PROJECT_READING_SCREEN_WIDTHS_PX = [375, 1440] as const;

/**
 * Screen widths, in pixels, at which the browser test of the project cards compares the row of
 * each section with its "Show all" rows, and moves the row with its arrows: the narrowest phones
 * still in use (320), two common phone widths (375 and 414), with one column of cards, a tablet in
 * portrait (768), with two, the tablet breakpoint, where the desktop layout starts with two
 * columns still (800), two laptop widths (1280 and 1440), with three, then the `wide` breakpoint
 * (1600), where the cards grow with the app container, and two desktop screens wider than it
 * (1920 and 2560).
 */
export const PROJECT_CARD_SCREEN_WIDTHS_PX = [
  320, 375, 414, 768, 800, 1280, 1440, 1600, 1920, 2560,
] as const;

/**
 * Largest difference, in pixels, allowed between the sizes or the positions of two project cards
 * that should match. Half a pixel lets through subpixel rounding, but not a card 1 px wider.
 */
export const MAX_CARD_OFFSET_PX = 0.5;

/**
 * Screen widths, in pixels, of the desktop layout, at which the header shows its links, the
 * GitHub and LinkedIn icons and the CV link on one line: the tablet breakpoint (800), a tablet held
 * sideways (1024), two laptops (1280 and 1440), then two screens wider than the app container
 * (1920 and 2560).
 */
export const DESKTOP_SCREEN_WIDTHS_PX = [800, 1024, 1280, 1440, 1920, 2560] as const;

/**
 * Screen widths, in pixels, below the tablet breakpoint, at which the mobile menu holds the GitHub
 * and LinkedIn icons and the CV link: three phones (320, 375 and 414) and a tablet held upright
 * (768).
 */
export const MOBILE_SCREEN_WIDTHS_PX = [320, 375, 414, 768] as const;

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
 * Smallest width and height, in pixels, of the area that a finger taps on a control of a touch
 * screen, and of the CV link of the mobile menu, compact or not: the `finger-target` size of the
 * theme, the target size that the guidelines recommend for a finger (success criterion 2.5.5).
 */
export const FINGER_TARGET_SIZE_PX = Number.parseFloat(theme.sizes['finger-target']);

/**
 * Touch screens of the desktop layout, on which every control must take the taps of a finger over
 * {@link FINGER_TARGET_SIZE_PX} each way, as on those of {@link MOBILE_LAYOUT_SCREENS}: phones held
 * sideways (844 × 390, an iPhone 12, which reaches the tablet breakpoint) and tablets held upright
 * (820 × 1180, an iPad Air) and sideways (1024 × 768, an iPad, and 1180 × 820, an iPad Air).
 */
export const DESKTOP_LAYOUT_TOUCH_SCREENS = [
  { width: 844, height: 390 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1180, height: 820 },
] as const;

/** Controls of a page that a finger taps: the links and the buttons. */
export const CONTROL_SELECTOR = 'a[href], button';

/**
 * Skip link of every page, which shows only once the keyboard focuses it, which a tap never does:
 * the browser test of the targets leaves it out.
 */
export const SKIP_LINK_SELECTOR = `a[href="#${MAIN_CONTENT_ID}"]`;

/**
 * Header of the site, right inside the app grid, which stays at the top of the screen, and from
 * tablet up holds the language toggle that floats on the right edge, over the page.
 */
export const SITE_HEADER_SELECTOR = '[data-testid="app"] > header';

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
 * Animated words of the home title, inside its heading: the innermost spans, within the blocks of
 * its lines and the groups that hold a word to an animated one ("l’UX").
 */
export const HERO_WORD_SELECTOR = 'span:not(:has(span))';

/**
 * Number of animation frames that the pointer rests at a point, each of which measures the words
 * of the home title. A word pushed stays where it went until `RETURN_DELAY_MS`
 * (`src/pages/Home/SplitWords/constants.ts`) after the last push, so the pushes of the points of
 * a button add up: without the rule that a mouse over a control pushes nothing, the farthest word
 * goes 4.6 px at least from its place while the pointer crosses the top edge of a button, on every
 * short screen, more than twice {@link MAX_WORD_SHIFT_PX}. That delay counts milliseconds, not
 * frames: on a machine so slow that crossing a button outlasts it, the words would go back between
 * two points, and the check would pass more easily.
 */
export const POINTER_REST_FRAME_COUNT = 4;

/**
 * Screen widths, in pixels, at which axe-core checks every page with {@link PAGE_AXE_RULES}: a
 * phone (375) and a tablet held upright (768), with the mobile menu closed then open, a tablet
 * held sideways (1024), a laptop (1280) and a common desktop width (1440).
 */
export const AXE_SCREEN_WIDTHS_PX = [375, 768, 1024, 1280, 1440] as const;

/** Screen widths, in pixels, among {@link AXE_SCREEN_WIDTHS_PX}, that show the mobile menu. */
export const MENU_AXE_SCREEN_WIDTHS_PX = [375, 768] as const;

/**
 * Rule of axe-core that checks the contrast of each text against its background: 4.5:1, or 3:1 for
 * a large text, the level AA of the Web Content Accessibility Guidelines (success criterion 1.4.3).
 */
export const COLOR_CONTRAST_RULE = 'color-contrast';

/**
 * Rule of axe-core that checks that the accessible name of a control given by `aria-label` or
 * `aria-labelledby` holds its visible text, so that a voice control user who says what they see
 * finds it (success criterion 2.5.3, Label in Name, level A). Experimental, so axe-core runs it only
 * when it is named.
 */
export const LABEL_IN_NAME_RULE = 'label-content-name-mismatch';

/** Rules of axe-core that every page passes, at each of {@link AXE_SCREEN_WIDTHS_PX}. */
export const PAGE_AXE_RULES = [COLOR_CONTRAST_RULE, LABEL_IN_NAME_RULE] as const;

/**
 * Screen widths, in pixels, at which no page may show a text under the smallest font size of the
 * site (`MIN_FONT_SIZE_PX`, `src/theme/constants.ts`): the narrowest phones (320), a common phone
 * (375), a tablet held upright (768) then sideways (1024), two laptops (1280 and 1440), a screen
 * past the `wide` breakpoint (1920) and a large desktop screen (2560).
 */
export const TEXT_SIZE_SCREEN_WIDTHS_PX = [320, 375, 768, 1024, 1280, 1440, 1920, 2560] as const;

/**
 * Screen widths, in pixels, at which forced colors mode, such as a contrast theme of Windows, must
 * still show the active language and a liked project: a phone (375) and a common desktop width
 * (1440).
 */
export const FORCED_COLORS_SCREEN_WIDTHS_PX = [375, 1440] as const;

/**
 * Color schemes of the contrast themes in which forced colors mode must still show the icons: a
 * light one, such as "Desert" on Windows, where a white icon vanishes, and a dark one.
 */
export const FORCED_COLORS_SCHEMES = ['light', 'dark'] as const;

/**
 * Screen widths, in pixels, at which no thumbnail or logo may be enlarged on a 2x screen: a phone,
 * with one column of cards (375), a laptop, with three (1440), and a desktop screen past the `wide`
 * breakpoint, with three larger ones (1920, as a 4K screen at 200 %).
 */
export const SHARP_IMAGE_SCREEN_WIDTHS_PX = [375, 1440, 1920] as const;

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
 * site is offline, and its original the largest file there is, until the site owner replaces it
 * (issue #238). The browser test of the image sizes leaves their thumbnails out.
 */
export const LOW_RESOLUTION_PROJECT_NAME_KEYS: readonly string[] = [
  'trouilletDecors',
  'yyServicies',
];

/**
 * Screen widths, in pixels, at which no line of the passion or the subtitle of the home page may
 * hold a single word, and no department of the Experiences page may wrap away from its city: the
 * narrowest phones (320), then common phone widths (360, 375, 390 and 414), where those lines once
 * broke badly.
 */
export const LINE_BREAK_SCREEN_WIDTHS_PX = [320, 360, 375, 390, 414] as const;

/** Start of a line that begins with the number of a French department in brackets, as "(06)". */
export const DEPARTMENT_LINE_START_PATTERN = /^\(\d{2}\)/u;

/** Title of the home page: the job title, then the passion for UX and UI design. */
export const HERO_TITLE_SELECTOR = `${PAGE_SELECTOR} h1`;

/**
 * Second line of the home title, "passionné par l’UX et l’UI Design", a block of its own after the
 * job title, whose three long words leave one of them alone on a line on a phone whatever the wrap.
 */
export const HERO_PASSION_SELECTOR = `${HERO_TITLE_SELECTOR} > :last-child`;

/** Subtitle of the home page, right after its title. */
export const HERO_SUBTITLE_SELECTOR = `${HERO_TITLE_SELECTOR} + p`;

/**
 * Screen widths, in pixels, past the `wide` breakpoint, at which the content of every page must
 * span at least {@link MIN_CONTENT_SCREEN_SHARE} of the screen: a common desktop screen (1920) and
 * a large one (2560), of which the content of a laptop layout once left 54 %.
 */
export const WIDE_SCREEN_WIDTHS_PX = [1920, 2560] as const;

/** Smallest share of the width of a wide screen that the content of a page must span: 60 %. */
export const MIN_CONTENT_SCREEN_SHARE = 0.6;

/**
 * Largest difference, in pixels, allowed between the width of the content of a page and the width
 * that the app container leaves it. Half a pixel lets through subpixel rounding, but not a 1 px
 * difference.
 */
export const MAX_CONTENT_WIDTH_OFFSET_PX = 0.5;

/** Screen of the screenshot comparison, named after the device it stands for. */
interface VisualScreen {
  /** Kind of device, which the title of each test starts with, e.g. `tablet`. */
  name: string;
  /** Width of the screen, in pixels. */
  width: number;
  /** Height of the screen, in pixels, which sizes what fills the first screen, such as the hero. */
  height: number;
}

/**
 * Screens of the screenshot comparison (`e2e/pages.visual.ts`): a common phone (375 × 812), a
 * tablet held upright (768 × 1024), below the tablet breakpoint, a laptop (1280 × 800) and a
 * desktop screen past the `wide` breakpoint (1920 × 1080).
 */
export const VISUAL_SCREENS: readonly VisualScreen[] = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
];

/**
 * Time at which the clock of the screenshot comparison stands, so the durations of the jobs and
 * the years of experience, which count up to today, read the same from a run to the next: noon in
 * the middle of a month, which is the same month in every time zone.
 */
export const VISUAL_CLOCK_TIME = '2026-10-15T12:00:00Z';

/**
 * Seed of the `Math.random` of the screenshot comparison (`seedRandom`, `e2e/screenshots.ts`), so
 * the dots of the particle field of the home page stand at the same places on every load.
 */
export const VISUAL_RANDOM_SEED = 1;
