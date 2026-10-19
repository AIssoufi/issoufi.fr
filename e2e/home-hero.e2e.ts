import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import { HOME_PAGE } from '../src/utils/pages';
import { recordLargestShift, waitForEndingAnimations } from './animations';
import {
  HERO_POINTER_SCREENS,
  HERO_SCREENS,
  HERO_WORD_SELECTOR,
  MAX_WORD_SHIFT_PX,
  PAGE_SELECTOR,
  POINTER_REST_FRAME_COUNT,
} from './constants';
import { getButtonAimPoints, getScreenBox, isBoxInside } from './utils';

/** Number of buttons of the home page, the links under its title. */
const HERO_BUTTON_COUNT = 2;

/**
 * Height above the center of a word where the pointer rests to push it, as a share of the height
 * of the word: well within reach, but not on its center, under which no word is pushed.
 */
const WORD_AIM_HEIGHT_RATIO = 0.25;

/** Parameters of {@link openHomePage}. */
interface OpenHomePageParams {
  /** Browser page of the test. */
  page: Page;
  /** Route of the home page in a language, such as `/en/`. */
  route: string;
}

/**
 * Opens the home page and waits for its web fonts, which set the size of its title, and for the
 * end of its entrance, during which the title and the buttons rise 20 px into place.
 */
const openHomePage = async ({ page, route }: OpenHomePageParams) => {
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.locator(PAGE_SELECTOR).evaluate(waitForEndingAnimations);
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

  for (const viewport of HERO_POINTER_SCREENS) {
    test.describe(`in ${language}, with a mouse, on a ${viewport.width} × ${viewport.height} px screen`, () => {
      test.use({ viewport, reducedMotion: 'no-preference' });

      test(`aiming at a button of ${route} moves no word of its title`, async ({ page }) => {
        await openHomePage({ page, route });
        const words = page.getByRole('heading', { level: 1 }).locator(HERO_WORD_SELECTOR);
        const buttons = page.locator(PAGE_SELECTOR).getByRole('link');
        await expect(buttons).toHaveCount(HERO_BUTTON_COUNT);
        // Without any word, the largest shift would be 0, and the check would pass
        expect(await words.count(), 'words of the title').toBeGreaterThan(0);

        for (const button of await buttons.all()) {
          // Moved by the mouse rather than hovered, which would refuse the corners of the pill
          for (const point of getButtonAimPoints(await button.boundingBox())) {
            await page.mouse.move(point.x, point.y);

            const largestShift = await words.evaluateAll(recordLargestShift, {
              frameCount: POINTER_REST_FRAME_COUNT,
            });
            expect(
              largestShift,
              `largest shift of a word, in px, with the pointer at ${point.x}, ${point.y}`,
            ).toBeLessThanOrEqual(MAX_WORD_SHIFT_PX);
          }
        }
      });

      // The check above would pass with words that never move: this one sees them move
      test(`the words of ${route} still move away from the pointer`, async ({ page }) => {
        await openHomePage({ page, route });
        const words = page.getByRole('heading', { level: 1 }).locator(HERO_WORD_SELECTOR);
        const word = await words.first().boundingBox();
        if (!word) throw new Error('The first word of the title has no box');

        await page.mouse.move(
          word.x + word.width / 2,
          word.y + word.height / 2 - word.height * WORD_AIM_HEIGHT_RATIO,
        );

        const largestShift = await words.evaluateAll(recordLargestShift, {
          frameCount: POINTER_REST_FRAME_COUNT,
        });
        expect(largestShift, 'largest shift of a word, in px').toBeGreaterThan(MAX_WORD_SHIFT_PX);
      });
    });
  }
}
