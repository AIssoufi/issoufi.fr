import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { PAGES } from '../src/utils/pages.ts';
import {
  PAGE_SELECTOR,
  VISUAL_CLOCK_TIME,
  VISUAL_RANDOM_SEED,
  VISUAL_SCREENS,
} from './constants.ts';
import { waitForPageContent } from './loading.ts';
import { loadAllImages, seedRandom } from './screenshots.ts';
import { getCheckedRoutes } from './utils.ts';

// The screenshots of the build of the base of the change are the expected ones, which this test
// writes first, then compares with those of the working tree (pnpm test:visual,
// scripts/ci/compare-screenshots.mjs). Only what the change draws may differ: the clock, the
// random values, the motion (reduced in playwright.visual.config.ts, which also hides the cursor
// glow) and the loading of the images and the fonts are the same in both runs
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(VISUAL_CLOCK_TIME);
  await page.addInitScript(seedRandom, VISUAL_RANDOM_SEED);
});

for (const screen of VISUAL_SCREENS) {
  test.describe(`${screen.name}, ${screen.width} px`, () => {
    test.use({ viewport: { width: screen.width, height: screen.height } });

    for (const language of LANGUAGES) {
      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(route, async ({ page }) => {
          await page.goto(route);
          // The pages other than the home page render from their own chunk, after the header
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          await page.evaluate(loadAllImages);
          // The background photo, which no img shows, then the web fonts
          await page.evaluate(waitForPageContent);

          await expect(page).toHaveScreenshot({ fullPage: true });
        });
      }
    }
  });
}
