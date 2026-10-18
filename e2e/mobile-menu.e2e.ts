import { expect, type Locator, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import { waitForEndingAnimations } from './animations';
import { LANDSCAPE_PHONE_SCREENS, LONG_PAGE_ROUTE, SHORTER_THAN_MENU_SCREEN } from './constants';
import { scrollDownWithGesture } from './gestures';
import { getScreenBox, isBoxInside } from './utils';

/** Translations of each language, to find the burger button and the links of the menu. */
const TRANSLATIONS = { fr, en };

/** Parameters of {@link openMenu}. */
interface OpenMenuParams {
  /** Page of the test, opened on a route of the mobile layout. */
  page: Page;
  /** Texts of the language of the page. */
  translations: Translations;
}

/**
 * Opens the mobile menu with the burger button, then waits for its links to finish sliding in, so
 * that they are measured where they stop.
 *
 * @returns The navigation of the menu.
 */
const openMenu = async ({ page, translations }: OpenMenuParams): Promise<Locator> => {
  await page.getByRole('button', { name: translations.burgerMenu.open }).click();
  const navigation = page.getByRole('navigation');
  await expect(navigation).toBeVisible();
  await navigation.evaluate(waitForEndingAnimations);
  return navigation;
};

/** Parameters of {@link getMenuLinks}. */
interface GetMenuLinksParams {
  /** Navigation of the open menu. */
  navigation: Locator;
  /** Texts of the language of the page. */
  translations: Translations;
}

/** Every link of the open menu, in its order: the pages, the CV button and the GitHub icon. */
const getMenuLinks = ({ navigation, translations }: GetMenuLinksParams) =>
  [
    translations.nav.home,
    translations.nav.projects,
    translations.nav.experience,
    translations.cvLink.label,
    translations.githubLink.label,
  ].map(name => ({ name, link: navigation.getByRole('link', { name, exact: true }) }));

/** Tells whether an element holds more than it shows, so it scrolls. Runs in the browser. */
const isScrollable = (element: Element) => element.scrollHeight > element.clientHeight;

/** Scroll position of the page, in pixels. Runs in the browser. */
const getPageScrollY = () => window.scrollY;

/** Point at the middle of the screen of a page, where the open menu covers the page. */
const getScreenCenter = (page: Page) => {
  const { width = 0, height = 0 } = page.viewportSize() ?? {};
  return { x: width / 2, y: height / 2 };
};

// jsdom computes no layout and scrolls nothing, so only a real browser sees a link of the menu
// out of the screen, or the menu not scrolling
for (const language of LANGUAGES) {
  const translations = TRANSLATIONS[language];
  const route = localizePath({ path: LONG_PAGE_ROUTE, language });

  for (const viewport of LANDSCAPE_PHONE_SCREENS) {
    test.describe(`in ${language}, on a ${viewport.width} × ${viewport.height} px screen`, () => {
      test.use({ viewport });

      test('the open mobile menu shows each of its links whole, without scrolling', async ({
        page,
      }) => {
        await page.goto(route);
        const navigation = await openMenu({ page, translations });

        for (const { name, link } of getMenuLinks({ navigation, translations })) {
          const box = await link.boundingBox();
          expect(
            isBoxInside({ box, container: getScreenBox(page.viewportSize()) }),
            `box of "${name}", whole on the screen: ${JSON.stringify(box)}`,
          ).toBe(true);
        }
        expect(await navigation.evaluate(isScrollable), 'menu higher than the screen').toBe(false);
      });
    });
  }

  test.describe(`in ${language}, on a screen lower than the menu`, () => {
    test.use({ viewport: SHORTER_THAN_MENU_SCREEN });

    test('the open mobile menu scrolls to show each of its links whole, but not the page', async ({
      page,
    }) => {
      await page.goto(route);
      const navigation = await openMenu({ page, translations });
      expect(await navigation.evaluate(isScrollable), 'menu higher than the screen').toBe(true);

      // From the top of the menu, in order: centered content cut above the screen fails here
      for (const { name, link } of getMenuLinks({ navigation, translations })) {
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        expect(
          isBoxInside({ box, container: getScreenBox(page.viewportSize()) }),
          `box of "${name}" once scrolled to, whole on the screen: ${JSON.stringify(box)}`,
        ).toBe(true);
      }

      await navigation.evaluate(element => element.scrollTo(0, 0));
      const session = await page.context().newCDPSession(page);
      await scrollDownWithGesture({ session, ...getScreenCenter(page), source: 'mouse' });
      expect(
        await navigation.evaluate(element => element.scrollTop),
        'scroll position of the menu after a wheel scroll over it',
      ).toBeGreaterThan(0);
      expect(await page.evaluate(getPageScrollY), 'scroll position of the page behind it').toBe(0);
    });
  });
}
