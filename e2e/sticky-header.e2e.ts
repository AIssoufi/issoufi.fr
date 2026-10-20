import { expect, type Locator, test } from '@playwright/test';

import { LANGUAGES, ROOT_PATH } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { waitForEndingAnimations } from './animations.ts';
import {
  LONG_PAGE_ROUTE,
  MAX_BAND_OFFSET_PX,
  MAX_HEADER_SCREEN_SHARE,
  PAGE_SELECTOR,
  PROJECTS_ROUTE,
  SHORT_SCREENS,
  STICKY_HEADER_SCREEN_HEIGHT_PX,
  STICKY_HEADER_SCREEN_WIDTHS_PX,
} from './constants.ts';
import { showAllProjects } from './projects.ts';
import { scrollToEnd } from './scroll.ts';
import { isBoxInside } from './utils.ts';

/** The long pages, scrolled to their end: the Experiences page and the Projects page. */
const LONG_PAGE_PATHS = [LONG_PAGE_ROUTE, PROJECTS_ROUTE] as const;

/** Text of the logo, which links to the home page. */
const LOGO_TEXT = 'AI';

/**
 * Measures the blurred band of the header, its `::after`, which the DOM gives no box for: its top
 * and its height as laid out, in CSS pixels. Runs in the browser.
 */
const getBandBox = (header: Element) => {
  const { top, height } = getComputedStyle(header, '::after');
  return { top: Number.parseFloat(top), height: Number.parseFloat(height) };
};

/**
 * Checks that the blurred band of the header has the top and the height of the header, within
 * {@link MAX_BAND_OFFSET_PX}, so that it never blurs the page alone.
 */
const expectBandOnHeader = async (header: Locator) => {
  const headerBox = await header.boundingBox();
  const bandBox = await header.evaluate(getBandBox);
  expect(
    Math.abs(bandBox.top - (headerBox?.y ?? Number.NaN)),
    'distance in px from the top of the blurred band to the top of the header',
  ).toBeLessThanOrEqual(MAX_BAND_OFFSET_PX);
  expect(
    Math.abs(bandBox.height - (headerBox?.height ?? Number.NaN)),
    'difference in px between the height of the blurred band and that of the header',
  ).toBeLessThanOrEqual(MAX_BAND_OFFSET_PX);
};

/**
 * Lists the boxes of the links and buttons shown in the row of the header, such as the logo, the
 * burger or the navigation links, leaving out the controls fixed elsewhere on the screen, such as
 * the language toggle floating on the right edge from the tablet breakpoint. Runs in the browser,
 * so it uses nothing from outside its own body.
 */
const listHeaderRowControlBoxes = (header: Element) => {
  const hasFixedAncestorInHeader = (element: Element) => {
    for (let current = element.parentElement; current && current !== header;) {
      if (getComputedStyle(current).position === 'fixed') return true;
      current = current.parentElement;
    }
    return false;
  };
  const isShownInHeaderRow = (control: Element) =>
    control.checkVisibility() && !hasFixedAncestorInHeader(control);

  return [...header.querySelectorAll('a, button')].filter(isShownInHeaderRow).map(control => {
    const { x, y, width, height } = control.getBoundingClientRect();
    return { label: control.textContent?.trim() || control.localName, x, y, width, height };
  });
};

// jsdom computes no layout and scrolls nothing, so only a real browser sees the header leave the
// screen, or its band blur the page alone
for (const language of LANGUAGES) {
  for (const width of STICKY_HEADER_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: STICKY_HEADER_SCREEN_HEIGHT_PX } });

      for (const path of LONG_PAGE_PATHS) {
        const route = localizePath({ path, language });

        test(`the header stays on the screen and usable down to the end of ${route}`, async ({
          page,
        }) => {
          await page.goto(route);
          await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
          // "Show all" wraps the cards of each row of the Projects page onto as many rows as they
          // need, which makes it as long as it gets
          if (path === PROJECTS_ROUTE) await showAllProjects(page);
          await page.locator(PAGE_SELECTOR).evaluate(waitForEndingAnimations);

          // The header used to leave the screen after one screen of scrolling
          expect(await page.evaluate(scrollToEnd), 'scroll position at the end').toBeGreaterThan(
            STICKY_HEADER_SCREEN_HEIGHT_PX,
          );
          const header = page.getByRole('banner');
          await expect(header).toBeInViewport({ ratio: 1 });
          const headerBox = await header.boundingBox();
          expect(headerBox?.y, 'top of the header').toBe(0);
          await expectBandOnHeader(header);

          // Checked in place first, since a click would scroll a link off the screen back into it
          const logo = header.getByRole('link', { name: LOGO_TEXT, exact: true });
          await expect(logo).toBeInViewport({ ratio: 1 });
          await logo.click();
          await expect(page).toHaveURL(localizePath({ path: ROOT_PATH, language }));
        });
      }
    });
  }
}

for (const language of LANGUAGES) {
  for (const viewport of SHORT_SCREENS) {
    test.describe(`in ${language}, on a ${viewport.width} × ${viewport.height} px screen`, () => {
      test.use({ viewport });

      test('the compact header leaves most of the screen to the page, and holds its controls whole', async ({
        page,
      }) => {
        await page.goto(localizePath({ path: LONG_PAGE_ROUTE, language }));
        await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
        const header = page.getByRole('banner');
        const headerBox = await header.boundingBox();

        expect(headerBox?.height, 'height of the header').toBeLessThanOrEqual(
          viewport.height * MAX_HEADER_SCREEN_SHARE,
        );
        await expectBandOnHeader(header);
        const controlBoxes = await header.evaluate(listHeaderRowControlBoxes);
        // The logo, then the burger or the navigation links: fewer would mean a broken selector
        expect(controlBoxes.length, 'links and buttons of the header row').toBeGreaterThan(1);
        for (const { label, ...box } of controlBoxes) {
          expect(
            isBoxInside({ box, container: headerBox }),
            `box of "${label}", whole in the header: ${JSON.stringify(box)}`,
          ).toBe(true);
        }
      });
    });
  }
}
