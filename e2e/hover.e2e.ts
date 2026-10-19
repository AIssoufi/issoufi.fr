import { expect, type Page, test } from '@playwright/test';

import { fr } from '../src/i18n/fr';
import { HOVER_POINTER_QUERY } from '../src/theme/constants';
import { theme } from '../src/theme/theme';
import {
  HERO_SUBTITLE_SELECTOR,
  PAGE_SELECTOR,
  PROJECT_CARD_SELECTOR,
  PROJECTS_ROUTE,
} from './constants';
import { getBoxCenter } from './utils';

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

/** Name of the like button of a project card, whatever the project, as `projects.like` writes it. */
const LIKE_BUTTON_NAME = new RegExp(`^${fr.projects.like.replace('{{name}}', '.+')}$`);

/**
 * Reads the transform that the tilt of a project card writes on it, which follows the pointer.
 * Runs in the browser, passed to `locator.evaluate`, so it uses nothing from outside its own body.
 */
const readInlineTransform = (card: HTMLElement) => card.style.transform;

/**
 * Number of animation frames after which the effects of the home page that follow the pointer have
 * moved toward it: the glow covers a tenth of the way on each frame.
 */
const POINTER_EFFECT_FRAME_COUNT = 10;

/**
 * Reads the transform that the effects that follow the pointer write on each element of a page,
 * in the order of the page. Runs in the browser, passed to `locator.evaluate`, so it uses nothing
 * from outside its own body.
 */
const readInlineTransforms = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('*')].map(element => element.style.transform);

/**
 * Waits for the given number of animation frames. Runs in the browser, passed to `page.evaluate`,
 * so it uses nothing from outside its own body.
 */
const waitForFrames = async (count: number) => {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise(requestAnimationFrame);
  }
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

  test.describe('without reduced motion, which keeps the cards flat anyway', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('a tap on the like button of a project card leaves the card flat', async ({ page }) => {
      await page.goto(PROJECTS_ROUTE);
      const card = page.locator(PROJECT_CARD_SELECTOR).first();

      await card.getByRole('button', { name: LIKE_BUTTON_NAME }).tap();

      expect(await card.evaluate(readInlineTransform), 'transform of the card').toBe('');
    });

    test('a tap on the home page leaves the content, the glow and the words in place', async ({
      page,
    }) => {
      await page.goto('/');
      const main = page.locator(PAGE_SELECTOR);
      await expect(main).toBeVisible();
      await page.evaluate(waitForFrames, POINTER_EFFECT_FRAME_COUNT);
      const restTransforms = await main.evaluate(readInlineTransforms);

      // The content floats without end, which a locator would wait for: tap where it stands now.
      // Without a box, the coordinates are NaN, which the tap refuses, so the test fails.
      const subtitleBox = await page.locator(HERO_SUBTITLE_SELECTOR).boundingBox();
      const { x, y } = getBoxCenter(subtitleBox) ?? { x: Number.NaN, y: Number.NaN };
      await page.touchscreen.tap(x, y);
      await page.evaluate(waitForFrames, POINTER_EFFECT_FRAME_COUNT);

      expect(await main.evaluate(readInlineTransforms)).toEqual(restTransforms);
    });
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
