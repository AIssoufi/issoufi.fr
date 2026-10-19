import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants';
import { localizePath } from '../src/i18n/utils';
import experiencesData from '../src/pages/Experiences/.data/experiences.json' with { type: 'json' };
import type { ExperienceData } from '../src/pages/Experiences/types';
import {
  JOB_CARD_SELECTOR,
  MAX_CARD_PART_WIDTH_OFFSET_PX,
  SCREEN_HEIGHT_PX,
  STACKED_JOB_CARD_SCREEN_WIDTHS_PX,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
} from './constants';
import { isBoxBelow, type ScreenBox } from './utils';

/** Number of job cards of the page: one per job, company after company. */
const JOB_COUNT = (experiencesData.experiences as ExperienceData[]).flatMap(
  ({ roles = [] }) => roles,
).length;

/** Parts of a job card, measured in the browser by {@link measureCardParts}. */
interface CardParts {
  /** Title of the job, to name the card in a failure. */
  jobName: string;
  /** Boxes of the children of the card: its summary, its description, then its technologies. */
  parts: ScreenBox[];
}

/** Measures the children of each job card, in the order of the page. Runs in the browser. */
const measureCardParts = (cards: Element[]): CardParts[] =>
  cards.map(card => ({
    jobName: card.querySelector('h3')?.textContent ?? '',
    parts: [...card.children].map(child => {
      const { x, y, width, height } = child.getBoundingClientRect();
      return { x, y, width, height };
    }),
  }));

// jsdom lays out no box: only a real browser tells whether the description of a job card starts
// under its summary, or beside it, as the two columns that wide screens once showed put it, and
// whether it spans the card
for (const language of LANGUAGES) {
  for (const width of STACKED_JOB_CARD_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      // Measured where they rest, without the transitions of the page
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, reducedMotion: 'reduce' });

      test('each job card stacks its summary, its description and its technologies, as wide as the card', async ({
        page,
      }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        // Measured before the chunk of the page is loaded, there would be no card to measure
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        const cards = await page.locator(JOB_CARD_SELECTOR).evaluateAll(measureCardParts);

        expect(cards).toHaveLength(JOB_COUNT);
        for (const { jobName, parts } of cards) {
          // A summary and a description at least, so that the check cannot pass on an empty card
          expect.soft(parts.length, jobName).toBeGreaterThanOrEqual(2);
          // Each part after the summary, against the part before it
          for (const [index, box] of parts.slice(1).entries()) {
            // Soft, so that a failure reports every card, not only the first one
            expect
              .soft(isBoxBelow({ box, reference: parts[index] }), `part ${index + 1} of ${jobName}`)
              .toBe(true);
            // As wide as the summary, so that no measure narrows the description again
            expect
              .soft(
                Math.abs(box.width - parts[0].width),
                `width of part ${index + 1} of ${jobName} against its summary`,
              )
              .toBeLessThanOrEqual(MAX_CARD_PART_WIDTH_OFFSET_PX);
          }
        }
      });
    });
  }
}
