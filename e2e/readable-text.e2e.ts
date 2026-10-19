import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { MIN_FONT_SIZE_PX } from '../src/theme/constants';
import { PAGES } from '../src/utils/pages';
import { PAGE_SELECTOR, SCREEN_HEIGHT_PX, TEXT_SIZE_SCREEN_WIDTHS_PX } from './constants';
import { describeSmallTexts, listDrawnTexts } from './text';
import { getCheckedRoutes } from './utils';

// jsdom ignores the media queries that change the font sizes: only a real browser tells the size
// that each text is drawn in
for (const language of LANGUAGES) {
  for (const width of TEXT_SIZE_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} shows no text under ${MIN_FONT_SIZE_PX} px`, async ({ page }) => {
          await page.goto(route);
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          // The pages loaded lazily show their content once their chunk is loaded
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();

          const texts = await page.locator('body').evaluate(listDrawnTexts);

          // An empty page would show no small text either
          expect(texts.length).toBeGreaterThan(0);
          expect(describeSmallTexts({ texts, minFontSizePx: MIN_FONT_SIZE_PX })).toEqual([]);
        });
      }
    });
  }
}
