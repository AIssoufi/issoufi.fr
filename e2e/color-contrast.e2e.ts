import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Language, Translations } from '../src/i18n/types';
import { PAGES } from '../src/utils/pages';
import { waitForEndingAnimations } from './animations';
import { describeAxeViolations, runAxeRules } from './axe';
import {
  COLOR_CONTRAST_RULE,
  CONTRAST_SCREEN_WIDTHS_PX,
  MENU_CONTRAST_SCREEN_WIDTHS_PX,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
} from './constants';
import { getCheckedRoutes } from './utils';

/** Translations of each language, to find the burger button of the mobile menu. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Parameters of {@link openPage}. */
interface OpenPageParams {
  /** Page of the test. */
  page: Page;
  /** Route to open, behind the prefix of its language. */
  route: string;
  /** Language of the route. */
  language: Language;
}

/** Opens a route once its page and its fonts are shown, so that axe-core measures its texts. */
const openPage = async ({ page, route, language }: OpenPageParams) => {
  await page.goto(route);
  // A route that lost its language would check the default language twice
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  // The pages loaded lazily show their content once their chunk is loaded, after the header
  await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

// jsdom computes no colors over the layers of a page: axe-core measures the contrast of each text
// in the browser, against what is drawn under it. With reduced motion, the texts that fade in,
// such as the links of the mobile menu, show at once in their final colors
test.use({ reducedMotion: 'reduce' });

for (const language of LANGUAGES) {
  for (const width of CONTRAST_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} gives every text the contrast of WCAG AA`, async ({ page }) => {
          await openPage({ page, route, language });

          const violations = await runAxeRules({ page, rules: [COLOR_CONTRAST_RULE] });

          expect(describeAxeViolations(violations)).toEqual([]);
        });
      }
    });
  }

  for (const width of MENU_CONTRAST_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen, the mobile menu open`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} gives every text the contrast of WCAG AA`, async ({ page }) => {
          await openPage({ page, route, language });
          await page.getByRole('button', { name: TRANSLATIONS[language].burgerMenu.open }).click();
          const navigation = page.getByRole('navigation');
          await expect(navigation).toBeVisible();
          await navigation.evaluate(waitForEndingAnimations);

          const violations = await runAxeRules({ page, rules: [COLOR_CONTRAST_RULE] });

          expect(describeAxeViolations(violations)).toEqual([]);
        });
      }
    });
  }
}
