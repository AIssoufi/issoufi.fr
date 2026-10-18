import { localizePath } from '../src/i18n/utils';
import {
  GOOGLE_COUNTRY_HOST_PATTERN,
  GOOGLE_DOMAINS,
  MAX_CARD_OFFSET_PX,
  NETWORK_PROTOCOLS,
  NOT_FOUND_ROUTE,
  QUAD_COORDINATE_COUNT,
  TRAILING_DOT_PATTERN,
} from './constants';

/** A page of the site, of which only the route matters here, such as an entry of `PAGES`. */
interface RoutedPage {
  /** Route of the page in the default language, e.g. `/projects`. */
  path?: unknown;
}

/** Parameters of {@link getCheckedRoutes}. */
interface GetCheckedRoutesParams {
  /** Pages of the site. Any value that is not an array counts as none. */
  pages?: readonly RoutedPage[] | null;
  /**
   * Language of the routes, one of `LANGUAGES` (`src/i18n/constants.ts`). Any other value counts
   * as the default language, whose routes have no prefix.
   */
  language?: unknown;
}

/** Tells whether a value is a route of the site: a string that starts with `/`. */
const isRoute = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('/');

/**
 * Lists the routes the browser tests open in a language: the route of every page, in order, then
 * {@link NOT_FOUND_ROUTE} for the not found page, each behind the prefix of the language (see
 * `localizePath`), so the page opens in that language. Given `PAGES` (`src/utils/pages.ts`), it
 * covers a new page without any change to the tests.
 *
 * @returns Each route once, the not found route last. Entries that are not pages, and pages
 * whose path is not a string starting with `/`, are skipped.
 *
 * @example
 * getCheckedRoutes({ pages: [{ path: '/' }, { path: '/projects' }], language: 'en' });
 * // ['/en/', '/en/projects', '/en/browser-test-page-that-does-not-exist']
 */
export const getCheckedRoutes = ({ pages, language }: GetCheckedRoutesParams = {}): string[] => {
  const pageList = Array.isArray(pages) ? pages : [];
  const pageRoutes = pageList.map(page => page?.path).filter(isRoute);
  const routes = [...pageRoutes, NOT_FOUND_ROUTE].map(path => localizePath({ path, language }));
  return [...new Set(routes)];
};

/** Tells whether a coordinate of a quad is an x, which comes first in each of its corners. */
const isXCoordinate = (_coordinate: number, index: number) => index % 2 === 0;

/**
 * Finds the horizontal center of a box from its quad in the DevTools protocol, such as the
 * `border` quad that `DOM.getBoxModel` returns: the mean x of its 4 corners, so that a box moved
 * by a CSS transform is measured where it is drawn.
 *
 * @param quad - The x and the y of each corner of the box, in CSS pixels.
 * @returns The x of its center, in CSS pixels, or `NaN` when the quad is not
 * {@link QUAD_COORDINATE_COUNT} finite numbers, so that any comparison with it fails.
 *
 * @example
 * getQuadCenterX([22, 180, 38, 180, 38, 196, 22, 196]); // 30
 */
export const getQuadCenterX = (quad?: readonly number[] | null): number => {
  const isQuad =
    Array.isArray(quad) && quad.length === QUAD_COORDINATE_COUNT && quad.every(Number.isFinite);
  if (!isQuad) return Number.NaN;

  const xCoordinates = quad.filter(isXCoordinate);
  return xCoordinates.reduce((sum, x) => sum + x, 0) / xCoordinates.length;
};

/** Parameters of {@link getCenterDistanceX}. */
interface GetCenterDistanceXParams {
  /** Quad of the measured box, such as a timeline dot, in the format of {@link getQuadCenterX}. */
  quad?: readonly number[] | null;
  /** Quad of the box it should be centered on, such as the timeline line. */
  referenceQuad?: readonly number[] | null;
}

/**
 * Measures how far apart the horizontal centers of two boxes are, from their quads in the
 * DevTools protocol (see {@link getQuadCenterX}).
 *
 * @returns The distance in CSS pixels, never negative, or `NaN` when either quad is invalid, so
 * that any comparison with it fails.
 *
 * @example
 * getCenterDistanceX({
 *   quad: [22, 180, 38, 180, 38, 196, 22, 196],
 *   referenceQuad: [29, 14, 31, 14, 31, 900, 29, 900],
 * }); // 0
 */
export const getCenterDistanceX = ({ quad, referenceQuad }: GetCenterDistanceXParams = {}) =>
  Math.abs(getQuadCenterX(quad) - getQuadCenterX(referenceQuad));

/** Box of a card on the screen, or of the list that holds the cards, in CSS pixels. */
export interface CardBox {
  /** Distance from the left edge of the viewport to the left edge of the box. */
  left: number;
  /** Distance from the top edge of the viewport to the top edge of the box. */
  top: number;
  /** Width of the box. */
  width: number;
  /** Height of the box. */
  height: number;
}

/** Tells whether a value is a box whose position and size are finite numbers. */
const isCardBox = (value: unknown): value is CardBox => {
  const box = value as Partial<CardBox> | null | undefined;
  const sides = [box?.left, box?.top, box?.width, box?.height];
  return sides.every(Number.isFinite);
};

/** Parameters of {@link filterWholeCards} and {@link countWholeCards}. */
interface WholeCardsParams<Card extends CardBox> {
  /** Boxes of the cards of a row, in any order, with any other field they carry. */
  cards?: readonly Card[] | null;
  /** Visible box of the list that holds the row, which scrolls the cards it cannot show. */
  container?: CardBox | null;
  /**
   * How far a card may overflow the container, for subpixel rounding. `NaN` counts no card whole.
   * @default MAX_CARD_OFFSET_PX
   */
  tolerancePx?: number;
}

/**
 * Keeps the cards of a row that the screen shows whole, without scrolling the row: those whose
 * left and right edges both lie inside the container.
 *
 * @returns The whole cards, in the order given; none when the cards are not an array or the
 * container is not a box. Entries that are not boxes are left out.
 *
 * @example
 * filterWholeCards({
 *   cards: [
 *     { left: 24, top: 0, width: 327, height: 300, src: '/chess.webp' },
 *     { left: 361, top: 0, width: 327, height: 300, src: '/calculator.webp' },
 *   ],
 *   container: { left: 0, top: 0, width: 375, height: 310 },
 * }); // [the card of /chess.webp]
 */
export const filterWholeCards = <Card extends CardBox>({
  cards,
  container,
  tolerancePx = MAX_CARD_OFFSET_PX,
}: WholeCardsParams<Card> = {}): Card[] => {
  const canFilter = Array.isArray(cards) && isCardBox(container);
  if (!canFilter) return [];

  const containerRight = container.left + container.width;
  const isWhole = (card: CardBox) => {
    const startsInside = card.left >= container.left - tolerancePx;
    const endsInside = card.left + card.width <= containerRight + tolerancePx;
    return startsInside && endsInside;
  };
  return cards.filter(card => isCardBox(card) && isWhole(card));
};

/**
 * Counts the cards of a row that the screen shows whole, as {@link filterWholeCards} keeps them.
 * Used as the number of columns that the cards fit in, and as the number of cards that the arrows
 * move the row by.
 *
 * @returns `0` when the cards are not an array or the container is not a box. Entries that are
 * not boxes are not counted.
 *
 * @example
 * countWholeCards({
 *   cards: [
 *     { left: 5, top: 0, width: 260, height: 300 },
 *     { left: 275, top: 0, width: 260, height: 300 },
 *   ],
 *   container: { left: 0, top: 0, width: 375, height: 310 },
 * }); // 1
 */
export const countWholeCards = ({
  cards,
  container,
  tolerancePx,
}: WholeCardsParams<CardBox> = {}): number =>
  filterWholeCards({ cards, container, tolerancePx }).length;

/** Parameters of {@link groupCardsIntoRows}. */
interface GroupCardsIntoRowsParams {
  /** Boxes of the cards, in the order of the page, as a wrapping row lays them out. */
  cards?: readonly CardBox[] | null;
  /**
   * How far apart the tops of two cards of the same row may be, for subpixel rounding. `NaN` puts
   * each card in a row of its own.
   * @default MAX_CARD_OFFSET_PX
   */
  tolerancePx?: number;
}

/**
 * Groups cards into the rows they are laid out on: a card starts a new row when its top is
 * further than `tolerancePx` from the top of the first card of the current row.
 *
 * @returns The rows, from top to bottom, each with its cards in the order of the page; none when
 * the cards are not an array. Entries that are not boxes are skipped.
 *
 * @example
 * groupCardsIntoRows({
 *   cards: [
 *     { left: 24, top: 100, width: 260, height: 300 },
 *     { left: 24, top: 415, width: 260, height: 300 },
 *   ],
 * }); // [[first card], [second card]]
 */
export const groupCardsIntoRows = ({
  cards,
  tolerancePx = MAX_CARD_OFFSET_PX,
}: GroupCardsIntoRowsParams = {}): CardBox[][] => {
  if (!Array.isArray(cards)) return [];

  const rows: CardBox[][] = [];
  for (const card of cards.filter(isCardBox)) {
    const currentRow = rows.at(-1);
    const isInCurrentRow =
      currentRow !== undefined && Math.abs(card.top - currentRow[0].top) <= tolerancePx;
    if (isInCurrentRow) currentRow.push(card);
    else rows.push([card]);
  }
  return rows;
};

/** Box of an element on the screen, in CSS pixels, as `boundingBox()` of Playwright returns it. */
export interface ScreenBox {
  /** Distance from the left edge of the screen to the left edge of the box. */
  x: number;
  /** Distance from the top edge of the screen to the top edge of the box. */
  y: number;
  /** Width of the box. */
  width: number;
  /** Height of the box. */
  height: number;
}

/** Tells whether a value is a box whose position and size are finite numbers. */
const isScreenBox = (value: unknown): value is ScreenBox => {
  if (typeof value !== 'object' || value === null) return false;

  const { x, y, width, height } = value as Partial<ScreenBox>;
  return [x, y, width, height].every(Number.isFinite);
};

/** Finds the horizontal center of a box, or `NaN` when it is not a box of finite numbers. */
const getBoxCenterX = (box: unknown): number =>
  isScreenBox(box) ? box.x + box.width / 2 : Number.NaN;

/** Parameters of {@link getBoxCenterDistanceX} and {@link getBoxCenterDistanceY}. */
interface GetBoxCenterDistanceParams {
  /** Box of the measured element, such as the GitHub icon. */
  box?: ScreenBox | null;
  /** Box of the element it should be centered on, such as the language toggle. */
  referenceBox?: ScreenBox | null;
}

/**
 * Measures how far apart the horizontal centers of two boxes are, such as those that Playwright's
 * `boundingBox()` returns.
 *
 * @returns The distance in CSS pixels, never negative, or `NaN` when either box is missing or
 * holds a value that is not a finite number, so that any comparison with it fails.
 *
 * @example
 * getBoxCenterDistanceX({
 *   box: { x: 1381, y: 460, width: 33, height: 32 },
 *   referenceBox: { x: 1374, y: 361, width: 46, height: 78 },
 * }); // 0.5
 */
export const getBoxCenterDistanceX = ({ box, referenceBox }: GetBoxCenterDistanceParams = {}) =>
  Math.abs(getBoxCenterX(box) - getBoxCenterX(referenceBox));

/** Finds the vertical center of a box, or `NaN` when it is not a box of finite numbers. */
const getBoxCenterY = (box: unknown): number =>
  isScreenBox(box) ? box.y + box.height / 2 : Number.NaN;

/**
 * Measures how far apart the vertical centers of two boxes are, such as a tooltip and the control
 * it shows on the left of.
 *
 * @returns The distance in CSS pixels, never negative, or `NaN` when either box is missing or
 * holds a value that is not a finite number, so that any comparison with it fails.
 *
 * @example
 * getBoxCenterDistanceY({
 *   box: { x: 590, y: 456.5, width: 140, height: 31 },
 *   referenceBox: { x: 735, y: 450, width: 44, height: 44 },
 * }); // 0
 */
export const getBoxCenterDistanceY = ({ box, referenceBox }: GetBoxCenterDistanceParams = {}) =>
  Math.abs(getBoxCenterY(box) - getBoxCenterY(referenceBox));

/**
 * Finds the bottom edge of a box, such as one that Playwright's `boundingBox()` returns.
 *
 * @param box - Box of an element on the screen.
 * @returns Its distance from the top of the screen in CSS pixels, or `NaN` when the box is
 * missing or holds a value that is not a finite number, so that any comparison with it fails.
 *
 * @example
 * getBoxBottom({ x: 1374, y: 361, width: 46, height: 78 }); // 439
 */
export const getBoxBottom = (box?: ScreenBox | null): number =>
  isScreenBox(box) ? box.y + box.height : Number.NaN;

/**
 * Finds the right edge of a box, such as one that Playwright's `boundingBox()` returns.
 *
 * @param box - Box of an element on the screen.
 * @returns Its distance from the left of the screen in CSS pixels, or `NaN` when the box is
 * missing or holds a value that is not a finite number, so that any comparison with it fails.
 *
 * @example
 * getBoxRight({ x: 590, y: 456, width: 140, height: 31 }); // 730
 */
export const getBoxRight = (box?: ScreenBox | null): number =>
  isScreenBox(box) ? box.x + box.width : Number.NaN;

/** Parameters of {@link doBoxesOverlapHorizontally}. */
interface DoBoxesOverlapHorizontallyParams {
  /** One of the boxes, such as the box of a line of text of the page. */
  box?: ScreenBox | null;
  /** The other box, such as the language toggle floating on the right edge of the screen. */
  otherBox?: ScreenBox | null;
}

/**
 * Tells whether two boxes share some width, whatever their heights: a box of the page that shares
 * some width with an element fixed on the screen passes under it while the page scrolls. Boxes
 * that only touch by an edge do not overlap.
 *
 * @returns `false` when either box is missing, holds a value that is not a finite number, or has
 * no width: such a box covers nothing.
 *
 * @example
 * doBoxesOverlapHorizontally({
 *   box: { x: 1289, y: 517, width: 127, height: 32 },
 *   otherBox: { x: 1374, y: 411, width: 46, height: 78 },
 * }); // true
 */
export const doBoxesOverlapHorizontally = ({
  box,
  otherBox,
}: DoBoxesOverlapHorizontallyParams = {}): boolean => {
  const hasWidth = (value: unknown): value is ScreenBox => isScreenBox(value) && value.width > 0;
  if (!hasWidth(box) || !hasWidth(otherBox)) return false;

  return box.x < otherBox.x + otherBox.width && otherBox.x < box.x + box.width;
};

/** Parameters of {@link isBoxInside}. */
interface IsBoxInsideParams {
  /** Box that should show whole, such as a tooltip. */
  box?: ScreenBox | null;
  /**
   * Box that should hold it, such as the screen: at `x` and `y` 0, with the size of the viewport.
   */
  container?: ScreenBox | null;
}

/**
 * Tells whether a box lies whole inside another, such as a tooltip that the screen shows without
 * cutting any of its sides. A box that touches an edge of the container is inside it.
 *
 * @returns `false` when either box is missing or holds a value that is not a finite number.
 *
 * @example
 * isBoxInside({
 *   box: { x: 590, y: 380, width: 140, height: 31 },
 *   container: { x: 0, y: 0, width: 800, height: 800 },
 * }); // true
 */
export const isBoxInside = ({ box, container }: IsBoxInsideParams = {}): boolean => {
  if (!isScreenBox(box) || !isScreenBox(container)) return false;

  const isInsideHorizontally =
    box.x >= container.x && box.x + box.width <= container.x + container.width;
  const isInsideVertically = getBoxBottom(box) <= getBoxBottom(container) && box.y >= container.y;
  return isInsideHorizontally && isInsideVertically;
};

/** Size of the screen of a page, as `page.viewportSize()` of Playwright returns it. */
interface ViewportSize {
  /** Width of the screen, in CSS pixels. */
  width: number;
  /** Height of the screen, in CSS pixels. */
  height: number;
}

/** Tells whether a value is a length that a box can have: a finite number. */
const isLength = (value: unknown): value is number => Number.isFinite(value);

/**
 * Builds the box of the whole screen of a page from its size, to check with {@link isBoxInside}
 * that an element shows whole on it.
 *
 * @param viewport - Size of the screen, such as the one that `page.viewportSize()` returns.
 * @returns The box at `x` and `y` 0, or `null` when the size is missing or holds a value that is
 * not a finite number, as `viewportSize()` returns `null` for a page without a fixed size; no box
 * is inside `null`.
 *
 * @example
 * getScreenBox({ width: 568, height: 320 }); // { x: 0, y: 0, width: 568, height: 320 }
 */
export const getScreenBox = (viewport?: ViewportSize | null): ScreenBox | null => {
  const width = viewport?.width;
  const height = viewport?.height;
  if (!isLength(width) || !isLength(height)) return null;

  return { x: 0, y: 0, width, height };
};

/**
 * Tells whether a host belongs to Google: one of the {@link GOOGLE_DOMAINS} or a subdomain of one,
 * such as `fonts.googleapis.com`, or a country domain of the search engine, such as `google.fr`.
 *
 * @param hostname - Host of a URL, without its port, e.g. `fonts.gstatic.com`. Its case, the
 * spaces around it and a trailing dot do not count.
 * @returns `false` for any other host, such as `notgoogle.com` or `google.com.example.org`, and
 * for a value that is not a string.
 *
 * @example
 * isGoogleHost('fonts.googleapis.com'); // true
 * isGoogleHost('issoufi.fr'); // false
 */
export const isGoogleHost = (hostname?: unknown): boolean => {
  if (typeof hostname !== 'string') return false;

  const host = hostname.trim().toLowerCase().replace(TRAILING_DOT_PATTERN, '');
  const isGoogleDomain = GOOGLE_DOMAINS.some(
    domain => host === domain || host.endsWith(`.${domain}`),
  );
  return isGoogleDomain || GOOGLE_COUNTRY_HOST_PATTERN.test(host);
};

/**
 * Tells whether a request goes to Google, as Playwright gives its URL: a URL of the web or of a
 * WebSocket whose host belongs to Google (see {@link isGoogleHost}).
 *
 * @param url - Absolute URL of the request, e.g. `https://fonts.googleapis.com/css2?family=A`.
 * @returns `false` for a URL of another host, for a URL that goes to no host, such as a `data:`
 * URL, and for a value that is not a valid absolute URL.
 *
 * @example
 * isGoogleUrl('https://fonts.gstatic.com/s/montserrat/v31/a.woff2'); // true
 * isGoogleUrl('http://localhost:4173/fonts/montserrat-latin.woff2'); // false
 */
export const isGoogleUrl = (url?: unknown): boolean => {
  if (typeof url !== 'string' || !URL.canParse(url)) return false;

  const { protocol, hostname } = new URL(url);
  const goesToAHost = (NETWORK_PROTOCOLS as readonly string[]).includes(protocol);
  return goesToAHost && isGoogleHost(hostname);
};

/** Point of the screen, in CSS pixels from its top left corner. */
export interface ScreenPoint {
  /** Distance from the left edge of the screen. */
  x: number;
  /** Distance from the top edge of the screen. */
  y: number;
}

/**
 * Finds the middle of the screen of a page from its size, such as the point where a scroll
 * gesture over a full-screen menu starts.
 *
 * @param viewport - Size of the screen, such as the one that `page.viewportSize()` returns.
 * @returns The middle of the screen, or `null` when the size is missing or holds a value that is
 * not a finite number (see {@link getScreenBox}).
 *
 * @example
 * getScreenCenter({ width: 568, height: 320 }); // { x: 284, y: 160 }
 */
export const getScreenCenter = (viewport?: ViewportSize | null): ScreenPoint | null => {
  const screen = getScreenBox(viewport);
  return screen && { x: screen.width / 2, y: screen.height / 2 };
};

/** How many levels deeper than the heading before it a heading may be: one at most. */
const MAX_HEADING_LEVEL_STEP = 1;

/** Deepest heading level of HTML, a `h6`. */
const MAX_HEADING_LEVEL = 6;

/** A heading that skips a level, found by {@link findSkippedHeadingLevels}. */
export interface SkippedHeading {
  /** Position of the heading among the headings of the page. */
  index: number;
  /** Its level, as given. */
  level: unknown;
}

/** Tells whether a value is a heading level: a whole number from 1 to 6. */
const isHeadingLevel = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= MAX_HEADING_LEVEL;

/**
 * Finds the headings that skip a level, as the `heading-order` rule of axe-core does: a heading
 * more than one level deeper than the heading before it, such as a `h3` right after the `h1`.
 * Going back up any number of levels is fine.
 *
 * @param levels - Levels of the headings of a page, in its order, such as the ones that
 * `listBrowserHeadingLevels` reads. Any value that is not an array counts as no heading.
 * @returns The position and the level of each heading that skips one, in order, or an empty list.
 * The first heading may only be a `h1`. Each heading is compared with the one right before it,
 * even when that one skipped a level. A level that is not a whole number from 1 to 6 counts as a
 * skip, and the heading after it is compared with the last valid one.
 *
 * @example
 * findSkippedHeadingLevels([1, 3, 3, 2, 3, 4, 2]); // [{ index: 1, level: 3 }]
 */
export const findSkippedHeadingLevels = (levels?: readonly unknown[] | null): SkippedHeading[] => {
  if (!Array.isArray(levels)) return [];

  const skips: SkippedHeading[] = [];
  // The page itself stands above its first heading, which may only be a h1
  let previousLevel = 0;
  levels.forEach((level: unknown, index) => {
    if (!isHeadingLevel(level)) {
      skips.push({ index, level });
      return;
    }

    const isTooDeep = level > previousLevel + MAX_HEADING_LEVEL_STEP;
    if (isTooDeep) skips.push({ index, level });
    previousLevel = level;
  });
  return skips;
};

/** Parameters of {@link countOccurrences}. */
interface CountOccurrencesParams {
  /** Text to search in. Any value that is not a string counts as an empty text. */
  text?: unknown;
  /** Text to count. An empty or missing one is never counted. */
  searched?: unknown;
}

/**
 * Counts how many times a text holds another, without overlaps, such as how many times a screen
 * reader reads the period of a job.
 *
 * @returns The number of occurrences, `0` when either text is empty or not a string.
 *
 * @example
 * countOccurrences({ text: 'août 2021 à Aujourd’hui · août 2021', searched: 'août 2021' }); // 2
 */
export const countOccurrences = ({ text, searched }: CountOccurrencesParams = {}): number => {
  const areTexts = typeof text === 'string' && typeof searched === 'string';
  if (!areTexts || searched === '') return 0;

  return text.split(searched).length - 1;
};
