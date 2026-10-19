import { expect, test } from '@playwright/test';

import { LANGUAGE_NAMES } from '../src/App/Header/LangToggle/constants.ts';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../src/i18n/constants.ts';
import { fr } from '../src/i18n/fr.ts';
import type { Language } from '../src/i18n/types.ts';
import {
  FORCED_COLORS_SCHEMES,
  FORCED_COLORS_SCREEN_WIDTHS_PX,
  MOBILE_SCREEN_WIDTHS_PX,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
} from './constants.ts';

/** A language of the site other than the default one, whose button the toggle test presses. */
const OTHER_LANGUAGE: Language =
  LANGUAGES.find(language => language !== DEFAULT_LANGUAGE) ?? DEFAULT_LANGUAGE;

/** Start of the French name of each like button, before the name of its project. */
const LIKE_NAME_START = fr.projects.like.split('{{name}}')[0];

/** Name of the like buttons of the Projects page in French, whatever their project. */
const LIKE_BUTTON_NAME = new RegExp(`^${LIKE_NAME_START}`);

// Forced colors mode, such as a contrast theme of Windows, removes the backgrounds and the shadows
// and draws the texts in the colors of its palette: a state that only a background shows vanishes,
// and so does an icon drawn in a color of its own, which that mode keeps. Each test of a state
// takes the same element at the same place in both states, which must look different.
// With reduced motion, a state shows at once in its final look
test.use({ forcedColors: 'active', reducedMotion: 'reduce' });

for (const width of FORCED_COLORS_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen, in forced colors mode`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    test('the active language looks different from the other one', async ({ page }) => {
      await page.goto(PROJECTS_ROUTE);
      const defaultLanguageButton = page.getByRole('button', {
        name: LANGUAGE_NAMES[DEFAULT_LANGUAGE],
      });
      await expect(defaultLanguageButton).toHaveAttribute('aria-pressed', 'true');
      const activeImage = await defaultLanguageButton.screenshot();

      await page.getByRole('button', { name: LANGUAGE_NAMES[OTHER_LANGUAGE] }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', OTHER_LANGUAGE);
      await expect(defaultLanguageButton).toHaveAttribute('aria-pressed', 'false');
      // Away from the toggle, whose hover would change its look too
      await page.mouse.move(0, 0);
      const inactiveImage = await defaultLanguageButton.screenshot();

      expect(
        activeImage.equals(inactiveImage),
        'the default language button, active then inactive',
      ).toBe(false);
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

    const hasMobileMenu = (MOBILE_SCREEN_WIDTHS_PX as readonly number[]).includes(width);

    // A light contrast theme gives the page and the buttons a light background, on which an icon
    // drawn in the white of the site vanishes
    for (const colorScheme of FORCED_COLORS_SCHEMES) {
      test.describe(`with a ${colorScheme} contrast theme`, () => {
        test.use({ colorScheme });

        // The CV link shows its download icon in the mobile menu only
        if (hasMobileMenu) {
          test('the icon of the CV link takes the color of the text of the link', async ({
            page,
          }) => {
            await page.goto(PROJECTS_ROUTE);
            await page.getByRole('button', { name: fr.burgerMenu.open }).click();
            const cvLink = page.getByRole('navigation').getByRole('link', { name: fr.cvLink.text });
            await expect(cvLink.locator('svg')).toBeVisible();
            const linkColor = await cvLink.evaluate(element => getComputedStyle(element).color);

            const iconPaths = await cvLink.locator('path').all();
            expect(iconPaths).not.toHaveLength(0);
            for (const iconPath of iconPaths) {
              await expect(iconPath).toHaveCSS('stroke', linkColor);
            }
          });
        }
      });
    }
  });
}
