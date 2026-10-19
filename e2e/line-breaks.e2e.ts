import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import { HOME_PAGE } from '../src/utils/pages.ts';
import {
  HERO_PASSION_SELECTOR,
  HERO_SUBTITLE_SELECTOR,
  LINE_BREAK_SCREEN_WIDTHS_PX,
  PAGE_SELECTOR,
  PROJECT_CARD_SCREEN_WIDTHS_PX,
  PROJECT_TOOLS_SELECTOR,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
} from './constants.ts';
import { showAllProjects } from './projects.ts';
import {
  findDetachedDepartmentLines,
  findSingleWordLines,
  findWrappedSeparatorItems,
  groupLines,
  listDrawnCharacters,
  listDrawnItemEnds,
} from './text.ts';

// jsdom lays out no line: only a real browser tells where the lines of a text wrap
for (const language of LANGUAGES) {
  for (const width of LINE_BREAK_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, reducedMotion: 'reduce' });

      test('no line of the passion or the subtitle of the home page holds a single word', async ({
        page,
      }) => {
        await page.goto(localizePath({ path: HOME_PAGE.path, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator(HERO_SUBTITLE_SELECTOR)).toBeVisible();
        // The lines wrap where the web font puts them, once it is loaded
        await page.evaluate(() => document.fonts.ready);

        const passionCharacters = await page
          .locator(HERO_PASSION_SELECTOR)
          .evaluate(listDrawnCharacters);
        const subtitleCharacters = await page
          .locator(HERO_SUBTITLE_SELECTOR)
          .evaluate(listDrawnCharacters);
        const lines = [...groupLines(passionCharacters), ...groupLines(subtitleCharacters)];

        // Empty texts would hold no word alone either
        expect(lines.length).toBeGreaterThanOrEqual(2);
        expect(findSingleWordLines(lines)).toEqual([]);
      });

      test('no department of the Experiences page wraps away from its city', async ({ page }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const characters = await page.locator(PAGE_SELECTOR).evaluate(listDrawnCharacters);
        const lines = groupLines(characters);

        // A page without text would wrap no department either
        expect(lines.length).toBeGreaterThan(0);
        expect(findDetachedDepartmentLines(lines)).toEqual([]);
      });
    });
  }
}

// The tools of a card wrap in every layout of the cards, since a card of three columns on a laptop
// is hardly wider than a phone
for (const language of LANGUAGES) {
  for (const width of PROJECT_CARD_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, reducedMotion: 'reduce' });

      test('no line of the tools of a project card starts with the dot between two tools', async ({
        page,
      }) => {
        await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await showAllProjects(page);
        await page.evaluate(() => document.fonts.ready);

        const itemEnds = await page.locator(PROJECT_TOOLS_SELECTOR).evaluateAll(listDrawnItemEnds);

        // A page without tools would wrap no dot either
        expect(itemEnds.length).toBeGreaterThan(0);
        expect(findWrappedSeparatorItems(itemEnds)).toEqual([]);
      });
    });
  }
}
