import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { theme } from '../src/theme/theme.ts';
import { PAGES } from '../src/utils/pages.ts';
import {
  MAX_CONTENT_WIDTH_OFFSET_PX,
  MIN_CONTENT_SCREEN_SHARE,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  WIDE_SCREEN_WIDTHS_PX,
} from './constants.ts';
import { getCheckedRoutes } from './utils.ts';

/** Largest width of the app container from the `wide` breakpoint, in pixels. */
const WIDE_CONTAINER_WIDTH_PX = Number.parseFloat(theme.sizes['container-wide']);

/** Gutter of every page on each side of its content, in pixels. */
const PAGE_GUTTER_PX = Number.parseFloat(theme.space.page);

/** Share of the screen as a percentage, as the test names write it. */
const MIN_CONTENT_SCREEN_PERCENT = MIN_CONTENT_SCREEN_SHARE * 100;

// jsdom ignores the media queries and lays nothing out: only a real browser tells how wide the
// content of a page is drawn on a large screen
for (const language of LANGUAGES) {
  for (const width of WIDE_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} spreads its content over at least ${MIN_CONTENT_SCREEN_PERCENT} % of the screen`, async ({
          page,
        }) => {
          await page.goto(route);
          // A route that lost its language would test the default language twice
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          const main = page.locator(PAGE_SELECTOR);
          // The pages loaded lazily show their content once their chunk is loaded
          await expect(main).toBeVisible();

          // The box of the main landmark, inside the gutters of the page
          const contentWidth = await main.evaluate(element => {
            const { paddingLeft, paddingRight } = getComputedStyle(element);
            const { width: boxWidth } = element.getBoundingClientRect();
            return boxWidth - Number.parseFloat(paddingLeft) - Number.parseFloat(paddingRight);
          });
          const containerWidth = Math.min(width, WIDE_CONTAINER_WIDTH_PX);

          expect(
            Math.abs(contentWidth - (containerWidth - 2 * PAGE_GUTTER_PX)),
            `content ${contentWidth} px wide, expected the wide app container less the gutters`,
          ).toBeLessThanOrEqual(MAX_CONTENT_WIDTH_OFFSET_PX);
          expect(contentWidth / width, 'share of the screen width').toBeGreaterThanOrEqual(
            MIN_CONTENT_SCREEN_SHARE,
          );
        });
      }
    });
  }
}
