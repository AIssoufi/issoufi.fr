import { expect, test } from '@playwright/test';

import { fr } from '../src/i18n/fr.ts';
import {
  HEADERS_FILE_ROUTE,
  LOCATION_HEADER,
  NO_INDEX_ROBOTS,
  NOT_FOUND_STATUS,
  REDIRECT_STATUS,
  REDIRECTED_ROUTES,
  ROBOTS_META_SELECTOR,
} from './constants.ts';

// The preview redirects each other path of a page to its canonical one as Cloudflare Pages does,
// so a test never passes at a URL that production redirects
for (const { path: route, location } of REDIRECTED_ROUTES) {
  test(`${route} redirects to ${location} with the status ${REDIRECT_STATUS}`, async ({
    request,
  }) => {
    const response = await request.get(route, { maxRedirects: 0 });

    expect(response.status(), 'status of the response').toBe(REDIRECT_STATUS);
    expect(response.headers()[LOCATION_HEADER], 'location of the redirect').toBe(location);
  });

  test(`a visit of ${route} ends at ${location}`, async ({ page, baseURL }) => {
    const response = await page.goto(route);

    expect(response?.ok(), 'page served').toBe(true);
    expect(page.url()).toBe(new URL(location, baseURL).href);
  });
}

// Cloudflare Pages reads this file of the build and never serves it
test(`${HEADERS_FILE_ROUTE} answers with the not found page and the status 404`, async ({
  page,
}) => {
  const response = await page.goto(HEADERS_FILE_ROUTE);

  expect(response?.status(), 'status of the page').toBe(NOT_FOUND_STATUS);
  await expect(page.locator(ROBOTS_META_SELECTOR)).toHaveAttribute('content', NO_INDEX_ROBOTS);
  await expect(
    page.getByRole('heading', { level: 1, name: fr.errors.notFound.title }),
  ).toBeVisible();
});
