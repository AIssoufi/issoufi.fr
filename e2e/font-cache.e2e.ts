import { expect, test } from '@playwright/test';

import { FONT_FILE_FORMAT } from '../src/theme/constants.ts';
import { PAGE_SELECTOR, TIMELINE_ROUTE } from './constants.ts';
import { waitForPageContent } from './loading.ts';

/** Times the test loads the page in one tab: the first load downloads the fonts, not the next. */
const LOAD_COUNT = 3;

/**
 * Bytes that the page received for each request of a web font, from its Resource Timing: `0` for a
 * font that the browser read from its cache. Runs in the browser, passed to `page.evaluate`, so it
 * uses nothing from outside its own body.
 */
const readFontTransferSizes = (fileFormat: string) => {
  const isFontFile = (entry: PerformanceEntry) =>
    new URL(entry.name).pathname.endsWith(`.${fileFormat}`);
  return performance
    .getEntriesByType('resource')
    .filter(isFontFile)
    .map(entry => (entry as PerformanceResourceTiming).transferSize);
};

// The browser keeps each font of assets/ a year (HEADER_RULES, vite/constants.ts). The preload of
// a page requests it with an Origin header, and WebKit requests it again for its @font-face
// without one: a Vary: Origin in the answer, which Cloudflare Pages does not send, made the memory
// cache of WebKit drop the font at each load, which downloaded it again
test(`${TIMELINE_ROUTE} downloads its web fonts on its first load only, of ${LOAD_COUNT}`, async ({
  page,
}) => {
  const transferSizesPerLoad: number[][] = [];
  for (let load = 0; load < LOAD_COUNT; load += 1) {
    await page.goto(TIMELINE_ROUTE);
    await expect(page.locator(PAGE_SELECTOR)).toBeVisible();
    await page.evaluate(waitForPageContent);
    transferSizesPerLoad.push(await page.evaluate(readFontTransferSizes, FONT_FILE_FORMAT));
  }

  const [firstLoadSizes, ...nextLoadsSizes] = transferSizesPerLoad;
  const downloadedSizes = nextLoadsSizes.flat().filter(size => size > 0);
  // A browser that measured no download at all would let the next check pass without proof
  expect(Math.max(0, ...firstLoadSizes), 'bytes of the fonts of the first load').toBeGreaterThan(0);
  expect(downloadedSizes, 'bytes of the fonts downloaded again').toEqual([]);
});
