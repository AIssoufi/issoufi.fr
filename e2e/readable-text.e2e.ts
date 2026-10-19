import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import { MIN_FONT_SIZE_PX } from '../src/theme/constants';
import { PAGES } from '../src/utils/pages';
import {
  LINE_LENGTH_SCREEN_WIDTHS_PX,
  MAX_LINE_CHARACTERS,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  TEXT_SIZE_SCREEN_WIDTHS_PX,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
} from './constants';
import { describeSmallTexts, groupLines, listDrawnCharacters, listDrawnTexts } from './text';
import { getCheckedRoutes } from './utils';

/** Tells whether a line holds more characters than a reader follows easily. */
const isLongLine = (line: string) => line.length > MAX_LINE_CHARACTERS;

// jsdom ignores the media queries that change the font sizes and lays out no line: only a real
// browser tells the size that each text is drawn in, and where its lines wrap
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

  for (const width of LINE_LENGTH_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test(`the Experiences page writes no line over ${MAX_LINE_CHARACTERS} characters`, async ({
        page,
      }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();
        // The lines wrap where the web font puts them, once it is loaded
        await page.evaluate(() => document.fonts.ready);

        const characters = await page.locator(PAGE_SELECTOR).evaluate(listDrawnCharacters);
        const lines = groupLines(characters);

        // A page without text would write no long line either
        expect(lines.length).toBeGreaterThan(0);
        expect(lines.filter(isLongLine)).toEqual([]);
      });
    });
  }
}
