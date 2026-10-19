import { expect, type Page, test } from '@playwright/test';

import { STALE_CHUNK_RELOAD_STORAGE_KEY } from '../src/App/constants';
import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import type { Language, Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import { PORTRAIT_PHOTO_MEDIA_QUERY, STATUS_PAGE_BACKGROUND_PHOTO } from '../src/utils/pages';
import {
  ERROR_MESSAGE_SELECTOR,
  ERROR_PAGE_SCREENS,
  MAX_ERROR_MESSAGE_CENTER_OFFSET_RATIO,
  NOT_FOUND_ROUTE,
  PAGE_SELECTOR,
  PROJECTS_CHUNK_PATTERN,
  PROJECTS_ROUTE,
} from './constants';
import { getBoxCenterDistanceY } from './utils';

/** Translations of each language, to find each error page by its title. */
const TRANSLATIONS = { fr, en };

/** Parameters of the `open` function of an {@link ErrorPage}. */
interface OpenParams {
  /** Page of the browser to open it in. */
  page: Page;
  /** Language to open it in, one of `LANGUAGES`. */
  language: Language;
}

/** Error page of the site, with the way to make the app show it. */
interface ErrorPage {
  /** Name of the page in the test titles. */
  name: string;
  /** Title of the page, its `h1`, in the given translations. */
  getTitle: (translations: Translations) => string;
  /** Opens a URL at which the app shows the page. */
  open: (params: OpenParams) => Promise<void>;
}

/** Error pages that `StatusPage` renders and a visitor can meet. */
const ERROR_PAGES: ErrorPage[] = [
  {
    name: 'the not found page',
    getTitle: translations => translations.errors.notFound.title,
    open: async ({ page, language }) => {
      await page.goto(localizePath({ path: NOT_FOUND_ROUTE, language }));
    },
  },
  {
    name: 'the unexpected error',
    getTitle: translations => translations.errors.unexpected.title,
    open: async ({ page, language }) => {
      // A reload for a missing chunk counts as just done, so the page shows its error instead
      await page.addInitScript(storageKey => {
        window.sessionStorage.setItem(storageKey, String(Date.now()));
      }, STALE_CHUNK_RELOAD_STORAGE_KEY);
      await page.route(PROJECTS_CHUNK_PATTERN, route => route.abort());
      await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
    },
  },
];

// jsdom computes no layout, so only a real browser tells where the message sits
for (const language of LANGUAGES) {
  for (const screen of ERROR_PAGE_SCREENS) {
    test.describe(`in ${language}, on a ${screen.width} × ${screen.height} px screen`, () => {
      test.use({ viewport: screen });

      for (const { name, getTitle, open } of ERROR_PAGES) {
        test(`${name} centers its message over a background photo`, async ({ page }) => {
          await open({ page, language });
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          await expect(
            page.getByRole('heading', { level: 1, name: getTitle(TRANSLATIONS[language]) }),
          ).toBeVisible();
          // The web fonts that replace the fallback font change the height of the message
          await page.waitForLoadState('networkidle');
          await page.evaluate(async () => {
            await document.fonts.ready;
          });

          const main = page.locator(PAGE_SELECTOR);
          // Phones held upright show the portrait version of the photo, the other screens the whole
          const isPortraitScreen = await page.evaluate(
            query => matchMedia(query).matches,
            PORTRAIT_PHOTO_MEDIA_QUERY,
          );
          const { url, portraitUrl, placeholderUrl } = STATUS_PAGE_BACKGROUND_PHOTO;
          const photoPath = isPortraitScreen ? portraitUrl : url;
          const photoUrl = new URL(photoPath, page.url()).href;
          const backgroundImage = await main.evaluate(
            element => getComputedStyle(element, '::before').backgroundImage,
          );
          // The photo, over the placeholder that shows until it is downloaded
          expect
            .soft(backgroundImage, 'background of the page')
            .toBe(`url("${photoUrl}"), url("${placeholderUrl}")`);
          const photoResponse = await page.request.get(photoUrl);
          expect.soft(photoResponse.ok(), `${photoPath} served`).toBe(true);

          const mainBox = await main.boundingBox();
          const messageBox = await page.locator(ERROR_MESSAGE_SELECTOR).boundingBox();
          const maxOffset = (mainBox?.height ?? Number.NaN) * MAX_ERROR_MESSAGE_CENTER_OFFSET_RATIO;
          expect(
            getBoxCenterDistanceY({ box: messageBox, referenceBox: mainBox }),
            'distance in px between the centers of the message and of the page',
          ).toBeLessThanOrEqual(maxOffset);
        });
      }
    });
  }
}
