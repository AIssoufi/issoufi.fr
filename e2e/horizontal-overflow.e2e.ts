import { expect, test } from '@playwright/test';

import { LANGUAGE_STORAGE_KEY, LANGUAGES } from '../src/i18n/constants';
import { PAGES } from '../src/utils/pages';
import { PAGE_SELECTOR, SCREEN_HEIGHT_PX, SCREEN_WIDTHS_PX } from './constants';
import { getCheckedRoutes } from './utils';

// jsdom computes no layout, so only a real browser sees a page wider than the screen
for (const language of LANGUAGES) {
  for (const width of SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      // Each language has its own text widths. The app opens in the one the toggle stored.
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
          key: LANGUAGE_STORAGE_KEY,
          value: language,
        });
      });

      for (const route of getCheckedRoutes(PAGES)) {
        test(`${route} does not scroll sideways`, async ({ page }) => {
          await page.goto(route);
          // Without the stored language, every run would test the default language
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          // Measured before its chunk is loaded, or if it failed to render, a page would pass
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // Its images, then the web fonts that replace the fallback font, change its width
          await page.waitForLoadState('networkidle');
          await page.evaluate(async () => {
            await document.fonts.ready;
          });

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
