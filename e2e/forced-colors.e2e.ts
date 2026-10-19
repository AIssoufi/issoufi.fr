import { expect, test } from '@playwright/test';

import { LANGUAGE_NAMES } from '../src/App/Header/LangToggle/constants';
import { fr } from '../src/i18n/fr';
import { FORCED_COLORS_SCREEN_WIDTHS_PX, PROJECTS_ROUTE, SCREEN_HEIGHT_PX } from './constants';

/** Start of the French name of each like button, before the name of its project. */
const LIKE_NAME_START = fr.projects.like.split('{{name}}')[0];

/** Name of the like buttons of the Projects page in French, whatever their project. */
const LIKE_BUTTON_NAME = new RegExp(`^${LIKE_NAME_START}`);

// Forced colors mode, such as a contrast theme of Windows, removes the backgrounds and the shadows
// and draws the texts in the colors of its palette: a state that only a background shows vanishes.
// Each test takes the same element at the same place in both states, which must look different.
// With reduced motion, a state shows at once in its final look
test.use({ forcedColors: 'active', reducedMotion: 'reduce' });

for (const width of FORCED_COLORS_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen, in forced colors mode`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    test('the active language looks different from the other one', async ({ page }) => {
      await page.goto(PROJECTS_ROUTE);
      const frenchButton = page.getByRole('button', { name: LANGUAGE_NAMES.fr });
      await expect(frenchButton).toHaveAttribute('aria-pressed', 'true');
      const activeImage = await frenchButton.screenshot();

      await page.getByRole('button', { name: LANGUAGE_NAMES.en }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(frenchButton).toHaveAttribute('aria-pressed', 'false');
      // Away from the toggle, whose hover would change its look too
      await page.mouse.move(0, 0);
      const inactiveImage = await frenchButton.screenshot();

      expect(activeImage.equals(inactiveImage), 'the French button, active then inactive').toBe(
        false,
      );
    });

    test('a liked project looks different from the others', async ({ page }) => {
      await page.goto(PROJECTS_ROUTE);
      const likeButton = page.getByRole('button', { name: LIKE_BUTTON_NAME }).first();
      await expect(likeButton).toHaveAttribute('aria-pressed', 'false');
      const restImage = await likeButton.screenshot();

      await likeButton.click();
      await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
      // Away from the card, whose hover would change the look of the button too, and without the
      // focus that the click gave it
      await page.mouse.move(0, 0);
      await likeButton.blur();
      const likedImage = await likeButton.screenshot();

      expect(restImage.equals(likedImage), 'the like button, at rest then liked').toBe(false);
    });
  });
}
