import { expect, test } from '@playwright/test';

import { fr } from '../src/i18n/fr';
import {
  FLOATING_TOGGLE_SCREEN_WIDTHS_PX,
  LONG_PAGE_ROUTE,
  MAX_ICON_OFFSET_PX,
  MOBILE_SCREEN_WIDTHS_PX,
  SCREEN_HEIGHT_PX,
} from './constants';
import { getBoxCenterDistanceX } from './utils';

/** Scrolls the page to its end. Runs in the browser. */
const scrollToEnd = () => window.scrollTo(0, document.documentElement.scrollHeight);

// jsdom computes no layout, so only a real browser sees the GitHub icon off the center of the
// control it sits under. The app opens in French, the default language.
for (const width of FLOATING_TOGGLE_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    test('the GitHub icon sits centered under the language toggle, even while the page scrolls', async ({
      page,
    }) => {
      await page.goto(LONG_PAGE_ROUTE);
      const toggle = page.getByRole('group', { name: fr.langToggle.label });
      // Only the floating icon is shown from tablet up: the one of the mobile menu is hidden
      const gitHubLink = page.getByRole('link', { name: fr.githubLink.label });
      await expect(gitHubLink).toBeVisible();

      const toggleBox = await toggle.boundingBox();
      const gitHubBox = await gitHubLink.boundingBox();
      expect(
        getBoxCenterDistanceX({ box: gitHubBox, referenceBox: toggleBox }),
        'distance in px from the center of the GitHub icon to the center of the language toggle',
      ).toBeLessThanOrEqual(MAX_ICON_OFFSET_PX);
      expect(gitHubBox?.y, 'top of the GitHub icon, under the language toggle').toBeGreaterThan(
        (toggleBox?.y ?? Number.NaN) + (toggleBox?.height ?? Number.NaN),
      );

      await page.evaluate(scrollToEnd);
      expect(await toggle.boundingBox(), 'language toggle once the page is scrolled').toEqual(
        toggleBox,
      );
      expect(await gitHubLink.boundingBox(), 'GitHub icon once the page is scrolled').toEqual(
        gitHubBox,
      );
    });
  });
}

for (const width of MOBILE_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    test('the mobile menu shows the GitHub icon centered under the CV button', async ({ page }) => {
      await page.goto('/');
      const gitHubLink = page.getByRole('link', { name: fr.githubLink.label });
      // Hidden until the menu opens: no icon floats over the page
      await expect(gitHubLink).toHaveCount(0);

      await page.getByRole('button', { name: fr.burgerMenu.open }).click();
      await expect(gitHubLink).toBeVisible();
      // The links of the menu slide in: measure them once they have stopped. The home page has
      // endless animations of its own, so only those of the menu are awaited
      await page
        .getByRole('navigation')
        .evaluate(navigation =>
          Promise.all(navigation.getAnimations({ subtree: true }).map(({ finished }) => finished)),
        );

      const cvBox = await page.getByRole('link', { name: 'CV' }).boundingBox();
      const gitHubBox = await gitHubLink.boundingBox();
      expect(
        getBoxCenterDistanceX({ box: gitHubBox, referenceBox: cvBox }),
        'distance in px from the center of the GitHub icon to the center of the CV button',
      ).toBeLessThanOrEqual(MAX_ICON_OFFSET_PX);
      expect(gitHubBox?.y, 'top of the GitHub icon, under the CV button').toBeGreaterThan(
        (cvBox?.y ?? Number.NaN) + (cvBox?.height ?? Number.NaN),
      );
    });
  });
}
