import { type BrowserContext, expect, type Locator, type Page, test } from '@playwright/test';

import {
  GITHUB_PROFILE_URL,
  LINKEDIN_PROFILE_URL,
} from '../src/App/Header/NavMenu/ProfileLinks/constants';
import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Language, Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import { waitForEndingAnimations } from './animations';
import {
  CV_FILE_NAMES,
  DESKTOP_SCREEN_WIDTHS_PX,
  LONG_PAGE_ROUTE,
  MAX_ALIGNMENT_OFFSET_PX,
  MOBILE_SCREEN_WIDTHS_PX,
  SCREEN_HEIGHT_PX,
} from './constants';
import {
  getBoxBottom,
  getBoxCenterDistanceX,
  getBoxCenterDistanceY,
  getBoxRight,
  getScreenBox,
  isBoxInside,
  type ScreenBox,
} from './utils';

/** Translations of each language, to find the links of the header by their names. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Profiles that the GitHub then the LinkedIn icon open, with the name of each icon. */
const getProfiles = (translations: Translations) => [
  { name: translations.githubLink.label, url: GITHUB_PROFILE_URL },
  { name: translations.linkedInLink.label, url: LINKEDIN_PROFILE_URL },
];

/** Names of the links of the navigation, in their order: the pages, the icons, then the CV link. */
const getLinkNames = (translations: Translations) => [
  translations.nav.home,
  translations.nav.projects,
  translations.nav.experience,
  ...getProfiles(translations).map(({ name }) => name),
  translations.cvLink.text,
];

/**
 * Answers the requests for the profiles with an empty page, so that the tests open them without
 * reaching GitHub or LinkedIn.
 */
const stubProfiles = (context: BrowserContext) => {
  const profileUrls: string[] = [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL];
  return context.route(
    url => profileUrls.includes(url.href),
    route => route.fulfill({ contentType: 'text/html', body: '' }),
  );
};

/** Parameters of {@link expectToOpenInNewTab}. */
interface ExpectToOpenInNewTabParams {
  /** Page of the test. */
  page: Page;
  /** Link to the profile. */
  link: Locator;
  /** URL of the profile. */
  url: string;
  /** Opens the link, with a click or a tap. */
  open: () => Promise<void>;
}

/**
 * Checks that a link opens its profile in a new tab, which gets no access to the site that opened
 * it (`noopener`) nor its address (`noreferrer`), then closes that tab.
 */
const expectToOpenInNewTab = async ({ page, link, url, open }: ExpectToOpenInNewTabParams) => {
  await expect(link).toHaveAttribute('target', '_blank');
  const popupEvent = page.waitForEvent('popup');
  await open();
  const popup = await popupEvent;
  await popup.waitForLoadState();

  expect(popup.url(), 'address of the new tab').toBe(url);
  expect(await popup.evaluate(() => window.opener), 'site that opened the tab').toBeNull();
  expect(await popup.evaluate(() => document.referrer), 'address given to the profile').toBe('');
  await popup.close();
};

/** Parameters of {@link expectToDownloadCv}. */
interface ExpectToDownloadCvParams {
  /** Page of the test. */
  page: Page;
  /** Language of the page, whose CV the link must download. */
  language: Language;
  /** Follows the CV link, with a click or a tap. */
  open: () => Promise<void>;
}

/** Checks that following the CV link downloads the CV written in the language of the page. */
const expectToDownloadCv = async ({ page, language, open }: ExpectToDownloadCvParams) => {
  const downloadEvent = page.waitForEvent('download');
  await open();
  const download = await downloadEvent;

  expect(download.suggestedFilename(), 'name of the downloaded file').toBe(CV_FILE_NAMES[language]);
  expect(await download.failure(), 'error of the download').toBeNull();
};

/** Parameters of {@link getBoxes}. */
interface GetBoxesParams {
  /** Navigation of the header. */
  navigation: Locator;
  /** Names of the links to measure. */
  names: readonly string[];
}

/** Measures the box of each named link of the navigation, by its exact name. */
const getBoxes = ({ navigation, names }: GetBoxesParams) =>
  Promise.all(names.map(name => navigation.getByRole('link', { name, exact: true }).boundingBox()));

/** Box that spans two boxes of the same row, from the left of the first to the right of the last. */
const getRowBox = (first: ScreenBox | null, last: ScreenBox | null): ScreenBox | null =>
  first && last ? { ...first, width: getBoxRight(last) - first.x } : null;

// jsdom computes no layout, so only a real browser sees the items of the header out of their line
// or their order, and only it downloads a file or opens a new tab
for (const language of LANGUAGES) {
  const translations = TRANSLATIONS[language];
  const route = localizePath({ path: LONG_PAGE_ROUTE, language });

  for (const width of DESKTOP_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test('the header shows the links, a line, the GitHub and LinkedIn icons, a line, then the CV link, on one line', async ({
        page,
      }) => {
        await page.goto(route);
        const header = page.getByRole('banner');
        const navigation = header.getByRole('navigation');
        const names = getLinkNames(translations);
        const [home, projects, experience, gitHub, linkedIn, cv] = await getBoxes({
          navigation,
          names,
        });
        // The lines are the elements of the navigation that screen readers skip
        const separators = navigation.locator(':scope > [aria-hidden="true"]');
        await expect(separators).toHaveCount(2);
        const [firstLine, secondLine] = await Promise.all(
          [0, 1].map(index => separators.nth(index).boundingBox()),
        );

        const items = [
          ['link to the home page', home],
          ['link to the projects', projects],
          ['link to the experiences', experience],
          ['first line', firstLine],
          ['GitHub icon', gitHub],
          ['LinkedIn icon', linkedIn],
          ['second line', secondLine],
          ['CV link', cv],
        ] as const;
        const headerBox = await header.boundingBox();
        const screenBox = getScreenBox(page.viewportSize());
        items.forEach(([label, box], index) => {
          expect(box?.width, `width of the ${label}`).toBeGreaterThan(0);
          expect(
            isBoxInside({ box, container: headerBox }) &&
              isBoxInside({ box, container: screenBox }),
            `${label} whole in the header, on the screen: ${JSON.stringify(box)}`,
          ).toBe(true);
          expect(
            getBoxCenterDistanceY({ box, referenceBox: home }),
            `distance in px from the vertical center of the ${label} to the one of the first link`,
          ).toBeLessThanOrEqual(MAX_ALIGNMENT_OFFSET_PX);

          const isFirst = index === 0;
          if (isFirst) return;
          const [previousLabel, previousBox] = items[index - 1];
          expect(box?.x, `left of the ${label}, after the ${previousLabel}`).toBeGreaterThanOrEqual(
            getBoxRight(previousBox),
          );
        });
      });

      test(`the CV link downloads the CV written in ${language}`, async ({ page }) => {
        await page.goto(route);
        const cvLink = page.getByRole('link', { name: translations.cvLink.text });

        await expectToDownloadCv({ page, language, open: () => cvLink.click() });
      });

      test('the GitHub and LinkedIn icons open the profiles in a new tab', async ({
        page,
        context,
      }) => {
        await stubProfiles(context);
        await page.goto(route);

        for (const { name, url } of getProfiles(translations)) {
          const link = page.getByRole('link', { name });
          await expectToOpenInNewTab({ page, link, url, open: () => link.click() });
        }
      });
    });
  }

  for (const width of MOBILE_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide touch screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, hasTouch: true });

      /**
       * Opens the mobile menu with the burger button, then waits for its links to finish sliding
       * in, so that they are measured where they stop.
       *
       * @returns The navigation of the menu.
       */
      const openMenu = async (page: Page): Promise<Locator> => {
        await page.getByRole('button', { name: translations.burgerMenu.open }).click();
        const navigation = page.getByRole('navigation');
        await expect(navigation).toBeVisible();
        await navigation.evaluate(waitForEndingAnimations);
        return navigation;
      };

      test('the open mobile menu shows the icons on one row under the links, then the CV link, centered', async ({
        page,
      }) => {
        await page.goto(route);
        const navigation = await openMenu(page);
        const [gitHubName, linkedInName] = getProfiles(translations).map(({ name }) => name);
        const [experience, gitHub, linkedIn, cv] = await getBoxes({
          navigation,
          names: [translations.nav.experience, gitHubName, linkedInName, translations.cvLink.text],
        });
        const navigationBox = await navigation.boundingBox();

        expect(gitHub?.y, 'top of the GitHub icon, under the links').toBeGreaterThan(
          getBoxBottom(experience),
        );
        expect(
          getBoxCenterDistanceY({ box: linkedIn, referenceBox: gitHub }),
          'distance in px from the vertical center of the LinkedIn icon to the GitHub icon',
        ).toBeLessThanOrEqual(MAX_ALIGNMENT_OFFSET_PX);
        expect(linkedIn?.x, 'left of the LinkedIn icon, after the GitHub icon').toBeGreaterThan(
          getBoxRight(gitHub),
        );
        expect(cv?.y, 'top of the CV link, under the icons').toBeGreaterThan(
          Math.max(getBoxBottom(gitHub), getBoxBottom(linkedIn)),
        );
        const centeredItems = [
          ['row of icons', getRowBox(gitHub, linkedIn)],
          ['CV link', cv],
        ] as const;
        for (const [label, box] of centeredItems) {
          expect(
            getBoxCenterDistanceX({ box, referenceBox: navigationBox }),
            `distance in px from the center of the ${label} to the center of the menu`,
          ).toBeLessThanOrEqual(MAX_ALIGNMENT_OFFSET_PX);
        }
      });

      test('Tab goes from the burger through the links, the icons, then the CV link', async ({
        page,
      }) => {
        await page.goto(route);
        await openMenu(page);
        await page.getByRole('button', { name: translations.burgerMenu.close }).focus();

        for (const name of getLinkNames(translations)) {
          await page.keyboard.press('Tab');
          await expect(page.getByRole('link', { name, exact: true })).toBeFocused();
        }
      });

      test('a tap on an icon opens its profile in a new tab, and a tap on the CV link downloads the CV', async ({
        page,
        context,
      }) => {
        await stubProfiles(context);
        await page.goto(route);

        // A tap on a link closes the menu, which opens again for the next one
        for (const { name, url } of getProfiles(translations)) {
          const navigation = await openMenu(page);
          const link = navigation.getByRole('link', { name });
          await expectToOpenInNewTab({ page, link, url, open: () => link.tap() });
        }
        const navigation = await openMenu(page);
        const cvLink = navigation.getByRole('link', { name: translations.cvLink.text });
        await expectToDownloadCv({ page, language, open: () => cvLink.tap() });
      });
    });
  }
}
