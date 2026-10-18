import { expect, test } from '@playwright/test';

import { fr } from '../src/i18n/fr';
import { waitForEndingAnimations } from './animations';
import {
  CV_FILE_NAME,
  FLOATING_CONTROLS_SCREEN_WIDTHS_PX,
  LONG_PAGE_ROUTE,
  MAX_ICON_OFFSET_PX,
  MOBILE_SCREEN_WIDTHS_PX,
  SCREEN_HEIGHT_PX,
} from './constants';
import { getBoxBottom, getBoxCenterDistanceX } from './utils';

/** Scrolls the page to its end. Runs in the browser. */
const scrollToEnd = () => window.scrollTo(0, document.documentElement.scrollHeight);

// jsdom computes no layout, so only a real browser sees the CV button or the GitHub icon off the
// center of the control they sit under. The app opens in French, the default language.
for (const width of FLOATING_CONTROLS_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    test('the CV button then the GitHub icon sit centered under the language toggle, even while the page scrolls', async ({
      page,
    }) => {
      await page.goto(LONG_PAGE_ROUTE);
      const toggle = page.getByRole('group', { name: fr.langToggle.label });
      // Only the floating links are shown from tablet up: those of the mobile menu are hidden, so
      // the header shows no other CV button
      const cvLink = page.getByRole('link', { name: fr.cvLink.label });
      const gitHubLink = page.getByRole('link', { name: fr.githubLink.label });
      await expect(cvLink).toHaveCount(1);
      await expect(cvLink).toBeVisible();
      await expect(gitHubLink).toBeVisible();

      const toggleBox = await toggle.boundingBox();
      const cvBox = await cvLink.boundingBox();
      const gitHubBox = await gitHubLink.boundingBox();
      expect(
        getBoxCenterDistanceX({ box: cvBox, referenceBox: toggleBox }),
        'distance in px from the center of the CV button to the center of the language toggle',
      ).toBeLessThanOrEqual(MAX_ICON_OFFSET_PX);
      expect(
        getBoxCenterDistanceX({ box: gitHubBox, referenceBox: toggleBox }),
        'distance in px from the center of the GitHub icon to the center of the language toggle',
      ).toBeLessThanOrEqual(MAX_ICON_OFFSET_PX);
      expect(cvBox?.y, 'top of the CV button, under the language toggle').toBeGreaterThan(
        getBoxBottom(toggleBox),
      );
      expect(gitHubBox?.y, 'top of the GitHub icon, under the CV button').toBeGreaterThan(
        getBoxBottom(cvBox),
      );
      expect(cvBox?.width, 'width of the round CV button').toBe(cvBox?.height);

      await page.evaluate(scrollToEnd);
      expect(await toggle.boundingBox(), 'language toggle once the page is scrolled').toEqual(
        toggleBox,
      );
      expect(await cvLink.boundingBox(), 'CV button once the page is scrolled').toEqual(cvBox);
      expect(await gitHubLink.boundingBox(), 'GitHub icon once the page is scrolled').toEqual(
        gitHubBox,
      );
    });

    test('the floating CV button downloads the CV', async ({ page }) => {
      await page.goto(LONG_PAGE_ROUTE);

      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('link', { name: fr.cvLink.label }).click();
      const download = await downloadEvent;

      expect(download.suggestedFilename(), 'name of the downloaded file').toBe(CV_FILE_NAME);
      expect(await download.failure(), 'error of the download').toBeNull();
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
      await page.getByRole('navigation').evaluate(waitForEndingAnimations);

      const cvBox = await page.getByRole('link', { name: fr.cvLink.label }).boundingBox();
      const gitHubBox = await gitHubLink.boundingBox();
      expect(
        getBoxCenterDistanceX({ box: gitHubBox, referenceBox: cvBox }),
        'distance in px from the center of the GitHub icon to the center of the CV button',
      ).toBeLessThanOrEqual(MAX_ICON_OFFSET_PX);
      expect(gitHubBox?.y, 'top of the GitHub icon, under the CV button').toBeGreaterThan(
        getBoxBottom(cvBox),
      );
    });
  });
}
