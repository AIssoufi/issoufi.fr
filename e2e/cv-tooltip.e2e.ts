import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { localizePath } from '../src/i18n/utils';
import { getBrowserAccessibleText } from './accessibility';
import { waitForEndingAnimations } from './animations';
import {
  FLOATING_CONTROLS_SCREEN_WIDTHS_PX,
  LONG_PAGE_ROUTE,
  MAX_TOOLTIP_OFFSET_PX,
  MOBILE_SCREEN_WIDTHS_PX,
  SCREEN_HEIGHT_PX,
  TOOLTIP_GAP_PX,
} from './constants';
import {
  getBoxBottom,
  getBoxCenterDistanceX,
  getBoxCenterDistanceY,
  getBoxRight,
  isBoxInside,
  type ScreenBox,
} from './utils';

/** Translations of each language, to find the CV button and its tooltip by their texts. */
const TRANSLATIONS = { fr, en };

/** Box of the whole screen of a page, to check that a tooltip shows whole on it. */
const getScreenBox = (page: Page): ScreenBox | null => {
  const viewport = page.viewportSize();
  return viewport && { x: 0, y: 0, ...viewport };
};

// jsdom computes no layout, so only a real browser sees a tooltip cut by the edge of the screen,
// or covering the button it describes
for (const language of LANGUAGES) {
  const translations = TRANSLATIONS[language];
  const route = localizePath({ path: LONG_PAGE_ROUTE, language });

  for (const width of FLOATING_CONTROLS_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('hovering the floating CV button shows its tooltip whole on its left', async ({
        page,
      }) => {
        await page.goto(route);
        const cvLink = page.getByRole('link', { name: translations.cvLink.label });
        // Only the shown tooltips count: the one of the hidden mobile menu never shows
        const tooltip = page.getByRole('tooltip');
        await expect(tooltip).toHaveCount(0);
        // Measured before the hover, which grows the button but not the room left for the tooltip
        const cvBox = await cvLink.boundingBox();

        await cvLink.hover();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText(translations.cvLink.label);
        await tooltip.evaluate(waitForEndingAnimations);

        const tooltipBox = await tooltip.boundingBox();
        expect(
          isBoxInside({ box: tooltipBox, container: getScreenBox(page) }),
          `box of the tooltip, whole on the screen: ${JSON.stringify(tooltipBox)}`,
        ).toBe(true);
        const gapPx = (cvBox?.x ?? Number.NaN) - getBoxRight(tooltipBox);
        expect(
          Math.abs(gapPx - TOOLTIP_GAP_PX),
          `difference in px between the tooltip gap and the ${gapPx} px from the tooltip to the CV button`,
        ).toBeLessThanOrEqual(MAX_TOOLTIP_OFFSET_PX);
        expect(
          getBoxCenterDistanceY({ box: tooltipBox, referenceBox: cvBox }),
          'distance in px from the middle of the tooltip to the middle of the CV button',
        ).toBeLessThanOrEqual(MAX_TOOLTIP_OFFSET_PX);

        // The pointer can move onto the tooltip, to read it magnified, without closing it
        await tooltip.hover();
        await expect(tooltip).toBeVisible();

        await page.mouse.move(0, 0);
        await expect(tooltip).toHaveCount(0);
      });

      test('the keyboard shows the tooltip of the floating CV button, and Escape hides it', async ({
        page,
      }) => {
        await page.goto(route);
        const cvLink = page.getByRole('link', { name: translations.cvLink.label });
        const tooltip = page.getByRole('tooltip');
        // The CV button follows the language toggle in the order of the page
        await page
          .getByRole('group', { name: translations.langToggle.label })
          .getByRole('button')
          .last()
          .focus();

        await page.keyboard.press('Tab');
        await expect(cvLink).toBeFocused();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText(translations.cvLink.label);

        await page.keyboard.press('Escape');
        await expect(tooltip).toHaveCount(0);
        await expect(cvLink).toBeFocused();
      });

      test('Chrome names the floating CV button after its tooltip once, even while hidden', async ({
        page,
      }) => {
        await page.goto(route);
        const cvLink = page.getByRole('link', { name: translations.cvLink.label });
        const tooltipId = await cvLink.getAttribute('aria-labelledby');
        expect(tooltipId, 'id of the tooltip that names the CV button').toBeTruthy();
        // Playwright computes names with its own code: the accessibility tree of Chrome is what
        // screen readers read
        const session = await page.context().newCDPSession(page);
        const selector = `[aria-labelledby="${tooltipId}"]`;
        const nameOnly = { name: translations.cvLink.label, description: '' };

        await expect(page.getByRole('tooltip')).toHaveCount(0);
        expect(
          await getBrowserAccessibleText({ session, selector }),
          'name and description of the CV button in Chrome, while its tooltip is hidden',
        ).toEqual(nameOnly);

        await cvLink.hover();
        await expect(page.getByRole('tooltip')).toBeVisible();
        expect(
          await getBrowserAccessibleText({ session, selector }),
          'name and description of the CV button in Chrome, while its tooltip shows',
        ).toEqual(nameOnly);
      });
    });
  }

  for (const width of MOBILE_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('the keyboard shows the tooltip of the CV button of the mobile menu whole above it, until Escape', async ({
        page,
      }) => {
        await page.goto(route);
        await page.getByRole('button', { name: translations.burgerMenu.open }).click();
        const navigation = page.getByRole('navigation');
        // The links of the menu slide in: measure them once they have stopped
        await navigation.evaluate(waitForEndingAnimations);
        const lastLink = page.getByRole('link', {
          name: translations.nav.experience,
          exact: true,
        });
        const cvLink = page.getByRole('link', { name: translations.cvLink.label });
        const tooltip = page.getByRole('tooltip');

        // The CV button follows the last link of the menu in the order of the page
        await lastLink.focus();
        await page.keyboard.press('Tab');
        await expect(cvLink).toBeFocused();
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toHaveText(translations.cvLink.label);
        await tooltip.evaluate(waitForEndingAnimations);

        const cvBox = await cvLink.boundingBox();
        const tooltipBox = await tooltip.boundingBox();
        const lastLinkBox = await lastLink.boundingBox();
        expect(
          isBoxInside({ box: tooltipBox, container: getScreenBox(page) }),
          `box of the tooltip, whole on the screen: ${JSON.stringify(tooltipBox)}`,
        ).toBe(true);
        const gapPx = (cvBox?.y ?? Number.NaN) - getBoxBottom(tooltipBox);
        expect(
          Math.abs(gapPx - TOOLTIP_GAP_PX),
          `difference in px between the tooltip gap and the ${gapPx} px from the tooltip to the CV button`,
        ).toBeLessThanOrEqual(MAX_TOOLTIP_OFFSET_PX);
        expect(
          tooltipBox?.y,
          'top of the tooltip, under the last link of the menu, which it does not cover',
        ).toBeGreaterThanOrEqual(getBoxBottom(lastLinkBox));
        expect(
          getBoxCenterDistanceX({ box: tooltipBox, referenceBox: cvBox }),
          'distance in px from the center of the tooltip to the center of the CV button',
        ).toBeLessThanOrEqual(MAX_TOOLTIP_OFFSET_PX);

        // A first Escape closes the tooltip only, leaving the focus on the CV button
        await page.keyboard.press('Escape');
        await expect(tooltip).toHaveCount(0);
        await expect(cvLink).toBeFocused();
        await expect(navigation).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(navigation).toBeHidden();
      });
    });
  }
}
