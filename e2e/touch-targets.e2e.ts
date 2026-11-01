import { expect, type Page, test } from '@playwright/test';

import { fr } from '../src/i18n/fr.ts';
import { PAGES } from '../src/utils/pages.ts';
import {
  CONTROL_SELECTOR,
  DESKTOP_LAYOUT_TOUCH_SCREENS,
  FINGER_TARGET_SIZE_PX,
  MOBILE_LAYOUT_SCREENS,
  PAGE_SELECTOR,
  SITE_HEADER_SELECTOR,
  SKIP_LINK_SELECTOR,
} from './constants.ts';
import { gotoRoute } from './navigation.ts';
import { type HitArea, measureHitAreas, type MeasureHitAreasOptions } from './targets.ts';
import { getCheckedRoutes } from './utils.ts';

/**
 * Options of the measures: the controls of the page but the skip link, the header over the page,
 * and a reach just past the size of a finger target, which is enough to tell a large one.
 */
const MEASURE_OPTIONS: MeasureHitAreasOptions = {
  controlSelector: CONTROL_SELECTOR,
  excludedSelector: SKIP_LINK_SELECTOR,
  overlaySelector: SITE_HEADER_SELECTOR,
  maxReachPx: FINGER_TARGET_SIZE_PX,
};

/**
 * Measures the controls that the screen shows, once the page is loaded, and checks that each one
 * takes the taps of a finger over a finger target at least, each way.
 */
const expectFingerTargets = async (page: Page) => {
  await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
  const hitAreas = await page.evaluate(measureHitAreas, MEASURE_OPTIONS);
  const isTooSmall = ({ width, height }: HitArea) =>
    width < FINGER_TARGET_SIZE_PX || height < FINGER_TARGET_SIZE_PX;

  expect(hitAreas.length, 'controls measured').toBeGreaterThan(0);
  expect(hitAreas.filter(isTooSmall), 'controls smaller than a finger target').toEqual([]);
};

// The areas grow past the controls, through pseudo-elements: only a real browser lays them out
// and tells which element a tap reaches
const touchScreens = [
  ...MOBILE_LAYOUT_SCREENS.map(viewport => ({ viewport, hasMobileMenu: true })),
  ...DESKTOP_LAYOUT_TOUCH_SCREENS.map(viewport => ({ viewport, hasMobileMenu: false })),
];

for (const { viewport, hasMobileMenu } of touchScreens) {
  test.describe(`on a ${viewport.width} × ${viewport.height} px touch screen`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });

    for (const route of getCheckedRoutes({ pages: PAGES })) {
      test(`every control of ${route} takes the taps of a finger over ${FINGER_TARGET_SIZE_PX} × ${FINGER_TARGET_SIZE_PX} px at least`, async ({
        page,
      }) => {
        await gotoRoute({ page, route });

        await expectFingerTargets(page);
      });
    }

    if (!hasMobileMenu) return;

    test('every control of the open mobile menu takes the taps of a finger as well', async ({
      page,
    }) => {
      await gotoRoute({ page, route: '/' });
      await page.getByRole('button', { name: fr.burgerMenu.open }).tap();
      await expect(page.getByRole('navigation')).toBeVisible();

      await expectFingerTargets(page);
    });
  });
}
