import { localizePath } from '../src/i18n/utils';
import { MAX_CARD_OFFSET_PX, NOT_FOUND_ROUTE, QUAD_COORDINATE_COUNT } from './constants';

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

/** Parameters of {@link countWholeCards}. */
interface CountWholeCardsParams {
  /** Boxes of the cards of a row, in any order. */
  cards?: readonly CardBox[] | null;
  /** Visible box of the list that holds the row, which scrolls the cards it cannot show. */
  container?: CardBox | null;
  /**
   * How far a card may overflow the container, for subpixel rounding. `NaN` counts no card whole.
   * @default MAX_CARD_OFFSET_PX
   */
  tolerancePx?: number;
}

/**
 * Counts the cards of a row that the screen shows whole, without scrolling the row: those whose
 * left and right edges both lie inside the container. Used as the number of columns that the
 * cards fit in.
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
  tolerancePx = MAX_CARD_OFFSET_PX,
}: CountWholeCardsParams = {}): number => {
  const canCount = Array.isArray(cards) && isCardBox(container);
  if (!canCount) return 0;

  const containerRight = container.left + container.width;
  const isWhole = (card: CardBox) => {
    const startsInside = card.left >= container.left - tolerancePx;
    const endsInside = card.left + card.width <= containerRight + tolerancePx;
    return startsInside && endsInside;
  };
  return cards.filter(isCardBox).filter(isWhole).length;
};

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

/** Parameters of {@link getBoxCenterDistanceX}. */
interface GetBoxCenterDistanceXParams {
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
export const getBoxCenterDistanceX = ({ box, referenceBox }: GetBoxCenterDistanceXParams = {}) =>
  Math.abs(getBoxCenterX(box) - getBoxCenterX(referenceBox));

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
