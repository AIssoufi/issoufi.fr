import { expect, test, type Locator, type Page } from '@playwright/test';

import { DEFAULT_LANGUAGE } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import { fr } from '../src/i18n/fr';
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { PAGE_SIZE } from '../src/pages/Projects/Project/constants';
import {
  MAX_CARD_OFFSET_PX,
  PROJECT_CARD_SCREEN_WIDTHS_PX,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
} from './constants';
import { type CardBox, countWholeCards, groupCardsIntoRows } from './utils';

/** Texts of the Projects page in the language of a first visit, which the tests open it in. */
const { projects: texts } = { fr, en }[DEFAULT_LANGUAGE];

/** Sections of the Projects page, with the projects that each one shows, in order. */
const SECTIONS = [
  { title: texts.personal, projects: personalProjectsData.projects },
  { title: texts.freelance, projects: freelanceProjectsData.projects },
];

/** Layout of the list of cards of a section, measured by {@link measureCardList}. */
interface CardListLayout {
  /** Box of the list, the part of it that the screen shows. */
  list: CardBox;
  /** Box of each card, in the order of the page. */
  cards: CardBox[];
  /** Width of everything the list holds, wider than the list when it scrolls sideways. */
  scrollWidth: number;
  /** Width that the list shows. */
  clientWidth: number;
}

/**
 * Measures the list of cards of a section, in page coordinates, so that scrolling to a button
 * moves nothing. The box of a card leaves out its padding: the page gutter that pads the first and
 * the last card of the row on a phone, outside the card that the visitor sees.
 */
const measureCardList = (list: Locator): Promise<CardListLayout> =>
  list.evaluate(listElement => {
    const toPageBox = ({ left, top, width, height }: DOMRect) => ({
      left: left + window.scrollX,
      top: top + window.scrollY,
      width,
      height,
    });
    const cards = [...listElement.children].map(card => {
      const box = toPageBox(card.getBoundingClientRect());
      const { paddingLeft, paddingRight } = getComputedStyle(card);
      const padding = { left: parseFloat(paddingLeft), right: parseFloat(paddingRight) };
      return {
        ...box,
        left: box.left + padding.left,
        width: box.width - padding.left - padding.right,
      };
    });
    const { scrollWidth, clientWidth } = listElement;
    return {
      list: toPageBox(listElement.getBoundingClientRect()),
      cards,
      scrollWidth,
      clientWidth,
    };
  });

/** Parameters of {@link openSection}. */
interface OpenSectionParams {
  /** Browser page of the test. */
  page: Page;
  /** Title of the section, as the page shows it. */
  title: string;
}

/**
 * Opens the Projects page and waits until the cards of a section can be measured: shown, in the
 * web fonts that set where their texts wrap.
 *
 * @returns The section, its list of cards and its cards.
 */
const openSection = async ({ page, title }: OpenSectionParams) => {
  await page.goto(PROJECTS_ROUTE);
  // In another language, the texts of the tests would name no section and no button
  await expect(page.locator('html')).toHaveAttribute('lang', DEFAULT_LANGUAGE);
  const section = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name: title }),
  });
  const list = section.getByRole('list');
  const cards = list.getByRole('listitem');
  // Measured before the chunk of the page is loaded, there would be no card to measure
  await expect(cards.first()).toBeVisible();
  // The web fonts that replace the fallback font change where the text of a card wraps
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return { section, list, cards };
};

/** Parameters of {@link expectSameLength}. */
interface ExpectSameLengthParams {
  /** Measured length, in pixels. */
  actual: number;
  /** Length it should match, in pixels. */
  expected: number;
  /** What is measured, for the failure message. */
  name: string;
}

/**
 * Expects a length to match another up to {@link MAX_CARD_OFFSET_PX} of subpixel rounding. Soft,
 * so that a failure reports every card that differs, not only the first one.
 */
const expectSameLength = ({ actual, expected, name }: ExpectSameLengthParams) => {
  expect
    .soft(Math.abs(actual - expected), `${name}: ${actual} px, expected ${expected} px`)
    .toBeLessThanOrEqual(MAX_CARD_OFFSET_PX);
};

// jsdom computes no layout, so only a real browser sees the size and the place of each card. The
// cards show the project data, which is not translated: one language is enough.
for (const width of PROJECT_CARD_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    for (const { title, projects } of SECTIONS) {
      test(`"Show all" keeps the cards of the row of "${title}", on as many rows as needed`, async ({
        page,
      }) => {
        const { section, list, cards } = await openSection({ page, title });
        const row = await measureCardList(list);
        const showAllName = texts.showAll.replace('{{count}}', String(projects.length));
        await section.getByRole('button', { name: showAllName }).click();
        await expect(cards, 'cards shown by "Show all"').toHaveCount(projects.length);
        const all = await measureCardList(list);

        expect(all.scrollWidth, 'width of the cards in px, expected to fit in the list').toBe(
          all.clientWidth,
        );
        const pageWidths = await page.evaluate(() => {
          const { scrollWidth, clientWidth } = document.documentElement;
          return { scrollWidth, clientWidth };
        });
        expect(pageWidths.scrollWidth, 'page width in px, expected to match the screen').toBe(
          pageWidths.clientWidth,
        );

        // As many columns as the row shows whole cards: three, or fewer where the row scrolls
        const columnCount = countWholeCards({ cards: row.cards, container: row.list });
        const rows = groupCardsIntoRows({ cards: all.cards });
        expect(columnCount, 'cards that the row shows whole').toBeGreaterThan(0);
        expect(rows[0], 'cards on the first row of "Show all"').toHaveLength(columnCount);
        expect(rows, 'rows of "Show all"').toHaveLength(Math.ceil(projects.length / columnCount));

        all.cards.forEach((card, index) => {
          expectSameLength({
            actual: card.width,
            expected: row.cards[0].width,
            name: `width of card ${index + 1}`,
          });
        });
        // The cards of the row show the first projects, whose texts set their height
        row.cards.forEach((rowCard, index) => {
          expectSameLength({
            actual: all.cards[index].height,
            expected: rowCard.height,
            name: `height of card ${index + 1}`,
          });
        });
        // Every row starts on the left, the last one too, with its cards under those of the first
        rows.forEach((cardsOfRow, rowIndex) => {
          cardsOfRow.forEach((card, column) => {
            expectSameLength({
              actual: card.left,
              expected: rows[0][column].left,
              name: `left of card ${column + 1} of row ${rowIndex + 1}`,
            });
          });
        });

        await section.getByRole('button', { name: texts.showLess }).click();
        await expect(cards, 'cards of the row').toHaveCount(Math.min(projects.length, PAGE_SIZE));
        expect(await measureCardList(list), 'row shown again by "Show less"').toEqual(row);
      });

      test(`the last page of the row of "${title}" starts on the left, like the first one`, async ({
        page,
      }) => {
        const { section, list, cards } = await openSection({ page, title });
        const firstPage = await measureCardList(list);
        const pageCount = Math.ceil(projects.length / PAGE_SIZE);
        // With a single page, the test would compare the first page with itself
        expect(pageCount, 'pages of the row').toBeGreaterThan(1);
        const lastPageStart = (pageCount - 1) * PAGE_SIZE;
        for (let pageIndex = 1; pageIndex < pageCount; pageIndex += 1) {
          await section.getByRole('button', { name: texts.nextPage }).click();
        }
        // A last page as full as the first one would show the same number of cards before the click
        await expect(cards.first(), 'first card of the last page').toContainText(
          projects[lastPageStart].name,
        );
        await expect(cards, 'cards of the last page').toHaveCount(projects.length - lastPageStart);
        const lastPage = await measureCardList(list);

        // Each card is where the card of the same column is on the first page, with its width
        lastPage.cards.forEach((card, column) => {
          expectSameLength({
            actual: card.left,
            expected: firstPage.cards[column].left,
            name: `left of card ${column + 1} of the last page`,
          });
          expectSameLength({
            actual: card.width,
            expected: firstPage.cards[column].width,
            name: `width of card ${column + 1} of the last page`,
          });
        });
      });
    }
  });
}
