import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import type { Language } from '../src/i18n/types.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { PAGES } from '../src/utils/pages.ts';
import { waitForEndingAnimations } from './animations.ts';
import {
  CONTROL_SELECTOR,
  NARROW_GUTTER_TABLET_SCREENS,
  PAGE_SELECTOR,
  PROJECTS_ROUTE,
  SITE_HEADER_SELECTOR,
  SKIP_LINK_SELECTOR,
} from './constants.ts';
import { type ControlCover, listControlCovers, type ListControlCoversOptions } from './targets.ts';
import { getBoxCenter, getCheckedRoutes } from './utils.ts';

/** Name of the like buttons of the Projects page in each language, whatever their project. */
const LIKE_BUTTON_NAMES: Record<Language, RegExp> = {
  fr: new RegExp(`^${fr.projects.like.replace('{{name}}', '.+')}$`),
  en: new RegExp(`^${en.projects.like.replace('{{name}}', '.+')}$`),
};

/**
 * Options of the check: the controls of the page but the skip link, and the header, which holds
 * the language toggle wherever it stands. A pixel inside the edges of each control.
 */
const COVER_OPTIONS: ListControlCoversOptions = {
  controlSelector: CONTROL_SELECTOR,
  excludedSelector: SKIP_LINK_SELECTOR,
  overlaySelector: SITE_HEADER_SELECTOR,
  edgeInsetPx: 1,
};

/** Parameters of {@link openPage}. */
interface OpenPageParams {
  /** Page of the test. */
  page: Page;
  /** Route to open, behind the prefix of its language, e.g. `/en/projects`. */
  route: string;
}

/** Opens a route and waits for its page to stand still, which a lazily loaded page does late. */
const openPage = async ({ page, route }: OpenPageParams) => {
  await page.goto(route);
  const main = page.locator(PAGE_SELECTOR);
  await expect(main).toBeVisible();
  await main.evaluate(waitForEndingAnimations);
};

const isCovered = ({ coveredPoints }: ControlCover) => coveredPoints.length > 0;

// A fixed element over the page: only a real browser tells which element a tap reaches
for (const viewport of NARROW_GUTTER_TABLET_SCREENS) {
  test.describe(`on a ${viewport.width} × ${viewport.height} px touch screen`, () => {
    test.use({ viewport, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });

    for (const language of LANGUAGES) {
      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`the header and the language toggle cover no control of ${route}`, async ({
          page,
        }) => {
          await openPage({ page, route });

          const covers = await page.evaluate(listControlCovers, COVER_OPTIONS);

          expect(covers.filter(isCovered), 'controls covered').toEqual([]);
        });
      }

      const projectsRoute = localizePath({ path: PROJECTS_ROUTE, language });

      test(`a tap on each like button of ${projectsRoute} likes its project and keeps the language`, async ({
        page,
      }) => {
        await openPage({ page, route: projectsRoute });
        const likeButtons = await page
          .getByRole('button', { name: LIKE_BUTTON_NAMES[language] })
          .filter({ visible: true })
          .all();

        expect(likeButtons.length, 'like buttons shown').toBeGreaterThan(0);
        for (const likeButton of likeButtons) {
          await likeButton.scrollIntoViewIfNeeded();
          // A tap on the screen, where a locator would refuse a button under the language toggle.
          // Without a box, the coordinates are NaN, which the tap refuses, so the test fails.
          const center = getBoxCenter(await likeButton.boundingBox());
          await page.touchscreen.tap(center?.x ?? Number.NaN, center?.y ?? Number.NaN);

          await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
          await expect(page).toHaveURL(projectsRoute);
        }
      });
    }
  });
}
