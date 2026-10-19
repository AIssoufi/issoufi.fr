import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { FONT_FACES } from '../src/theme/constants.ts';
import { PAGES } from '../src/utils/pages.ts';
import { PAGE_SELECTOR } from './constants.ts';
import { getCheckedRoutes, isGoogleUrl } from './utils.ts';

// The site serves its fonts itself: no page may send a request to Google, whose fonts every visit
// used to load, nor to any other Google service
for (const language of LANGUAGES) {
  test.describe(`in ${language}`, () => {
    for (const route of getCheckedRoutes({ pages: PAGES, language })) {
      test(`${route} requests nothing from Google, and shows the fonts of the site`, async ({
        page,
      }) => {
        const requestedUrls: string[] = [];
        page.on('request', request => requestedUrls.push(request.url()));

        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // The pages loaded lazily request their chunk, then their images, once the header shows
        await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
        await page.waitForLoadState('networkidle');
        const loadedFamilies = await page.evaluate(async () => {
          await document.fonts.ready;
          return [...document.fonts]
            .filter(({ status }) => status === 'loaded')
            .map(({ family }) => family.replace(/^["']|["']$/g, ''));
        });

        expect(requestedUrls.filter(isGoogleUrl), 'requests to Google').toEqual([]);
        // Every page shows text in each font: the body text, and the logo of the header
        FONT_FACES.forEach(({ family }) => expect(loadedFamilies).toContain(family));
      });
    }
  });
}
