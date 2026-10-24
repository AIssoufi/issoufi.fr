import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { PAGES } from '../src/utils/pages.ts';
import {
  LONG_NOT_FOUND_ROUTE,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  SCREEN_WIDTHS_PX,
} from './constants.ts';
import { waitForPageContent } from './loading.ts';
import { getCheckedRoutes } from './utils.ts';

// jsdom computes no layout, so only a real browser sees a page wider than the screen
for (const language of LANGUAGES) {
  for (const width of SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      // Each language has its own text widths, and its own URLs: /en/projects opens in English.
      // The not found page names the path it is opened at, which a long one must not widen.
      const routes = [
        ...getCheckedRoutes({ pages: PAGES, language }),
        localizePath({ path: LONG_NOT_FOUND_ROUTE, language }),
      ];
      for (const route of routes) {
        test(`${route} does not scroll sideways`, async ({ page }) => {
          await page.goto(route);
          // A route that lost its language would test the default language twice
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          // Measured before its chunk is loaded, or if it failed to render, a page would pass
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // Its images, then the web fonts that replace the fallback font, change its width
          await page.evaluate(waitForPageContent);

          const { scrollWidth, clientWidth } = await page.evaluate(() => {
            const { scrollWidth, clientWidth } = document.documentElement;
            return { scrollWidth, clientWidth };
          });
          expect(scrollWidth, 'page width in px, expected to match the screen width').toBe(
            clientWidth,
          );
        });
      }
    });
  }
}
