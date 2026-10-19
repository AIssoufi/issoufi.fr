import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import {
  MAX_DOT_OFFSET_PX,
  MAX_TEXT_OVERFLOW_PX,
  PERIOD_COLUMN_SCREEN_WIDTHS_PX,
  PERIOD_COLUMN_SELECTOR,
  SCREEN_HEIGHT_PX,
  TIMELINE_DOT_ATTRIBUTE,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
  TIMELINE_SCREEN_WIDTHS_PX,
} from './constants.ts';
import { getMarkedPseudoElementQuads } from './pseudo-elements.ts';
import { getCenterDistanceX } from './utils.ts';

// The line and the dots are pseudo-elements placed by hand, whose offsets depend on the size, the
// border and the box-sizing of the dots: jsdom computes no layout, so only a real browser sees a
// dot off the line
for (const language of LANGUAGES) {
  for (const width of TIMELINE_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('the dots of the timeline are centered on its line', async ({ page }) => {
        // The page opens in the language of its URL: /en/experiences in English
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        // A route that lost its language would test the default language twice
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // Measured before the chunk of the page is loaded, there would be no timeline to measure
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();

        const session = await page.context().newCDPSession(page);
        const lineQuads = await getMarkedPseudoElementQuads({
          session,
          attribute: TIMELINE_LINE_ATTRIBUTE,
        });
        const dotQuads = await getMarkedPseudoElementQuads({
          session,
          attribute: TIMELINE_DOT_ATTRIBUTE,
        });

        expect(lineQuads, 'lines drawn on the timeline').toHaveLength(1);
        // A dot that lost its attribute would not be measured: without any, nothing is checked
        expect(dotQuads.length, 'dots drawn on the timeline').toBeGreaterThan(0);
        // Soft, so that a failure reports every dot off the line, not only the first one
        dotQuads.forEach((quad, index) => {
          expect
            .soft(
              getCenterDistanceX({ quad, referenceQuad: lineQuads[0] }),
              `distance in px from the center of dot ${index + 1} to the center of the line`,
            )
            .toBeLessThanOrEqual(MAX_DOT_OFFSET_PX);
        });
      });
    });
  }
}

// A date wider than its column overflows it on the left, since the column aligns its dates on the
// right and never wraps them: only a real browser measures the text in the web font
for (const language of LANGUAGES) {
  for (const width of PERIOD_COLUMN_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('every date of the period column stays inside the column', async ({ page }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        const columns = page.locator(PERIOD_COLUMN_SELECTOR);
        await expect(columns.first()).toBeVisible();
        // The dates take their width once the web font is loaded
        await page.evaluate(() => document.fonts.ready);

        const { partCount, overflows } = await columns.evaluateAll(
          (columnElements, maxOverflowPx) => {
            const range = document.createRange();
            // The parts that each column draws: its dates and the mark between them, but not the
            // word that only screen readers read, out of the flow
            const parts = columnElements.flatMap(column =>
              [...column.children]
                .filter(part => getComputedStyle(part).position !== 'absolute')
                .map(part => ({ part, box: column.getBoundingClientRect() })),
            );
            const outsideParts = parts.flatMap(({ part, box }) => {
              range.selectNodeContents(part);
              const { left, right } = range.getBoundingClientRect();
              const isInside =
                left >= box.left - maxOverflowPx && right <= box.right + maxOverflowPx;
              if (isInside) return [];
              return [
                `"${part.textContent}": ${left}-${right} px, column ${box.left}-${box.right} px`,
              ];
            });
            return { partCount: parts.length, overflows: outsideParts };
          },
          MAX_TEXT_OVERFLOW_PX,
        );

        // Without any date, nothing would be checked
        expect(partCount, 'dates and marks of the period columns').toBeGreaterThan(0);
        expect(overflows).toEqual([]);
      });
    });
  }
}
