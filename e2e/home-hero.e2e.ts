import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import { HOME_PAGE } from '../src/utils/pages';
import { HERO_SCREENS, PAGE_SELECTOR } from './constants';
import { getScreenBox, isBoxInside } from './utils';

/** Number of buttons of the home page, the links under its title. */
const HERO_BUTTON_COUNT = 2;

/** Parameters of {@link openHomePage}. */
interface OpenHomePageParams {
  /** Browser page of the test. */
  page: Page;
  /** Route of the home page in a language, such as `/en/`. */
  route: string;
}

/** Opens the home page and waits for its web fonts, which set the size of its title. */
const openHomePage = async ({ page, route }: OpenHomePageParams) => {
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

// jsdom computes no layout, so only a real browser sees the buttons fall below the screen
for (const language of LANGUAGES) {
  const route = localizePath({ path: HOME_PAGE.path, language });

  for (const viewport of HERO_SCREENS) {
    test.describe(`in ${language}, on a ${viewport.width} × ${viewport.height} px screen`, () => {
      // The title and the buttons rise into place, then the intro floats: reduced motion leaves
      // them where they rest
      test.use({ viewport, reducedMotion: 'reduce' });

      test(`${route} shows its title and both of its buttons without scrolling`, async ({
        page,
      }) => {
        await openHomePage({ page, route });
        const screenBox = getScreenBox(page.viewportSize());
        const buttons = page.locator(PAGE_SELECTOR).getByRole('link');
        await expect(buttons).toHaveCount(HERO_BUTTON_COUNT);

        const title = page.getByRole('heading', { level: 1 });
        expect(
          isBoxInside({ box: await title.boundingBox(), container: screenBox }),
          `title inside the ${viewport.width} × ${viewport.height} px screen`,
        ).toBe(true);
        for (const button of await buttons.all()) {
          expect(
            isBoxInside({ box: await button.boundingBox(), container: screenBox }),
            `"${await button.textContent()}" inside the ${viewport.width} × ${viewport.height} px screen`,
          ).toBe(true);
        }
      });
    });
  }
}
