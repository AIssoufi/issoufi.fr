import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { fr } from '../src/i18n/fr';
import { localizePath } from '../src/i18n/utils';
import { HOME_PAGE, PAGES } from '../src/utils/pages';
import { listLastingAnimations, waitForEndingAnimations } from './animations';
import {
  INSTANT_ANIMATION_MAX_MS,
  MOBILE_SCREEN_WIDTHS_PX,
  PAGE_SELECTOR,
  PROJECTS_ROUTE,
  REDUCED_MOTION_SCREEN_WIDTHS_PX,
  SCREEN_HEIGHT_PX,
  STILLNESS_DELAY_MS,
} from './constants';
import { getCheckedRoutes } from './utils';

/** Desktop width of the screen of the control test, without reduced motion. */
const [, DESKTOP_WIDTH_PX] = REDUCED_MOTION_SCREEN_WIDTHS_PX;

/** Parameters of {@link openPage}. */
interface OpenPageParams {
  /** Browser page of the test. */
  page: Page;
  /** Route to open, such as `/en/projects`. */
  route: string;
}

/** Opens a route and waits until its page is whole: its chunk, its images and its web fonts. */
const openPage = async ({ page, route }: OpenPageParams) => {
  await page.goto(route);
  await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

/** Describes the animations and transitions of the page that last longer than an instant. */
const listPageLastingAnimations = (page: Page) =>
  page.locator('html').evaluate(listLastingAnimations, { maxDurationMs: INSTANT_ANIMATION_MAX_MS });

/** Tells whether two screenshots of the screen, {@link STILLNESS_DELAY_MS} apart, are identical. */
const isScreenStill = async (page: Page) => {
  const before = await page.screenshot();
  await page.waitForTimeout(STILLNESS_DELAY_MS);
  const after = await page.screenshot();
  return before.equals(after);
};

// jsdom applies no media query and runs no animation, so only a real browser sees what still moves
for (const width of REDUCED_MOTION_SCREEN_WIDTHS_PX) {
  test.describe(`with reduced motion, on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, reducedMotion: 'reduce' });

    for (const language of LANGUAGES) {
      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} runs no animation`, async ({ page }) => {
          await openPage({ page, route });

          expect(
            await listPageLastingAnimations(page),
            `animations longer than ${INSTANT_ANIMATION_MAX_MS} ms`,
          ).toEqual([]);
        });
      }

      const homeRoute = localizePath({ path: HOME_PAGE.path, language });
      test(`${homeRoute} stands still, even under the pointer`, async ({ page }) => {
        await openPage({ page, route: homeRoute });
        // Over the title, the pointer would push its words, pull the glow and link the dots to it
        await page.getByRole('heading', { level: 1 }).hover();

        expect(
          await isScreenStill(page),
          `screenshots ${STILLNESS_DELAY_MS} ms apart, expected to be identical`,
        ).toBe(true);
      });
    }

    test('a project card stays flat under the pointer', async ({ page }) => {
      await openPage({ page, route: PROJECTS_ROUTE });
      const card = page.getByRole('main').getByRole('listitem').first();

      await card.hover();
      // Away from the pointer, a card has a flat perspective transform, which the hover removes
      await card.evaluate(waitForEndingAnimations);

      expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none');
    });

    const hasMobileMenu = (MOBILE_SCREEN_WIDTHS_PX as readonly number[]).includes(width);
    if (hasMobileMenu) {
      // The app opens in French, the default language
      test('the mobile menu shows its links at once', async ({ page }) => {
        await openPage({ page, route: HOME_PAGE.path });

        await page.getByRole('button', { name: fr.burgerMenu.open }).click();
        await expect(page.getByRole('link', { name: fr.githubLink.label })).toBeVisible();

        expect(
          await listPageLastingAnimations(page),
          `animations longer than ${INSTANT_ANIMATION_MAX_MS} ms`,
        ).toEqual([]);
      });
    }
  });
}

test.describe('without reduced motion', () => {
  test.use({
    viewport: { width: DESKTOP_WIDTH_PX, height: SCREEN_HEIGHT_PX },
    reducedMotion: 'no-preference',
  });

  // The checks above would pass on a site that never moves: this one sees the motion they refuse
  test('the home page moves as before', async ({ page }) => {
    await openPage({ page, route: HOME_PAGE.path });

    expect(await listPageLastingAnimations(page)).not.toEqual([]);
    expect(await isScreenStill(page)).toBe(false);
  });

  test('a project card tilts under the pointer as before', async ({ page }) => {
    await openPage({ page, route: PROJECTS_ROUTE });
    const card = page.getByRole('main').getByRole('listitem').first();

    await card.hover();

    expect(await card.evaluate(element => element.style.transform)).toContain('rotateY');
  });
});
