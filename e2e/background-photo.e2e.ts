import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import { PAGES } from '../src/utils/pages';
import { LINK_INITIATOR_TYPE, PAGE_SELECTOR, PHOTO_SCREENS } from './constants';

/** URLs of every version of the background photo of every page. */
const PHOTO_URLS: readonly string[] = PAGES.flatMap(({ backgroundPhoto }) =>
  Object.values(backgroundPhoto),
);

// The HTML file of each page preloads its background photo, so that it shows with the text rather
// than once the app has drawn the page, in the version of the screen only: the portrait one, much
// lighter, on phones held upright. The links that preload it and the style that shows it read the
// same media query, or the browser would download both versions.
for (const language of LANGUAGES) {
  for (const { width, height, version } of PHOTO_SCREENS) {
    test.describe(`in ${language}, at ${width} × ${height} px`, () => {
      test.use({ viewport: { width, height } });

      for (const { path, backgroundPhoto } of PAGES) {
        const route = localizePath({ path, language });
        const photoUrl = backgroundPhoto[version];

        test(`${route} preloads ${photoUrl}, the only photo it downloads`, async ({ page }) => {
          const requestedPhotoUrls: string[] = [];
          page.on('request', request => {
            const { pathname } = new URL(request.url());
            if (PHOTO_URLS.includes(pathname)) requestedPhotoUrls.push(pathname);
          });

          await page.goto(route);
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          await page.waitForLoadState('networkidle');
          const initiatorType = await page.evaluate(url => {
            const [entry] = performance.getEntriesByName(new URL(url, location.href).href);
            return (entry as PerformanceResourceTiming | undefined)?.initiatorType;
          }, photoUrl);

          expect(requestedPhotoUrls).toEqual([photoUrl]);
          expect(initiatorType, 'what requested the photo').toBe(LINK_INITIATOR_TYPE);
        });
      }
    });
  }
}
