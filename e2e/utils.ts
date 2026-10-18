import { NOT_FOUND_ROUTE } from './constants';

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
