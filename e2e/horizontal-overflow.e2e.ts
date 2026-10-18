import { expect, test } from '@playwright/test';

import { PAGES } from '../src/utils/pages';
import { PAGE_SELECTOR, SCREEN_HEIGHT_PX, SCREEN_WIDTHS_PX } from './constants';
import { getCheckedRoutes } from './utils';

// jsdom computes no layout, so only a real browser sees a page wider than the screen
for (const width of SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    for (const route of getCheckedRoutes(PAGES)) {
      test(`${route} does not scroll sideways`, async ({ page }) => {
        await page.goto(route);
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
