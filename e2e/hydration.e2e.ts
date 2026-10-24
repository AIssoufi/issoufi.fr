import { type ConsoleMessage, expect, type Page, test } from '@playwright/test';

import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { LIKED_PROJECTS_STORAGE_KEY } from '../src/pages/Projects/Project/constants.ts';
import { LANGUAGE_STORAGE_KEY, LANGUAGES } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { getPageFiles, NOT_FOUND_FOLDER, NOT_FOUND_PATH } from '../src/utils/pages.ts';
import { APP_CONTAINER_ID } from '../src/utils/prerender.ts';
import {
  NOT_FOUND_ROUTE,
  NOT_FOUND_STATUS_MESSAGE_PATTERN,
  PAGE_HEADINGS,
  PAGE_SELECTOR,
  PRERENDERED_ELEMENTS_PROPERTY,
  PROJECTS_ROUTE,
  REACT_FIBER_KEY_PREFIX,
  REPORTED_CONSOLE_TYPES,
  VISITOR_MONTHS_AFTER_BUILD,
} from './constants.ts';
import { waitForPageContent } from './loading.ts';

/** Translations of each language, to find each page by its heading. */
const TRANSLATIONS = { fr, en };

/** Parameters of {@link isNotFoundStatusMessage}. */
interface IsNotFoundStatusMessageParams {
  /** Message of the console to check. */
  message: ConsoleMessage;
  /** Page of the browser that logged it. */
  page: Page;
}

const pageFiles = getPageFiles();

/** Ids of every project, which the visitor of the hydration test has liked. */
const ALL_PROJECT_IDS = [...freelanceProjectsData.projects, ...personalProjectsData.projects].map(
  ({ id }) => id,
);

/**
 * Gives the page the state of a visitor that differs from the build: every project liked, and a
 * clock over a year after the build, so a component that renders either before hydrating the page
 * makes React report a mismatch.
 */
const visitAfterBuild = async (page: Page) => {
  const visitorTime = new Date();
  visitorTime.setMonth(visitorTime.getMonth() + VISITOR_MONTHS_AFTER_BUILD);
  await page.clock.setFixedTime(visitorTime);
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: LIKED_PROJECTS_STORAGE_KEY,
    value: JSON.stringify(ALL_PROJECT_IDS),
  });
};

/**
 * Tells whether a console message is the error that Chromium logs for a page served with the status
 * 404, as the not found page is: the status of the page itself, not a problem of the page.
 */
const isNotFoundStatusMessage = ({ message, page }: IsNotFoundStatusMessageParams) =>
  message.location().url === page.url() && NOT_FOUND_STATUS_MESSAGE_PATTERN.test(message.text());

/**
 * Records what a page reports while it loads: the errors and warnings of its console, among which
 * React reports a mismatch between the page of the build and its own render, and the errors that
 * it throws.
 */
const recordProblems = (page: Page) => {
  const problems: string[] = [];
  page.on('console', message => {
    const isProblem =
      REPORTED_CONSOLE_TYPES.has(message.type()) && !isNotFoundStatusMessage({ message, page });
    if (isProblem) {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
  return problems;
};

/**
 * Keeps the elements that the build rendered in the page, read once the browser has parsed it and
 * before its module scripts run, so the test can tell whether React took them over or replaced
 * them. An init script comes through the DevTools protocol, which the policy does not block.
 */
const keepPrerenderedElements = (page: Page) =>
  page.addInitScript(
    ({ containerId, property }) => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'interactive') return;
        const container = document.getElementById(containerId);
        Reflect.set(window, property, [...(container?.querySelectorAll('*') ?? [])]);
      });
    },
    { containerId: APP_CONTAINER_ID, property: PRERENDERED_ELEMENTS_PROPERTY },
  );

/** Waits until React has taken over the page, then until its requests and effects have settled. */
const waitForHydration = async (page: Page) => {
  await page.waitForFunction(
    ({ selector, keyPrefix }) =>
      Object.keys(document.querySelector(selector) ?? {}).some(key => key.startsWith(keyPrefix)),
    { selector: PAGE_SELECTOR, keyPrefix: REACT_FIBER_KEY_PREFIX },
  );
  await page.evaluate(waitForPageContent);
};

/** Reads the elements that the build rendered and that the page no longer holds. */
const getReplacedElements = (page: Page) =>
  page.evaluate(property => {
    const elements: Element[] = Reflect.get(window, property) ?? [];
    return {
      count: elements.length,
      replaced: elements
        .filter(element => !element.isConnected)
        .map(element => element.outerHTML.slice(0, 120)),
    };
  }, PRERENDERED_ELEMENTS_PROPERTY);

test.describe('hydration of the pages rendered by the build', () => {
  for (const { path, language, page: sitePage } of pageFiles) {
    test(`${path} keeps the elements of the build, with no error nor warning`, async ({ page }) => {
      const problems = recordProblems(page);
      await visitAfterBuild(page);
      await keepPrerenderedElements(page);

      await page.goto(path);
      await waitForHydration(page);

      const { count, replaced } = await getReplacedElements(page);
      expect(count).toBeGreaterThan(0);
      expect(replaced, 'elements of the build that React replaced').toEqual([]);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        PAGE_HEADINGS[sitePage.folder](TRANSLATIONS[language]),
      );
      expect(problems).toEqual([]);
    });
  }

  for (const language of LANGUAGES) {
    // React keeps the attributes of the build where its own render differs, and says nothing
    test(`the projects page in ${language} shows the likes of the visitor`, async ({ page }) => {
      await visitAfterBuild(page);

      await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
      await waitForHydration(page);

      const likeButtons = page.locator(`${PAGE_SELECTOR} [aria-pressed]`);
      await expect(likeButtons.first()).toBeVisible();
      for (const likeButton of await likeButtons.all()) {
        await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
      }
    });

    test(`the not found page in ${language} names the path typed, with no error nor warning`, async ({
      page,
    }) => {
      const problems = recordProblems(page);
      const route = localizePath({ path: NOT_FOUND_ROUTE, language });

      await page.goto(route);
      await waitForHydration(page);

      await expect(page.locator(PAGE_SELECTOR)).toContainText(route);
      expect(problems).toEqual([]);
    });
  }

  test('the root renders the stored language over the French page, with no error', async ({
    page,
  }) => {
    const problems = recordProblems(page);
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: LANGUAGE_STORAGE_KEY,
      value: 'en',
    });

    await page.goto('/');
    await waitForHydration(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(en.home.title1);
    expect(problems).toEqual([]);
  });
});

test.describe('pages with JavaScript off', () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, language, page: sitePage } of pageFiles) {
    test(`${path} shows its heading and links every page in ${language}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        PAGE_HEADINGS[sitePage.folder](TRANSLATIONS[language]),
      );
      for (const { path: otherPath } of pageFiles.filter(file => file.language === language)) {
        await expect(page.locator(`a[href="${otherPath}"]`).first()).toBeAttached();
      }
    });
  }

  for (const language of LANGUAGES) {
    test(`the not found page in ${language} says that the page does not exist`, async ({
      page,
    }) => {
      // The file that Cloudflare Pages and vite preview serve at a path of no page, opened here at
      // its own path
      await page.goto(localizePath({ path: NOT_FOUND_PATH, language }));

      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        PAGE_HEADINGS[NOT_FOUND_FOLDER](TRANSLATIONS[language]),
      );
      await expect(page.locator(PAGE_SELECTOR)).toContainText(
        TRANSLATIONS[language].errors.notFound.messageWithoutPath,
      );
    });
  }
});
