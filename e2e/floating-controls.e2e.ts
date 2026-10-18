import { expect, type Page, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { PAGES } from '../src/utils/pages';
import { waitForEndingAnimations } from './animations';
import {
  FLOATING_CONTROLS_SCREEN_WIDTHS_PX,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  SHOW_ALL_BUTTON_NAME,
} from './constants';
import { doBoxesOverlapHorizontally, getCheckedRoutes, type ScreenBox } from './utils';

/**
 * Translations of each language, to find the toggle, the CV button and the GitHub icon by their
 * names.
 */
const TRANSLATIONS = { fr, en };

/** Box of something a visitor reads or uses on a page, with a label that names it in a failure. */
interface ContentBox extends ScreenBox {
  /** The start of the text, or the tag of the element, such as `<button>`. */
  label: string;
}

/** Parameters of the `clipBox` helper of {@link listContentBoxes}. */
interface ClipBoxParams {
  /** Box of a line of text or of an element, as the browser lays it out. */
  rect: DOMRect;
  /** First element whose overflow may cut the box, then each of its ancestors in turn. */
  clipper: Element | null;
}

/**
 * Lists the boxes of what a visitor reads or uses in an element: each line of its texts, and its
 * links, buttons, form fields, images and icons, each cut to the part that its scrolling or
 * clipping ancestors show, such as a row of cards that scrolls sideways. Leaves out what is
 * hidden, and what is fixed on the screen, such as the particle field of the home page, which is a
 * background. Runs in the browser, so it uses nothing from outside its own body.
 */
const listContentBoxes = (container: Element): ContentBox[] => {
  const MAX_LABEL_LENGTH_CHARS = 40;
  const CONTROL_AND_MEDIA_SELECTOR = 'a, button, input, select, textarea, img, svg, video';

  const isFixedOnScreen = (element: Element | null) => {
    for (let current = element; current; current = current.parentElement) {
      if (getComputedStyle(current).position === 'fixed') return true;
    }
    return false;
  };
  const isShown = (element: Element | null): element is Element =>
    Boolean(element?.checkVisibility({ visibilityProperty: true })) && !isFixedOnScreen(element);

  /** Cuts a box to the part that `clipper` and its ancestors leave visible. */
  const clipBox = ({ rect, clipper }: ClipBoxParams) => {
    let { left, top, right, bottom } = rect;
    for (let current = clipper; current; current = current.parentElement) {
      const { overflowX, overflowY } = getComputedStyle(current);
      const clip = current.getBoundingClientRect();
      if (overflowX !== 'visible') {
        left = Math.max(left, clip.left);
        right = Math.min(right, clip.right);
      }
      if (overflowY !== 'visible') {
        top = Math.max(top, clip.top);
        bottom = Math.min(bottom, clip.bottom);
      }
    }
    return { x: left, y: top, width: right - left, height: bottom - top };
  };

  const boxes: ContentBox[] = [];
  const texts = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  for (let text = texts.nextNode(); text; text = texts.nextNode()) {
    const content = text.textContent?.trim() ?? '';
    if (!content) continue;
    if (!isShown(text.parentElement)) continue;

    const range = document.createRange();
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) {
      const label = content.slice(0, MAX_LABEL_LENGTH_CHARS);
      boxes.push({ ...clipBox({ rect, clipper: text.parentElement }), label });
    }
  }
  for (const element of container.querySelectorAll(CONTROL_AND_MEDIA_SELECTOR)) {
    if (!isShown(element)) continue;
    const label = `<${element.localName}>`;
    const rect = element.getBoundingClientRect();
    boxes.push({ ...clipBox({ rect, clipper: element.parentElement }), label });
  }
  return boxes;
};

/** Parameters of {@link listContentUnderControls}. */
interface ListContentUnderControlsParams {
  /** Page of the test, opened on the route to check. */
  page: Page;
  /** Boxes of the controls floating on the right edge of the screen. */
  controlBoxes: (ScreenBox | null)[];
}

/**
 * Lists the texts and controls of the `<main>` landmark that share some width with one of the
 * floating controls: since the controls are fixed and the page scrolls under them, each passes
 * under a control at some point.
 */
const listContentUnderControls = async ({ page, controlBoxes }: ListContentUnderControlsParams) => {
  const contentBoxes = await page.locator(PAGE_SELECTOR).evaluate(listContentBoxes);
  // Without any, a selector that matches nothing any more would let everything pass
  expect(contentBoxes.length, 'texts and controls found on the page').toBeGreaterThan(0);

  const isUnderControls = (box: ContentBox) =>
    controlBoxes.some(otherBox => doBoxesOverlapHorizontally({ box, otherBox }));
  return contentBoxes.filter(isUnderControls).map(({ label }) => label);
};

// jsdom computes no layout, so only a real browser sees the content of a page reach the column of
// the language toggle, the CV button and the GitHub icon, which float on the right edge from tablet
// up
for (const language of LANGUAGES) {
  for (const width of FLOATING_CONTROLS_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      for (const route of getCheckedRoutes({ pages: PAGES, language })) {
        test(`${route} keeps its content out of the column of the floating controls`, async ({
          page,
        }) => {
          await page.goto(route);
          // Measured before its chunk is loaded, a page would have no content to check
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // Its images, then the web fonts that replace the fallback font, change its layout
          await page.waitForLoadState('networkidle');
          await page.evaluate(async () => {
            await document.fonts.ready;
          });

          const translations = TRANSLATIONS[language];
          const controls = [
            page.getByRole('group', { name: translations.langToggle.label }),
            page.getByRole('link', { name: translations.cvLink.label }),
            page.getByRole('link', { name: translations.githubLink.label }),
          ];
          const controlBoxes = await Promise.all(controls.map(control => control.boundingBox()));
          expect(
            controlBoxes,
            'boxes of the language toggle, the CV button and the GitHub icon',
          ).not.toContain(null);

          expect(
            await listContentUnderControls({ page, controlBoxes }),
            'texts and controls under the language toggle, the CV button or the GitHub icon',
          ).toEqual([]);

          // "Show all" wraps the cards of a row onto as many rows as they need. A clicked button
          // becomes "Show less", so the first one left is clicked until none is
          const showAllButtons = page.getByRole('button', { name: SHOW_ALL_BUTTON_NAME });
          while ((await showAllButtons.count()) > 0) await showAllButtons.first().click();
          await page.locator(PAGE_SELECTOR).evaluate(waitForEndingAnimations);
          expect(
            await listContentUnderControls({ page, controlBoxes }),
            'texts and controls under the floating controls once every row is shown whole',
          ).toEqual([]);
        });
      }
    });
  }
}
