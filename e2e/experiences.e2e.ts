import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { en } from '../src/i18n/en.ts';
import { fr } from '../src/i18n/fr.ts';
import { getEntries } from '../src/i18n/testUtils.ts';
import type { Language, Translations } from '../src/i18n/types.ts';
import { localizePath } from '../src/i18n/utils.ts';
import experiencesData from '../src/pages/Experiences/.data/experiences.json' with { type: 'json' };
import type { ExperienceData } from '../src/pages/Experiences/types.ts';
import { listBrowserHeadingLevels, listBrowserTexts } from './accessibility.ts';
import {
  DECORATION_PATTERN,
  EXPERIENCES_SCREEN_WIDTHS_PX,
  JOB_ROW_SELECTOR,
  PAGE_SELECTOR,
  SCREEN_HEIGHT_PX,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
} from './constants.ts';
import { countOccurrences, findSkippedHeadingLevels } from './utils.ts';

/** Translations of each language, to find the dates of the jobs by their keys. */
const TRANSLATIONS = { fr, en } satisfies Record<Language, Translations>;

/** Companies of the timeline, most recent first, as the page reads them. */
const EXPERIENCES: ExperienceData[] = experiencesData.experiences;

/** Every job of the timeline, company after company, in the order of the page. */
const ROLES = EXPERIENCES.flatMap(({ roles = [] }) => roles);

/** Number of headings of each level that the page has: the companies, the jobs and the projects. */
const HEADING_COUNTS = {
  2: EXPERIENCES.length,
  3: ROLES.length,
  4: ROLES.flatMap(({ projects = [] }) => projects).filter(({ titleKey }) => titleKey).length,
};

// jsdom ignores the media queries that show the period of a job in its card below the tablet
// breakpoint and in the timeline from it, and computes no accessibility tree: only a real
// browser tells what the screen shows, and what screen readers read, at each width
for (const language of LANGUAGES) {
  const texts = new Map(getEntries({ value: TRANSLATIONS[language] }));
  const periodTo = texts.get('exp.periodTo');

  for (const width of EXPERIENCES_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

      test.beforeEach(async ({ page }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        // A route that lost its language would test the default language twice
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // Read before the chunk of the page is loaded, there would be no timeline to read
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();
      });

      test('every job shows its start and its end, read once as one period', async ({ page }) => {
        const jobRows = page.locator(JOB_ROW_SELECTOR);
        await expect(jobRows).toHaveCount(ROLES.length);
        const session = await page.context().newCDPSession(page);
        const readTexts = await listBrowserTexts({ session, selector: JOB_ROW_SELECTOR });

        for (const [index, { startKey, endKey }] of ROLES.entries()) {
          const start = texts.get(startKey ?? '') ?? '';
          const end = texts.get(endKey ?? '') ?? '';
          const jobRow = jobRows.nth(index);
          // Soft, so that a failure reports every job, not only the first one
          await expect
            .soft(jobRow.getByText(start, { exact: true }).filter({ visible: true }), start)
            .toHaveCount(1);
          await expect
            .soft(jobRow.getByText(end, { exact: true }).filter({ visible: true }), end)
            .toHaveCount(1);
          const period = `${start} ${periodTo} ${end}`;
          expect
            .soft(
              countOccurrences({ text: readTexts[index], searched: period }),
              `times "${period}" is read in: ${readTexts[index]}`,
            )
            .toBe(1);
        }
      });

      test('screen readers read no arrow, dash or chevron of the decorations', async ({ page }) => {
        const session = await page.context().newCDPSession(page);
        const [readText = ''] = await listBrowserTexts({ session, selector: PAGE_SELECTOR });

        // An empty page would read no decoration either
        expect(readText).toContain(texts.get('exp.pageTitle'));
        expect(readText.match(DECORATION_PATTERN), readText).toBeNull();
      });

      test('the headings follow each other level by level', async ({ page }) => {
        const session = await page.context().newCDPSession(page);
        const levels = await listBrowserHeadingLevels({ session, selector: PAGE_SELECTOR });
        const countLevel = (level: number) => levels.filter(heading => heading === level).length;

        expect(findSkippedHeadingLevels(levels), `heading levels: ${levels.join(', ')}`).toEqual(
          [],
        );
        expect(countLevel(1), 'level 1 headings, the page title').toBe(1);
        expect(countLevel(2), 'level 2 headings, one per company').toBe(HEADING_COUNTS[2]);
        expect(countLevel(3), 'level 3 headings, one per job').toBe(HEADING_COUNTS[3]);
        expect(countLevel(4), 'level 4 headings, one per project').toBe(HEADING_COUNTS[4]);
      });
    });
  }
}
