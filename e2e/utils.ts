import { MAX_CARD_OFFSET_PX, NOT_FOUND_ROUTE, QUAD_COORDINATE_COUNT } from './constants';

/** A page of the site, of which only the route matters here, such as an entry of `PAGES`. */
interface RoutedPage {
  /** Route of the page, e.g. `/projects`. */
  path?: unknown;
}

/** Tells whether a value is a route of the site: a string that starts with `/`. */
const isRoute = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('/');

/**
 * Lists the routes the browser tests open: the route of every page, in order, then
 * {@link NOT_FOUND_ROUTE} for the not found page. Given `PAGES` (`src/utils/pages.ts`), it
 * covers a new page without any change to the tests.
 *
 * @param pages - Pages of the site. Any value that is not an array counts as none.
 * @returns Each route once, the not found route last. Entries that are not pages, and pages
 * whose path is not a string starting with `/`, are skipped.
 *
 * @example
 * getCheckedRoutes([{ path: '/' }, { path: '/projects' }]);
 * // ['/', '/projects', '/browser-test-page-that-does-not-exist']
 */
export const getCheckedRoutes = (pages?: readonly RoutedPage[] | null): string[] => {
  const pageList = Array.isArray(pages) ? pages : [];
  const pageRoutes = pageList.map(page => page?.path).filter(isRoute);
  return [...new Set([...pageRoutes, NOT_FOUND_ROUTE])];
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
  /** How far a card may overflow the container, for subpixel rounding. */
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
  /** How far apart the tops of two cards of the same row may be, for subpixel rounding. */
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
