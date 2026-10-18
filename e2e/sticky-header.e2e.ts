import { expect, test } from '@playwright/test';

import { LANGUAGES, ROOT_PATH } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import { waitForEndingAnimations } from './animations';
import {
  LONG_PAGE_ROUTE,
  MAX_BAND_OFFSET_PX,
  PAGE_SELECTOR,
  PROJECTS_ROUTE,
  SHOW_ALL_BUTTON_NAME,
  STICKY_HEADER_SCREEN_HEIGHT_PX,
  STICKY_HEADER_SCREEN_WIDTHS_PX,
} from './constants';
import { scrollToEnd } from './scroll';

/** The long pages, scrolled to their end: the Experiences page and the Projects page. */
const LONG_PAGE_PATHS = [LONG_PAGE_ROUTE, PROJECTS_ROUTE] as const;

/** Text of the logo, which links to the home page. */
const LOGO_TEXT = 'AI';

/**
 * Measures the blurred band of the header, its `::after`, which the DOM gives no box for: its top
 * and its height as laid out, in CSS pixels. Runs in the browser.
 */
const getBandBox = (header: Element) => {
  const { top, height } = getComputedStyle(header, '::after');
  return { top: Number.parseFloat(top), height: Number.parseFloat(height) };
};

// jsdom computes no layout and scrolls nothing, so only a real browser sees the header leave the
// screen, or its band blur the page alone
for (const language of LANGUAGES) {
  for (const width of STICKY_HEADER_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: STICKY_HEADER_SCREEN_HEIGHT_PX } });

      for (const path of LONG_PAGE_PATHS) {
        const route = localizePath({ path, language });

        test(`the header stays on the screen and usable down to the end of ${route}`, async ({
          page,
        }) => {
          await page.goto(route);
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // "Show all" wraps the cards of each row of the Projects page onto as many rows as they
          // need, which makes it as long as it gets. A clicked button becomes "Show less", so the
          // first one left is clicked until none is
          const showAllButtons = page.getByRole('button', { name: SHOW_ALL_BUTTON_NAME });
          while ((await showAllButtons.count()) > 0) await showAllButtons.first().click();
          await page.locator(PAGE_SELECTOR).evaluate(waitForEndingAnimations);

          // The header used to leave the screen after one screen of scrolling
          expect(await page.evaluate(scrollToEnd), 'scroll position at the end').toBeGreaterThan(
            STICKY_HEADER_SCREEN_HEIGHT_PX,
          );
          const header = page.getByRole('banner');
          await expect(header).toBeInViewport({ ratio: 1 });
          const headerBox = await header.boundingBox();
          expect(headerBox?.y, 'top of the header').toBe(0);

          const bandBox = await header.evaluate(getBandBox);
          expect(
            Math.abs(bandBox.top - (headerBox?.y ?? Number.NaN)),
            `distance in px from the top of the blurred band to the top of the header`,
          ).toBeLessThanOrEqual(MAX_BAND_OFFSET_PX);
          expect(
            Math.abs(bandBox.height - (headerBox?.height ?? Number.NaN)),
            `difference in px between the height of the blurred band and that of the header`,
          ).toBeLessThanOrEqual(MAX_BAND_OFFSET_PX);

          // Checked in place first, since a click would scroll a link off the screen back into it
          const logo = header.getByRole('link', { name: LOGO_TEXT, exact: true });
          await expect(logo).toBeInViewport({ ratio: 1 });
          await logo.click();
          await expect(page).toHaveURL(localizePath({ path: ROOT_PATH, language }));
        });
      }
    });
  }
}
