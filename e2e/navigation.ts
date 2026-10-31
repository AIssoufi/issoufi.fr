import { errors, type Page } from '@playwright/test';

import { BLANK_PAGE_URL, NAVIGATION_COMMIT_TIMEOUT_MS } from './constants.ts';

/** Parameters of {@link gotoRoute}. */
interface GotoRouteParams {
  /** Tab to open the route in. */
  page: Page;
  /** Route to open, as `page.goto` reads it. */
  route: string;
}

/** Parameters of {@link isLostNavigation}. */
interface IsLostNavigationParams {
  /** Error that the navigation failed with. */
  error: unknown;
  /** Tab of the navigation. */
  page: Page;
}

/** Tells whether a navigation was lost: it found no commit, and the tab is still blank. */
const isLostNavigation = ({ error, page }: IsLostNavigationParams) =>
  error instanceof errors.TimeoutError && page.url() === BLANK_PAGE_URL;

/** Navigates until the new document commits, a second time when WebKit lost the first one. */
const commitRoute = async ({ page, route }: GotoRouteParams) => {
  try {
    return await page.goto(route, { waitUntil: 'commit', timeout: NAVIGATION_COMMIT_TIMEOUT_MS });
  } catch (error) {
    if (!isLostNavigation({ error, page })) throw error;
    // Printed in the output of the test, so a retry that starts to fire often stays visible
    console.warn(`Lost navigation: opening ${route} again`);
    return page.goto(route, { waitUntil: 'commit' });
  }
};

/**
 * Opens a route as `page.goto` does, up to the `load` event, and navigates once more when WebKit
 * loses the navigation. The `Cross-Origin-Opener-Policy` header of the site moves the first page of
 * a tab to a new process, and WebKit drops that navigation with no error when the local server
 * answers too fast ({@link https://bugs.webkit.org/show_bug.cgi?id=327297 bug 327297}): a bare
 * `page.goto` then waits on a blank page until the test times out. Every spec of the `webkit`
 * project opens its pages with it.
 *
 * @returns The answer to the navigation, as `page.goto` gives it.
 * @throws Rejects with the error of the second navigation, and with that of the first when it was
 * not lost: any error but a timeout, or a timeout on a tab that has left its blank page.
 *
 * @example
 * const response = await gotoRoute({ page, route: '/projects' });
 */
export const gotoRoute = async ({ page, route }: GotoRouteParams) => {
  const response = await commitRoute({ page, route });
  await page.waitForLoadState('load');
  return response;
};
