import { NOT_FOUND_ROUTE, QUAD_COORDINATE_COUNT } from './constants';

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
