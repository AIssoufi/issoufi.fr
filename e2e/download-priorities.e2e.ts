import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { ROW_CARD_COUNT } from '../src/pages/Projects/Project/constants.ts';
import { PAGES } from '../src/utils/pages.ts';
import {
  PAGE_SELECTOR,
  PRIORITY_SCREENS,
  PROJECT_CARD_SELECTOR,
  PROJECTS_ROUTE,
  SLOW_4G_NETWORK,
} from './constants.ts';
import { waitForPageContent } from './loading.ts';
import { recordDownloadPriorities } from './priorities.ts';

/** Selector of the tags of the HTML of a page that load the scripts of the app. */
const APP_SCRIPT_SELECTOR = 'script[type="module"][src], link[rel="modulepreload"]';

/** Lists the paths of the scripts of the app that the HTML of the page loads. */
const listAppScriptPaths = (page: Page) =>
  page
    .locator(APP_SCRIPT_SELECTOR)
    .evaluateAll((elements: (HTMLScriptElement | HTMLLinkElement)[]) =>
      elements.map(
        element =>
          new URL(element instanceof HTMLScriptElement ? element.src : element.href).pathname,
      ),
    );

/** Lists the paths of the files that the thumbnails of the page show, in its order. */
const listThumbnailPaths = (page: Page) =>
  page
    .locator(`${PROJECT_CARD_SELECTOR} img`)
    .evaluateAll((images: HTMLImageElement[]) =>
      images
        .filter(image => image.currentSrc !== '')
        .map(image => new URL(image.currentSrc).pathname),
    );

/**
 * Paths of every file of the thumbnails of the cards out of the first page of each section, which
 * the HTML holds for the visitors without JavaScript, hidden from the others.
 */
const OFF_PAGE_THUMBNAIL_PATHS = [personalProjectsData, freelanceProjectsData]
  .flatMap(({ projects }) => projects.slice(ROW_CARD_COUNT))
  .flatMap(({ thumbnails }) => thumbnails.map(({ url }) => url));

/** Parameters of {@link openPage}. */
interface OpenPageParams {
  /** Page of the browser. */
  page: Page;
  /** Route to open, e.g. `/en/projects`. */
  route: string;
}

/**
 * Opens a page on the slow 4G network of a phone, and waits until it has downloaded what it shows:
 * its images, its background photo and its web fonts.
 *
 * @returns The last priority of each file that it downloaded, by its path.
 */
const openPage = async ({ page, route }: OpenPageParams) => {
  const session = await page.context().newCDPSession(page);
  const priorities = await recordDownloadPriorities(session);
  await session.send('Network.emulateNetworkConditions', SLOW_4G_NETWORK);
  await page.goto(route);
  await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
  await page.evaluate(waitForPageContent);
  return priorities;
};

// The first paints of a page that the build rendered need only its HTML, its font and its largest
// image, so the rest downloads at a low priority, rather than share their bandwidth
// (`addPrerenderedPage`, src/utils/pageHtml.ts). Only a real browser tells the priority of a file,
// which Chromium raises for an image that shows on the screen while it downloads, unless the image
// asks for a low priority: the background photo and the thumbnails beside the first one
for (const language of LANGUAGES) {
  for (const { width, height, version } of PRIORITY_SCREENS) {
    test.describe(`in ${language}, at ${width} × ${height} px`, () => {
      test.use({ viewport: { width, height } });

      for (const { path, backgroundPhoto } of PAGES) {
        const route = localizePath({ path, language });

        test(`${route} downloads its background photo and its scripts at a low priority`, async ({
          page,
        }) => {
          const priorities = await openPage({ page, route });
          const scriptPaths = await listAppScriptPaths(page);

          expect(priorities.get(backgroundPhoto[version]), 'background photo').toBe('Low');
          expect(scriptPaths.length).toBeGreaterThan(0);
          scriptPaths.forEach(scriptPath => {
            expect.soft(priorities.get(scriptPath), scriptPath).toBe('Low');
          });
        });
      }

      const projectsRoute = localizePath({ path: PROJECTS_ROUTE, language });

      test(`${projectsRoute} downloads its first thumbnail alone at a high priority`, async ({
        page,
      }) => {
        const priorities = await openPage({ page, route: projectsRoute });
        const [firstPath = '', ...otherPaths] = await listThumbnailPaths(page);
        const otherPriorities = otherPaths.map(otherPath => [otherPath, priorities.get(otherPath)]);

        expect(priorities.get(firstPath), firstPath).toBe('High');
        expect(otherPriorities.length).toBeGreaterThan(0);
        expect(otherPriorities).toEqual(otherPaths.map(otherPath => [otherPath, 'Low']));
      });

      test(`${projectsRoute} downloads no thumbnail of the cards out of the first page`, async ({
        page,
      }) => {
        const priorities = await openPage({ page, route: projectsRoute });

        expect(OFF_PAGE_THUMBNAIL_PATHS.length).toBeGreaterThan(0);
        expect(
          OFF_PAGE_THUMBNAIL_PATHS.filter(thumbnailPath => priorities.has(thumbnailPath)),
        ).toEqual([]);
      });
    });
  }
}
