import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import { getEntries } from '../src/i18n/testUtils';
import type { Language, Translations } from '../src/i18n/types';
import { localizePath } from '../src/i18n/utils';
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { getProjectLinkUrl } from '../src/pages/Projects/Project/utils';
import type { ProjectData } from '../src/pages/Projects/types';
import { listTechnologyNames } from '../src/utils/technologies';
import { countBrowserNodes, listBrowserHeadingLevels, listBrowserTexts } from './accessibility';
import {
  PAGE_SELECTOR,
  PROJECT_CARD_SELECTOR,
  PROJECT_READING_SCREEN_WIDTHS_PX,
  PROJECT_TOOLS_SELECTOR,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
  SHOW_ALL_BUTTON_NAME,
  TOOL_SEPARATOR,
} from './constants';
import { countOccurrences, findSkippedHeadingLevels } from './utils';

/** Translations of each language, to name the cards as the page does. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Projects of the page, in its order: the personal section, then the freelance one. */
const PROJECTS: ProjectData[] = [
  ...personalProjectsData.projects,
  ...freelanceProjectsData.projects,
];

/** Number of sections of the page, each named by a level 2 heading. */
const SECTION_COUNT = 2;

// jsdom computes no accessibility tree: only a real browser tells what screen readers read of a
// card, without its thumbnail and the dots between its tools
for (const language of LANGUAGES) {
  const texts = new Map(getEntries({ value: TRANSLATIONS[language] }));
  const newTabNotice = TRANSLATIONS[language].newTabLink.notice;
  const cards = PROJECTS.map(({ nameKey, url, tools }) => {
    const name = texts.get(`projects.names.${nameKey}`) ?? '';
    return { name, isLinked: Boolean(getProjectLinkUrl({ url, name })), tools };
  });

  for (const width of PROJECT_READING_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test.beforeEach(async ({ page }) => {
        await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
        // A route that lost its language would test the default language twice
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // Every card, once its chunk is loaded: a clicked "Show all" becomes "Show less"
        const showAllButtons = page.getByRole('button', { name: SHOW_ALL_BUTTON_NAME });
        await expect(showAllButtons.first()).toBeVisible();
        while ((await showAllButtons.count()) > 0) await showAllButtons.first().click();
        await expect(page.locator(PROJECT_CARD_SELECTOR)).toHaveCount(cards.length);
      });

      test('each card is a level 3 heading, under the heading of its section', async ({ page }) => {
        const session = await page.context().newCDPSession(page);
        const levels = await listBrowserHeadingLevels({ session, selector: PAGE_SELECTOR });
        const countLevel = (level: number) => levels.filter(heading => heading === level).length;

        expect(findSkippedHeadingLevels(levels), `heading levels: ${levels.join(', ')}`).toEqual(
          [],
        );
        expect(countLevel(1), 'level 1 headings, the page title').toBe(1);
        expect(countLevel(2), 'level 2 headings, one per section').toBe(SECTION_COUNT);
        expect(countLevel(3), 'level 3 headings, one per card').toBe(cards.length);
      });

      test('each card reads its name once, and says when its link opens a new tab', async ({
        page,
      }) => {
        const session = await page.context().newCDPSession(page);
        const readTexts = await listBrowserTexts({ session, selector: PROJECT_CARD_SELECTOR });
        const imageCounts = await countBrowserNodes({
          session,
          selector: PROJECT_CARD_SELECTOR,
          role: 'image',
        });

        for (const [index, { name, isLinked }] of cards.entries()) {
          const readText = readTexts[index];
          // Soft, so that a failure reports every card, not only the first one
          expect
            .soft(countOccurrences({ text: readText, searched: name }), `"${name}" in: ${readText}`)
            .toBe(1);
          expect.soft(imageCounts[index], `images read in the card of ${name}`).toBe(0);
          expect
            .soft(countOccurrences({ text: readText, searched: `${name} ${newTabNotice}` }), name)
            .toBe(isLinked ? 1 : 0);
        }
      });

      test('each card lists its tools, without the dots between them', async ({ page }) => {
        const session = await page.context().newCDPSession(page);
        const readTexts = await listBrowserTexts({ session, selector: PROJECT_CARD_SELECTOR });
        const toolCounts = await countBrowserNodes({
          session,
          selector: PROJECT_TOOLS_SELECTOR,
          role: 'listitem',
        });

        // A card without tools shows no list
        const expectedCounts = cards
          .map(({ tools }) => listTechnologyNames(tools).length)
          .filter(count => count > 0);
        expect(toolCounts).toEqual(expectedCounts);
        for (const [index, { name }] of cards.entries()) {
          expect
            .soft(readTexts[index], `text read in the card of ${name}`)
            .not.toContain(TOOL_SEPARATOR);
        }
      });
    });
  }
}
