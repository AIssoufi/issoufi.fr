import { expect, test } from '@playwright/test';

import { fr } from '../src/i18n/fr.ts';
import {
  CLOUDFLARE_CONFIG_FILE_ROUTES,
  LOCATION_HEADER,
  NO_INDEX_ROBOTS,
  NOT_FOUND_STATUS,
  NOT_SHORT_LINK_ROUTES,
  REDIRECT_STATUS,
  REDIRECTED_ROUTES,
  ROBOTS_META_SELECTOR,
  SHORT_LINK_ROUTES,
  SHORT_LINK_STATUS,
} from './constants.ts';
import { gotoRoute } from './navigation.ts';

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
    const response = await gotoRoute({ page, route });

    expect(response?.ok(), 'page served').toBe(true);
    expect(page.url()).toBe(new URL(location, baseURL).href);
  });
}

// The tests read the answer alone: following a short link would leave the site for GitHub
for (const { path: route, location } of SHORT_LINK_ROUTES) {
  test(`${route} redirects to ${location} with the status ${SHORT_LINK_STATUS}`, async ({
    request,
  }) => {
    const response = await request.get(route, { maxRedirects: 0 });

    expect(response.status(), 'status of the response').toBe(SHORT_LINK_STATUS);
    expect(response.headers()[LOCATION_HEADER], 'location of the redirect').toBe(location);
  });
}

// A rule of `_redirects` applies to every method, where a canonical redirect reads a page
test(`a POST request of ${SHORT_LINK_ROUTES[0].path} redirects too`, async ({ request }) => {
  const { path: route, location } = SHORT_LINK_ROUTES[0];

  const response = await request.post(route, { maxRedirects: 0 });

  expect(response.status(), 'status of the response').toBe(SHORT_LINK_STATUS);
  expect(response.headers()[LOCATION_HEADER], 'location of the redirect').toBe(location);
});

for (const route of NOT_SHORT_LINK_ROUTES) {
  test(`${route} is no short link`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });

    expect(response.status(), 'status of the response').toBe(NOT_FOUND_STATUS);
  });
}

// Cloudflare Pages reads these files of the build and never serves them
for (const route of CLOUDFLARE_CONFIG_FILE_ROUTES) {
  test(`${route} answers with the not found page and the status 404`, async ({ page }) => {
    const response = await gotoRoute({ page, route });

    expect(response?.status(), 'status of the page').toBe(NOT_FOUND_STATUS);
    await expect(page.locator(ROBOTS_META_SELECTOR)).toHaveAttribute('content', NO_INDEX_ROBOTS);
    await expect(
      page.getByRole('heading', { level: 1, name: fr.errors.notFound.title }),
    ).toBeVisible();
  });
}
