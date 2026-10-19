import { expect, type Locator, type Page, test } from '@playwright/test';

import { LANGUAGE_NAMES } from '../src/App/Header/LangToggle/constants';
import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Language, Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import { PAGES } from '../src/utils/pages';
import {
  DESKTOP_SCREEN_WIDTHS_PX,
  PAGE_SELECTOR,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
  SCREEN_WIDTHS_PX,
} from './constants';
import { getBoxBottom, getBoxRight, getCheckedRoutes } from './utils';

/** Translations of each language, to find the skip link and the links of the header by name. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/**
 * Tells whether an element is drawn where it stands: the element under the center of its box is
 * the element itself or one of its children, which a clipped element never is.
 */
const isDrawnAtItsCenter = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  const elementAtCenter = document.elementFromPoint(x + width / 2, y + height / 2);
  return element.contains(elementAtCenter);
};

/** Parameters of {@link openPage}. */
interface OpenPageParams {
  /** Page of the test. */
  page: Page;
  /** Route to open, behind the prefix of its language, e.g. `/en/projects`. */
  route: string;
}

/** Opens a route and waits for the heading of its page, which a lazily loaded page shows late. */
const openPage = async ({ page, route }: OpenPageParams) => {
  await page.goto(route);
  await expect(page.locator(`${PAGE_SELECTOR} h1`)).toBeAttached();
};

/** Parameters of {@link expectTabToFocus}. */
interface ExpectTabToFocusParams {
  /** Page of the test. */
  page: Page;
  /** Element that the `Tab` must focus. */
  element: Locator;
}

/** Presses `Tab`, then checks that an element has the focus. */
const expectTabToFocus = async ({ page, element }: ExpectTabToFocusParams) => {
  await page.keyboard.press('Tab');
  await expect(element).toBeFocused();
};

for (const language of LANGUAGES) {
  const translations = TRANSLATIONS[language];

  for (const width of SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`the first Tab on ${route} shows the skip link, whose Enter focuses the heading of the page`, async ({
          page,
        }) => {
          await openPage({ page, route });
          const skipLink = page.getByRole('link', { name: translations.skipLink.text });
          expect(await skipLink.evaluate(isDrawnAtItsCenter), 'skip link before the Tab').toBe(
            false,
          );

          await expectTabToFocus({ page, element: skipLink });
          expect(await skipLink.evaluate(isDrawnAtItsCenter), 'skip link once focused').toBe(true);

          await page.keyboard.press('Enter');
          await expect(page.locator(`${PAGE_SELECTOR} h1`)).toBeFocused();
          expect(new URL(page.url()).hash, 'fragment of the URL').toBe('');
          expect(await skipLink.evaluate(isDrawnAtItsCenter), 'skip link once left').toBe(false);
        });
      }
    });
  }

  for (const width of DESKTOP_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('Tab goes through the header in the order of the screen, then reaches the content', async ({
        page,
      }) => {
        await openPage({ page, route: localizePath({ path: PROJECTS_ROUTE, language }) });
        const header = page.locator('header');
        // A profile icon is named by its label, then the notice that it opens a new tab
        const linkNames = [
          'AI',
          translations.nav.home,
          translations.nav.projects,
          translations.nav.experience,
          `${translations.githubLink.label} ${translations.newTabLink.notice}`,
          `${translations.linkedInLink.label} ${translations.newTabLink.notice}`,
          translations.cvLink.text,
        ];
        const languageToggle = header.getByRole('group', { name: translations.langToggle.label });
        const languageButtons = LANGUAGES.map(buttonLanguage =>
          languageToggle.getByRole('button', { name: LANGUAGE_NAMES[buttonLanguage] }),
        );

        await expectTabToFocus({
          page,
          element: page.getByRole('link', { name: translations.skipLink.text }),
        });
        // The logo, then the links of the bar, from left to right
        for (const name of linkNames) {
          await expectTabToFocus({
            page,
            element: header.getByRole('link', { name, exact: true }),
          });
        }
        // Then the language toggle, which floats under the bar on the right edge of the screen
        for (const element of languageButtons) {
          await expectTabToFocus({ page, element });
        }
        const cvLinkBox = await header
          .getByRole('link', { name: translations.cvLink.text })
          .boundingBox();
        const toggleBox = await languageToggle.boundingBox();
        expect(toggleBox?.y, 'top of the language toggle, under the CV link').toBeGreaterThan(
          getBoxBottom(cvLinkBox),
        );
        expect(
          getBoxRight(toggleBox),
          'right of the language toggle, past the CV link',
        ).toBeGreaterThanOrEqual(getBoxRight(cvLinkBox));

        await page.keyboard.press('Tab');
        await expect(page.locator(`${PAGE_SELECTOR} :focus`)).toBeAttached();
      });
    });
  }
}
