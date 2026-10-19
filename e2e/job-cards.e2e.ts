import { expect, test } from '@playwright/test';

import { LANGUAGES } from '../src/i18n/constants.ts';
import { localizePath } from '../src/i18n/utils.ts';
import experiencesData from '../src/pages/Experiences/.data/experiences.json' with { type: 'json' };
import { MIN_TITLE_WIDTH_PX } from '../src/pages/Experiences/Project/constants.ts';
import type { ExperienceData } from '../src/pages/Experiences/types.ts';
import {
  JOB_CARD_SELECTOR,
  MAX_CARD_PART_WIDTH_OFFSET_PX,
  PROJECT_HEADER_SCREEN_WIDTHS_PX,
  PROJECT_HEADER_SELECTOR,
  SCREEN_HEIGHT_PX,
  STACKED_JOB_CARD_SCREEN_WIDTHS_PX,
  TIMELINE_LINE_ATTRIBUTE,
  TIMELINE_ROUTE,
} from './constants.ts';
import { isBoxBelow, isBoxInside, type ScreenBox } from './utils.ts';

/** Every job of the page, company after company, in the order of the page. */
const ROLES = (experiencesData.experiences as ExperienceData[]).flatMap(({ roles = [] }) => roles);

/** Number of job cards of the page: one per job, company after company. */
const JOB_COUNT = ROLES.length;

/** Number of state badges of the page: one per project that has a state. */
const STATE_BADGE_COUNT = ROLES.flatMap(({ projects = [] }) => projects).filter(
  ({ stateKey }) => stateKey,
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

/** Header of a project of a job card, measured in the browser by {@link measureProjectHeaders}. */
interface ProjectHeader {
  /** Title of the project, to name it in a failure. */
  projectName: string;
  /** Box of the title of the project. */
  title: ScreenBox | null;
  /** Box of the state badge of the project, or `null` when it has none. */
  badge: ScreenBox | null;
  /** Content box of the job card that holds the project, inside its borders and its padding. */
  cardContent: ScreenBox;
}

/**
 * Measures the header of each project of the job cards, in the order of the page, found with the
 * selector that Playwright passes after the cards. Runs in the browser.
 */
const measureProjectHeaders = (
  cards: Element[],
  projectHeaderSelector: string,
): ProjectHeader[] => {
  const measure = (element?: Element | null): ScreenBox | null => {
    if (!element) return null;

    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };

  return cards.flatMap(card => {
    const { x, y, width, height } = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const left = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const right = parseFloat(style.borderRightWidth) + parseFloat(style.paddingRight);
    const top = parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
    const bottom = parseFloat(style.borderBottomWidth) + parseFloat(style.paddingBottom);
    const cardContent = {
      x: x + left,
      y: y + top,
      width: width - left - right,
      height: height - top - bottom,
    };

    return [...card.querySelectorAll(projectHeaderSelector)].map(header => {
      const title = header.querySelector(':scope > h4');
      return {
        projectName: title?.textContent ?? '',
        title: measure(title),
        badge: measure(header.querySelector(':scope > span')),
        cardContent,
      };
    });
  });
};

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

  // Only a real browser wraps the header of a project: on the narrowest phones, a badge kept
  // beside its title once squeezed the title onto 4 to 6 lines and crossed the edge of its card
  for (const width of PROJECT_HEADER_SCREEN_WIDTHS_PX) {
    test.describe(`in ${language}, on a ${width} px wide screen`, () => {
      test.use({ viewport: { width, height: SCREEN_HEIGHT_PX }, reducedMotion: 'reduce' });

      test(`each state badge of a project stays inside its job card, and leaves its title at least ${MIN_TITLE_WIDTH_PX} px`, async ({
        page,
      }) => {
        await page.goto(localizePath({ path: TIMELINE_ROUTE, language }));
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator(`[${TIMELINE_LINE_ATTRIBUTE}]`)).toBeVisible();
        // The web font sets the widths of the titles and the badges, once it is loaded
        await page.evaluate(() => document.fonts.ready);

        const headers = await page
          .locator(JOB_CARD_SELECTOR)
          .evaluateAll(measureProjectHeaders, PROJECT_HEADER_SELECTOR);

        // Every badge of the data, so that the check cannot pass on a page without them
        expect(headers.filter(({ badge }) => badge)).toHaveLength(STATE_BADGE_COUNT);
        for (const { projectName, title, badge, cardContent } of headers) {
          // Soft, so that a failure reports every project, not only the first one
          expect
            .soft(title?.width, `width of the title of ${projectName}`)
            .toBeGreaterThanOrEqual(MIN_TITLE_WIDTH_PX);
          if (!badge) continue;

          const boxes = `${JSON.stringify(badge)} in ${JSON.stringify(cardContent)}`;
          expect
            .soft(
              isBoxInside({ box: badge, container: cardContent }),
              `badge of ${projectName}: ${boxes}`,
            )
            .toBe(true);
        }
      });
    });
  }
}
