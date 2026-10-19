import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { PAGES } from '../src/utils/pages.ts';
import { PAGE_SELECTOR, PROJECTS_ROUTE, SHOW_ALL_BUTTON_NAME } from './constants.ts';
import { getCheckedRoutes } from './utils.ts';

/**
 * Font stack of the site as the browser writes it, Montserrat first (`fontFamilies.montserrat`,
 * `src/theme/tokens.ts`).
 */
const SITE_FONT_PATTERN = /^Montserrat,/;

/**
 * Reads the font stack that an element draws its text in. Runs in the browser, passed to
 * `locator.evaluate`, so it uses nothing from outside its own body.
 */
const readFontFamily = (element: Element) => getComputedStyle(element).fontFamily;

// jsdom has no style of its own for the controls: only a real browser tells the font that it
// gives a button
for (const language of LANGUAGES) {
  test.describe(`in ${language}`, () => {
    for (const route of getCheckedRoutes({ pages: PAGES, language })) {
      test(`${route} draws the text of every button in the font of the site`, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // The pages loaded lazily show their content once their chunk is loaded
        await expect(page.locator(PAGE_SELECTOR)).toBeVisible();

        const siteFont = await page.locator('body').evaluate(readFontFamily);
        const textButtons = page.locator('button').filter({ hasText: /\S/ });

        expect(siteFont).toMatch(SITE_FONT_PATTERN);
        for (const button of await textButtons.all()) {
          await expect(button).toHaveCSS('font-family', siteFont);
        }
      });
    }

    test('the Projects page draws its show all buttons in Montserrat', async ({ page }) => {
      await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
      const showAllButtons = page.getByRole('button', { name: SHOW_ALL_BUTTON_NAME });

      // A section with too many projects for its row offers to show them all
      await expect(showAllButtons).not.toHaveCount(0);
      for (const button of await showAllButtons.all()) {
        await expect(button).toHaveCSS('font-family', SITE_FONT_PATTERN);
      }
    });
  });
}
