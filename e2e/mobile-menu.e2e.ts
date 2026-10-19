import { expect, type Locator, type Page, test } from '@playwright/test';

import { LANGUAGE_NAMES } from '../src/App/Header/LangToggle/constants';
import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import { waitForEndingAnimations } from './animations';
import {
  FINGER_TARGET_SIZE_PX,
  LANDSCAPE_PHONE_SCREENS,
  LONG_PAGE_ROUTE,
  MENU_OPENING_SCROLL_Y_PX,
  MIN_TARGET_SIZE_PX,
  MOBILE_LAYOUT_SCREENS,
  PAGE_SELECTOR,
  SHORTER_THAN_MENU_SCREEN,
} from './constants';
import { scrollDownWithGesture, type ScrollGestureSource } from './gestures';
import { getPageScrollY } from './scroll';
import { doBoxesOverlapHorizontally, getScreenBox, getScreenCenter, isBoxInside } from './utils';

/** Translations of each language, to find the burger button and the links of the menu. */
const TRANSLATIONS = { fr, en };

/** Devices that scroll the page under the menu: the wheel of a mouse and a finger. */
const SCROLL_GESTURE_SOURCES: readonly ScrollGestureSource[] = ['mouse', 'touch'];

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

/**
 * Every link of the open menu, in its order: the pages, the GitHub and LinkedIn icons, named with
 * the notice that they open a new tab, then the CV link.
 */
const getMenuLinks = ({ navigation, translations }: GetMenuLinksParams) =>
  [
    translations.nav.home,
    translations.nav.projects,
    translations.nav.experience,
    `${translations.githubLink.label} ${translations.newTabLink.notice}`,
    `${translations.linkedInLink.label} ${translations.newTabLink.notice}`,
    translations.cvLink.text,
  ].map(name => ({ name, link: navigation.getByRole('link', { name, exact: true }) }));

/** Parameters of {@link expectLinksBesideToggle}. */
interface ExpectLinksBesideToggleParams extends GetMenuLinksParams {
  /** Page of the test, with the menu open. */
  page: Page;
}

/**
 * Checks that no link of the open menu shares some width with the language toggle, which stays
 * above the menu: the toggle then covers none of them, wherever the menu is scrolled.
 */
const expectLinksBesideToggle = async ({
  page,
  navigation,
  translations,
}: ExpectLinksBesideToggleParams) => {
  const toggleBox = await page
    .getByRole('group', { name: translations.langToggle.label })
    .boundingBox();
  expect(toggleBox, 'box of the language toggle').not.toBeNull();
  for (const { name, link } of getMenuLinks({ navigation, translations })) {
    const box = await link.boundingBox();
    expect(
      doBoxesOverlapHorizontally({ box, otherBox: toggleBox }),
      `"${name}" in the column of the language toggle: ${JSON.stringify(box)}`,
    ).toBe(false);
  }
};

/** Tells whether an element holds more than it shows, so it scrolls. Runs in the browser. */
const isScrollable = (element: Element) => element.scrollHeight > element.clientHeight;

/**
 * Point where the scroll gestures over the open menu start: the middle of the screen, which the
 * menu covers. Without a screen size, its coordinates are `NaN`, which `scrollDownWithGesture`
 * refuses, so the test fails rather than scroll elsewhere.
 */
const getGesturePoint = (page: Page) =>
  getScreenCenter(page.viewportSize()) ?? { x: Number.NaN, y: Number.NaN };

// jsdom computes no layout and scrolls nothing, so only a real browser sees a link of the menu
// out of the screen, or the page moving behind the menu
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
          expect(box?.height, `height of "${name}", big enough to tap`).toBeGreaterThanOrEqual(
            MIN_TARGET_SIZE_PX,
          );
        }
        const cvBox = await navigation
          .getByRole('link', { name: translations.cvLink.text })
          .boundingBox();
        expect(cvBox?.height, 'height of the CV link, compact or not').toBeGreaterThanOrEqual(
          FINGER_TARGET_SIZE_PX,
        );
        expect(await navigation.evaluate(isScrollable), 'menu higher than the screen').toBe(false);
        await expectLinksBesideToggle({ page, navigation, translations });
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
      await expectLinksBesideToggle({ page, navigation, translations });

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
      await scrollDownWithGesture({ session, ...getGesturePoint(page), source: 'mouse' });
      expect(
        await navigation.evaluate(element => element.scrollTop),
        'scroll position of the menu after a wheel scroll over it',
      ).toBeGreaterThan(0);
      expect(await page.evaluate(getPageScrollY), 'scroll position of the page behind it').toBe(0);
    });
  });
}

for (const viewport of MOBILE_LAYOUT_SCREENS) {
  test.describe(`on a ${viewport.width} × ${viewport.height} px touch screen`, () => {
    test.use({ viewport, hasTouch: true });

    test('the page behind the open mobile menu stays still, and scrolls again from there once it closes', async ({
      page,
    }) => {
      await page.goto(LONG_PAGE_ROUTE);
      await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
      await page.evaluate(top => window.scrollTo(0, top), MENU_OPENING_SCROLL_Y_PX);
      expect(await page.evaluate(getPageScrollY), 'scroll position before the menu opens').toBe(
        MENU_OPENING_SCROLL_Y_PX,
      );
      const session = await page.context().newCDPSession(page);
      const center = getGesturePoint(page);

      const navigation = await openMenu({ page, translations: fr });
      for (const source of SCROLL_GESTURE_SOURCES) {
        await scrollDownWithGesture({ session, ...center, source });
        expect(
          await page.evaluate(getPageScrollY),
          `scroll position of the page after a ${source} scroll over the open menu`,
        ).toBe(MENU_OPENING_SCROLL_Y_PX);
      }

      await page.getByRole('button', { name: fr.burgerMenu.close }).click();
      await expect(navigation).toBeHidden();
      expect(await page.evaluate(getPageScrollY), 'scroll position once the menu closes').toBe(
        MENU_OPENING_SCROLL_Y_PX,
      );

      // Chrome may drop a wheel scroll that starts before it has drawn the page unlocked
      await expect(async () => {
        await scrollDownWithGesture({ session, ...center, source: 'mouse' });
        expect(
          await page.evaluate(getPageScrollY),
          'scroll position after a wheel scroll once the menu is closed',
        ).toBeGreaterThan(MENU_OPENING_SCROLL_Y_PX);
      }).toPass();
    });

    test('the language toggle stays usable over the open mobile menu, with Tab and a tap', async ({
      page,
    }) => {
      await page.goto(LONG_PAGE_ROUTE);
      const burgerBox = await page.getByRole('button', { name: fr.burgerMenu.open }).boundingBox();
      const navigation = await openMenu({ page, translations: fr });
      const burger = page.getByRole('button', { name: fr.burgerMenu.close });
      expect(await burger.boundingBox(), 'box of the burger once the menu is open').toEqual(
        burgerBox,
      );

      // Named after its language whatever the language of the page. The toggle follows the
      // navigation in the page, so Tab reaches it after the CV link, the last link of the menu
      const languageToggle = page.getByRole('group', { name: fr.langToggle.label });
      const englishButton = languageToggle.getByRole('button', { name: LANGUAGE_NAMES.en });
      await navigation.getByRole('link', { name: fr.cvLink.text }).focus();
      await page.keyboard.press('Tab');
      await expect(languageToggle.getByRole('button', { name: LANGUAGE_NAMES.fr })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(englishButton).toBeFocused();

      // A tap fails when something covers the button, as the menu did
      await englishButton.tap();
      await expect(page).toHaveURL(localizePath({ path: LONG_PAGE_ROUTE, language: 'en' }));
      await expect(navigation, 'menu once the language changed').toBeVisible();
    });
  });
}
