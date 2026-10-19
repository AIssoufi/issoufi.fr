import { expect, test } from '@playwright/test';

import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { getPageFiles, getPageUrl } from '../src/utils/pages.ts';
import { PROJECTS_ROUTE } from './constants.ts';

// The language is in the URL: each page has an HTML file per language, which the server must
// serve at the URL of that language, on a direct visit as on a reload
for (const { page: sitePage, language } of getPageFiles()) {
  const route = localizePath({ path: sitePage.path, language });

  test(`${route} is served its own HTML file, in ${language}`, async ({ page }) => {
    await page.goto(route);

    // The app never changes the canonical URL: it shows which HTML file the server sent
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      getPageUrl({ path: sitePage.path, language }),
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      getPageUrl({ path: sitePage.path, language: DEFAULT_LANGUAGE }),
    );
    await expect(page.locator('html')).toHaveAttribute('lang', language);
  });
}

test('the root opens at the English home page once English was chosen', async ({ page }) => {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: LANGUAGE_STORAGE_KEY,
    value: 'en',
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('link', { name: en.home.cta })).toHaveAttribute(
    'href',
    '/en/projects',
  );
});

test('the toggle opens the page in the other language, which a reload keeps', async ({ page }) => {
  await page.goto(PROJECTS_ROUTE);

  await page.getByRole('button', { name: 'English' }).click();

  await expect(page).toHaveURL(/\/en\/projects$/);
  await expect(page.getByRole('heading', { name: en.projects.personal })).toBeVisible();

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: en.projects.personal })).toBeVisible();
});
