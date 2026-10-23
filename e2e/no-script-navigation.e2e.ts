import { expect, type Locator, type Page, test } from '@playwright/test';

import { CLOSED_MENU_FRAGMENT } from '../src/App/Header/BurgerMenu/constants.ts';
import { MOBILE_MENU_ID } from '../src/App/Header/constants.ts';
import { LANGUAGE_NAMES } from '../src/App/Header/LangToggle/constants.ts';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import type { Language, Translations } from '../src/i18n/types.ts';
import { localizePath } from '../src/i18n/utils.ts';
import {
  getPage,
  HOME_PAGE,
  NOT_FOUND_PATH,
  PAGES,
  type Page as SitePage,
} from '../src/utils/pages.ts';
import {
  LONG_PAGE_ROUTE,
  MENU_OPENING_SCROLL_Y_PX,
  NO_SCRIPT_SCREENS,
  PAGE_HEADINGS,
} from './constants.ts';
import { getPageScrollY } from './scroll.ts';

/** Translations of each language, to find the links of the header by their names. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Name of the link of the navigation to each page, by the folder of the page. */
const NAVIGATION_LINK_NAMES: Record<SitePage['folder'], (translations: Translations) => string> = {
  Home: ({ nav }) => nav.home,
  Projects: ({ nav }) => nav.projects,
  Experiences: ({ nav }) => nav.experience,
};

/** A page that a link of the header leads to, and how to find that link. */
interface Destination {
  /** Name of the link, which names the step of the test. */
  name: string;
  /** Finds the link in the page of the test. */
  getLink: (page: Page) => Locator;
  /** Path of the URL that the link leads to. */
  path: string;
  /** Text of the `h1` of the page that the link leads to. */
  heading: string;
}

/** Parameters of {@link getDestinations}. */
interface GetDestinationsParams {
  /** Route of the page that the test opens. */
  route: string;
  /** Language of that page. */
  language: Language;
}

/**
 * Lists what the header of a page leads to: every page of the navigation, in the language of the
 * page, then the same page in the other language. The not found page, which the build renders
 * once for every path of no page, leads to the home of the other language.
 */
const getDestinations = ({ route, language }: GetDestinationsParams): Destination[] => {
  const translations = TRANSLATIONS[language];
  const otherLanguage = LANGUAGES.find(other => other !== language) ?? DEFAULT_LANGUAGE;
  const otherLanguagePage = getPage(route) ?? HOME_PAGE;
  const navigationPages = PAGES.map(sitePage => {
    const name = NAVIGATION_LINK_NAMES[sitePage.folder](translations);
    return {
      name,
      getLink: (page: Page) =>
        page.getByRole('navigation').getByRole('link', { name, exact: true }),
      path: localizePath({ path: sitePage.path, language }),
      heading: PAGE_HEADINGS[sitePage.folder](translations),
    };
  });
  return [
    ...navigationPages,
    {
      name: LANGUAGE_NAMES[otherLanguage],
      getLink: (page: Page) =>
        page
          .getByRole('group', { name: translations.langToggle.label })
          .getByRole('link', { name: LANGUAGE_NAMES[otherLanguage] }),
      path: localizePath({ path: otherLanguagePage.path, language: otherLanguage }),
      heading: PAGE_HEADINGS[otherLanguagePage.folder](TRANSLATIONS[otherLanguage]),
    },
  ];
};

/** Parameters of {@link openMenu}. */
interface OpenMenuParams {
  /** Page of the test, opened on a route of the mobile layout. */
  page: Page;
  /** Texts of the language of the page. */
  translations: Translations;
}

/**
 * Opens the mobile menu with the link that stands for the burger button without JavaScript.
 *
 * @returns The navigation of the menu.
 */
const openMenu = async ({ page, translations }: OpenMenuParams): Promise<Locator> => {
  await page.getByRole('link', { name: translations.burgerMenu.open }).click();
  const navigation = page.getByRole('navigation');
  await expect(navigation).toBeVisible();
  return navigation;
};

// A visitor who turned JavaScript off, or whose browser failed to load the scripts, gets the pages
// that the build rendered, with no router and no burger button that works
test.use({ javaScriptEnabled: false });

for (const { width, height, isMobileLayout } of NO_SCRIPT_SCREENS) {
  test.describe(`with JavaScript off, on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height } });

    for (const language of LANGUAGES) {
      const translations = TRANSLATIONS[language];
      // The not found page at the path of its file: vite preview serves it there only
      const routes = [...PAGES, { path: NOT_FOUND_PATH }].map(({ path }) =>
        localizePath({ path, language }),
      );

      for (const route of routes) {
        test(`${route} leads to every page of the navigation and to the other language`, async ({
          page,
        }) => {
          for (const destination of getDestinations({ route, language })) {
            await test.step(destination.name, async () => {
              await page.goto(route);
              if (isMobileLayout) await openMenu({ page, translations });

              // A click fails when the link is hidden or covered
              await destination.getLink(page).click();

              await page.waitForURL(url => url.pathname === destination.path && url.hash === '');
              await expect(page.getByRole('heading', { level: 1 })).toContainText(
                destination.heading,
              );
            });
          }
        });
      }
    }

    if (isMobileLayout) {
      test('the cross closes the menu that the burger opened, and leaves the page where it was', async ({
        page,
      }) => {
        await page.goto(LONG_PAGE_ROUTE);
        // Playwright turns no mouse wheel in mobile WebKit, so the test scrolls the page itself
        await page.evaluate(top => window.scrollTo(0, top), MENU_OPENING_SCROLL_Y_PX);
        await expect.poll(() => page.evaluate(getPageScrollY)).toBe(MENU_OPENING_SCROLL_Y_PX);
        const openLink = page.getByRole('link', { name: fr.burgerMenu.open });
        const closeLink = page.getByRole('link', { name: fr.burgerMenu.close });
        await expect(closeLink).toBeHidden();

        const navigation = await openMenu({ page, translations: fr });
        await expect(page).toHaveURL(new RegExp(`#${MOBILE_MENU_ID}$`));
        await expect(openLink).toBeHidden();
        await closeLink.click();

        await expect(navigation).toBeHidden();
        await expect(page).toHaveURL(new RegExp(`${CLOSED_MENU_FRAGMENT}$`));
        await expect(openLink).toBeVisible();
        expect(await page.evaluate(getPageScrollY)).toBe(MENU_OPENING_SCROLL_Y_PX);
      });
    } else {
      test('shows no link of the burger, whose navigation is a bar of the header', async ({
        page,
      }) => {
        await page.goto(LONG_PAGE_ROUTE);

        await expect(page.getByRole('navigation')).toBeVisible();
        await expect(page.getByRole('link', { name: fr.burgerMenu.open })).toBeHidden();
        await expect(page.getByRole('link', { name: fr.burgerMenu.close })).toBeHidden();
      });
    }
  });
}
