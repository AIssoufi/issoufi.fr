import { expect, test } from '@playwright/test';

import { LANGUAGE_STORAGE_KEY, LANGUAGES } from '../src/i18n/constants';
import { PAGES } from '../src/utils/pages';
import {
  HEADER_SELECTOR,
  MAX_EDGE_OFFSET_PX,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  SITE_FOOTER_SCREEN_WIDTHS_PX,
  SITE_FOOTER_SELECTOR,
} from './constants';
import { doBoxesOverlap, getCheckedRoutes, isInBottomHalf, type ScreenBox } from './utils';

/** Box of something a visitor reads or uses on a page, with a label that names it in a failure. */
interface ContentBox extends ScreenBox {
  /** The start of the text, or the tag of the element, such as `<button>`. */
  label: string;
}

/**
 * Lists the boxes of what a visitor reads or uses in an element: each line of its texts, and its
 * links, buttons, form fields, images and icons. Leaves out what is hidden, and what is fixed on
 * the screen, such as the particle field of the home page, which is a background. Runs in the
 * browser, so it uses nothing from outside its own body.
 */
const listContentBoxes = (container: Element): ContentBox[] => {
  /** Longest label of a text, enough to find it in the page. */
  const MAX_LABEL_LENGTH_CHARS = 40;
  const CONTROL_AND_MEDIA_SELECTOR = 'a, button, input, select, textarea, img, svg, video, canvas';

  const isFixedOnScreen = (element: Element | null) => {
    for (let current = element; current; current = current.parentElement) {
      if (getComputedStyle(current).position === 'fixed') return true;
    }
    return false;
  };
  const isShown = (element: Element | null): element is Element =>
    Boolean(element?.checkVisibility({ visibilityProperty: true })) && !isFixedOnScreen(element);
  const toContentBox = (rect: DOMRect, label: string): ContentBox => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    label,
  });

  const boxes: ContentBox[] = [];
  const texts = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let text = texts.nextNode(); text; text = texts.nextNode()) {
    const content = text.textContent?.trim() ?? '';
    if (!content || !isShown(text.parentElement)) continue;

    const range = document.createRange();
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) {
      boxes.push(toContentBox(rect, content.slice(0, MAX_LABEL_LENGTH_CHARS)));
    }
  }
  for (const element of container.querySelectorAll(CONTROL_AND_MEDIA_SELECTOR)) {
    if (!isShown(element)) continue;
    boxes.push(toContentBox(element.getBoundingClientRect(), `<${element.localName}>`));
  }
  return boxes;
};

/** Scrolls the page to its end. Runs in the browser. */
const scrollToEnd = () => window.scrollTo(0, document.documentElement.scrollHeight);

/**
 * Finds the left and right edges of the content of an element, inside its padding, such as where
 * the logo of the header starts and where its navigation ends. Runs in the browser.
 */
const getContentEdges = (element: Element) => {
  const { left, right } = element.getBoundingClientRect();
  const { paddingLeft, paddingRight } = getComputedStyle(element);
  return { left: left + parseFloat(paddingLeft), right: right - parseFloat(paddingRight) };
};

/**
 * Tells whether no other element is drawn over an element at its center: the browser finds the
 * element, or one of its children, there. Runs in the browser.
 */
const isDrawnOnTop = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return element.contains(document.elementFromPoint(x + width / 2, y + height / 2));
};

// jsdom computes no layout, so only a real browser sees the footer out of line with the header,
// moving with the page, under another element, or over the end of a page
for (const language of LANGUAGES) {
  for (const width of SITE_FOOTER_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      const screen = { width, height: SCREEN_HEIGHT_PX };
      test.use({ viewport: screen });

      // Each language has its own text widths. The app opens in the one the toggle stored.
      test.beforeEach(async ({ page }) => {
        await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
          key: LANGUAGE_STORAGE_KEY,
          value: language,
        });
      });

      for (const route of getCheckedRoutes(PAGES)) {
        test(`${route} lines the site footer up with the header, above everything, and leaves its end uncovered`, async ({
          page,
        }) => {
          await page.goto(route);
          // Without the stored language, every run would test the default language
          await expect(page.locator('html')).toHaveAttribute('lang', language);
          // Measured before its chunk is loaded, a page would have no content to cover
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // Its images, then the web fonts that replace the fallback font, change its height
          await page.waitForLoadState('networkidle');
          await page.evaluate(async () => {
            await document.fonts.ready;
          });

          const siteFooter = page.locator(SITE_FOOTER_SELECTOR);
          const items = [
            { name: 'version', locator: siteFooter.locator('p') },
            { name: 'GitHub icon', locator: siteFooter.getByRole('link') },
          ];
          const boxes = await Promise.all(items.map(({ locator }) => locator.boundingBox()));
          const [versionBox, gitHubBox] = boxes;

          // The version starts under the logo, and the GitHub icon ends under the navigation
          const headerEdges = await page.locator(HEADER_SELECTOR).evaluate(getContentEdges);
          expect(
            Math.abs((versionBox?.x ?? Number.NaN) - headerEdges.left),
            'distance in px from the left edge of the version to the start of the header',
          ).toBeLessThanOrEqual(MAX_EDGE_OFFSET_PX);
          expect(
            Math.abs((gitHubBox ? gitHubBox.x + gitHubBox.width : Number.NaN) - headerEdges.right),
            'distance in px from the right edge of the GitHub icon to the end of the header',
          ).toBeLessThanOrEqual(MAX_EDGE_OFFSET_PX);

          await page.evaluate(scrollToEnd);
          const contentBoxes = await page.locator(PAGE_SELECTOR).evaluate(listContentBoxes);
          // Without any, a selector that matches nothing any more would let everything pass
          expect(contentBoxes.length, 'texts and controls found on the page').toBeGreaterThan(0);

          for (const [index, { name, locator }] of items.entries()) {
            const box = boxes[index];
            expect(
              isInBottomHalf({ box, screen }),
              `box of the ${name} at the bottom of the screen: ${JSON.stringify(box)}`,
            ).toBe(true);
            expect(
              await locator.boundingBox(),
              `box of the ${name} once the page is scrolled to its end`,
            ).toEqual(box);
            expect(await locator.evaluate(isDrawnOnTop), `${name} drawn above everything`).toBe(
              true,
            );
            const coveredContent = contentBoxes
              .filter(contentBox => doBoxesOverlap({ box: contentBox, otherBox: box }))
              .map(({ label }) => label);
            expect(coveredContent, `texts and controls under the ${name}`).toEqual([]);
          }
        });
      }
    });
  }
}
