import type { Page } from '@playwright/test';

import { SHOW_ALL_BUTTON_NAME } from './constants.ts';

/** Page of a browser test. Only its `getByRole` is used, so the tests can pass a fake one. */
type ProjectsPage = Pick<Page, 'getByRole'>;

/**
 * Shows every project of the Projects page, in either language: waits until its chunk shows the
 * "Show all" buttons, then clicks the first one left until none is, since a clicked one becomes
 * "Show less".
 *
 * @param page - Page of the test, open on the Projects page.
 * @returns Once no "Show all" button is left. Rejects when the page shows none before the test
 * times out.
 *
 * @example
 * await page.goto('/projects');
 * await showAllProjects(page);
 */
export const showAllProjects = async (page: ProjectsPage): Promise<void> => {
  const showAllButtons = page.getByRole('button', { name: SHOW_ALL_BUTTON_NAME });
  await showAllButtons.first().waitFor();
  while ((await showAllButtons.count()) > 0) await showAllButtons.first().click();
};
