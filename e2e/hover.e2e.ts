import { expect, type Page, test } from '@playwright/test';

import { fr } from '../src/i18n/fr';
import { HOVER_POINTER_QUERY } from '../src/theme/constants';
import { theme } from '../src/theme/theme';
import { PROJECTS_ROUTE } from './constants';

/** Properties that the hover styles of the controls of the site change. */
const HOVER_PROPERTIES = ['background-color', 'border-color', 'color', 'transform'];

/** Background of the arrows of the Projects page under the pointer, as the browser writes it. */
const ARROW_HOVER_BACKGROUND = `rgb(${theme.colorChannels.accent})`;

/**
 * Reads the properties that a hover style changes on a control, as the screen shows them. Runs in
 * the browser, passed to `locator.evaluate`, so it uses nothing from outside its own body.
 */
const readHoverProperties = (control: Element, properties: string[]) => {
  const style = getComputedStyle(control);
  return Object.fromEntries(
    properties.map(property => [property, style.getPropertyValue(property)]),
  );
};

/** Arrow that shows the next page of projects, in the first section of the Projects page. */
const getNextPageButton = (page: Page) =>
  page.getByRole('button', { name: fr.projects.nextPage }).first();

/** Tells whether the main pointer of the page hovers, as the hover styles of the site ask. */
const doesPointerHover = (page: Page) =>
  page.evaluate(query => matchMedia(query).matches, HOVER_POINTER_QUERY);

// jsdom applies no media query and has no pointer: only a real browser tells which styles a tap
// or the mouse gives a control
test.describe('on a touch screen', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });

  test('a tap leaves no hover style on the control tapped', async ({ page }) => {
    await page.goto(PROJECTS_ROUTE);
    const nextPageButton = getNextPageButton(page);
    const restStyle = await nextPageButton.evaluate(readHoverProperties, HOVER_PROPERTIES);

    await nextPageButton.tap();

    expect(await doesPointerHover(page), 'main pointer that hovers').toBe(false);
    expect(await nextPageButton.evaluate(readHoverProperties, HOVER_PROPERTIES)).toEqual(restStyle);
  });
});

test.describe('with a mouse', () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });

  test('the hover style shows under the pointer', async ({ page }) => {
    await page.goto(PROJECTS_ROUTE);
    const nextPageButton = getNextPageButton(page);

    await nextPageButton.hover();

    expect(await doesPointerHover(page), 'main pointer that hovers').toBe(true);
    await expect(nextPageButton).toHaveCSS('background-color', ARROW_HOVER_BACKGROUND);
  });
});
