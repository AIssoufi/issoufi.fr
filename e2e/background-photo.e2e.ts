import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { PAGES } from '../src/utils/pages.ts';
import { LINK_INITIATOR_TYPE, PAGE_SELECTOR, PHOTO_SCREENS } from './constants.ts';

/** URLs of both files of the background photo of every page. */
const PHOTO_URLS: readonly string[] = PAGES.flatMap(({ backgroundPhoto: { url, portraitUrl } }) => [
  url,
  portraitUrl,
]);

// The app preloads the background photo of the page as soon as its main script runs
// (src/preloadBackgroundPhoto.ts), rather than once it has drawn the page, in the version of the
// screen only: the portrait one, much lighter, on phones held upright. The preload and the style
// that shows the photo read the same media query, or the browser would download both versions.
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
