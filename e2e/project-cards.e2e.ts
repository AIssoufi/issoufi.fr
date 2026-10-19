import { expect, test, type Locator, type Page } from '@playwright/test';

import { DEFAULT_LANGUAGE, LANGUAGES } from '../src/i18n/constants';
import { en } from '../src/i18n/en';
import type { Language } from '../src/i18n/types';
import { fr } from '../src/i18n/fr';
import { localizePath } from '../src/i18n/utils';
import freelanceProjectsData from '../src/pages/Projects/.data/freelance-projects.json' with { type: 'json' };
import personalProjectsData from '../src/pages/Projects/.data/personal-projects.json' with { type: 'json' };
import { ROW_CARD_COUNT } from '../src/pages/Projects/Project/constants';
import type { ProjectItemData } from '../src/pages/Projects/Project/types';
import { getThumbnailSources } from '../src/pages/Projects/Project/utils';
import {
  MAX_CARD_OFFSET_PX,
  PROJECT_CARD_SCREEN_WIDTHS_PX,
  PROJECTS_ROUTE,
  SCREEN_HEIGHT_PX,
} from './constants';
import { type CardBox, countWholeCards, filterWholeCards, groupCardsIntoRows } from './utils';

/** Texts of the Projects page in each language. */
const TEXTS = { fr: fr.projects, en: en.projects };

/** Texts of the Projects page in the language of a first visit, which most tests open it in. */
const texts = TEXTS[DEFAULT_LANGUAGE];

/** `src` of the screenshot of a project on its card, which names the card. */
const getThumbnailUrl = ({ thumbnails }: Pick<ProjectItemData, 'thumbnails'>) =>
  getThumbnailSources(thumbnails)?.src ?? '';

/**
 * Sections of the Projects page, with their title in each language and the projects that each one
 * shows, in order.
 */
const SECTIONS = [
  { titleKey: 'personal', projects: personalProjectsData.projects },
  { titleKey: 'freelance', projects: freelanceProjectsData.projects },
] as const;

/** Box of a card, with the URL of the screenshot it shows, which names its project. */
interface ProjectCardBox extends CardBox {
  /** `src` of the screenshot of the card, the widest of the `thumbnails` of its project. */
  imageUrl: string;
}

/** Layout of the list of cards of a section, measured by {@link measureCardList}. */
interface CardListLayout {
  /** Box of the list, the part of it that the screen shows. */
  list: CardBox;
  /** Box of each card, in the order of the page. */
  cards: ProjectCardBox[];
  /** Width of everything the list holds, wider than the list when it scrolls sideways. */
  scrollWidth: number;
  /** Width that the list shows. */
  clientWidth: number;
}

/**
 * Measures the list of cards of a section, in page coordinates, so that scrolling to a button
 * moves nothing.
 */
const measureCardList = (list: Locator): Promise<CardListLayout> =>
  list.evaluate(listElement => {
    const toPageBox = ({ left, top, width, height }: DOMRect) => ({
      left: left + window.scrollX,
      top: top + window.scrollY,
      width,
      height,
    });
    const cards = [...listElement.children].map(card => ({
      ...toPageBox(card.getBoundingClientRect()),
      imageUrl: card.querySelector('img')?.getAttribute('src') ?? '',
    }));
    const { scrollWidth, clientWidth } = listElement;
    return {
      list: toPageBox(listElement.getBoundingClientRect()),
      cards,
      scrollWidth,
      clientWidth,
    };
  });

/** Lists the screenshots of the cards that the row of a section shows whole, from left to right. */
const readWholeCardImages = async (list: Locator) => {
  const { cards, list: container } = await measureCardList(list);
  return filterWholeCards({ cards, container }).map(({ imageUrl }) => imageUrl);
};

/** Parameters of {@link openSection}. */
interface OpenSectionParams {
  /** Browser page of the test. */
  page: Page;
  /** Title of the section, as the page shows it in `language`. */
  title: string;
  /** Language to open the page in, one of `LANGUAGES`. @default DEFAULT_LANGUAGE */
  language?: Language;
}

/**
 * Opens the Projects page in a language and waits until the cards of a section can be measured:
 * shown, in the web fonts that set where their texts wrap.
 *
 * @returns The section, its list of cards and its cards.
 */
const openSection = async ({ page, title, language = DEFAULT_LANGUAGE }: OpenSectionParams) => {
  await page.goto(localizePath({ path: PROJECTS_ROUTE, language }));
  // In another language, the texts of the tests would name no section and no button
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  const section = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name: title }),
  });
  // The list of cards, before the list of tools of each card
  const list = section.getByRole('list').first();
  const cards = list.locator(':scope > li');
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

/** Parameters of {@link collectPageImages}. */
interface CollectPageImagesParams {
  /** List of cards of the section. */
  list: Locator;
  /** Arrow that moves the row to the next page in the direction of the test. */
  arrow: Locator;
  /** Most pages to go through, so that an arrow that never stops fails the test. */
  maxPageCount: number;
}

/**
 * Reads the cards that the row shows whole, then presses the arrow and reads them again, until the
 * arrow is disabled at the last page in its direction.
 *
 * @returns The screenshots of the whole cards of each page, in the order the pages were shown.
 */
const collectPageImages = async ({ list, arrow, maxPageCount }: CollectPageImagesParams) => {
  const pageImages = [await readWholeCardImages(list)];
  for (let pageIndex = 1; pageIndex < maxPageCount; pageIndex += 1) {
    const isAtBound = (await arrow.getAttribute('aria-disabled')) === 'true';
    if (isAtBound) break;

    await arrow.click();
    pageImages.push(await readWholeCardImages(list));
  }
  return pageImages;
};

// jsdom computes no layout, so only a real browser sees the size and the place of each card. The
// tests compare the cards of a section with each other, in the same language: one is enough,
// except for the arrows, which must show every project in each language.
for (const width of PROJECT_CARD_SCREEN_WIDTHS_PX) {
  test.describe(`on a ${width} px wide screen`, () => {
    test.use({ viewport: { width, height: SCREEN_HEIGHT_PX } });

    for (const { titleKey, projects } of SECTIONS) {
      const title = texts[titleKey];

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

        // The columns fill the section: they leave as much space on the right of the last one as
        // on the left of the first, the page gutter on a phone
        const firstColumn = rows[0][0];
        const lastColumn = rows[0][rows[0].length - 1];
        expectSameLength({
          actual: all.list.left + all.list.width - (lastColumn.left + lastColumn.width),
          expected: firstColumn.left - all.list.left,
          name: 'space on the right of the last column',
        });

        await section.getByRole('button', { name: texts.showLess }).click();
        await expect(cards, 'cards of the row').toHaveCount(
          Math.min(projects.length, ROW_CARD_COUNT),
        );
        expect(await measureCardList(list), 'row shown again by "Show less"').toEqual(row);
      });

      test(`the last page of the row of "${title}" starts on the left, like the first one`, async ({
        page,
      }) => {
        const { section, list, cards } = await openSection({ page, title });
        const firstPage = await measureCardList(list);
        // The arrows move the row by the cards it shows whole
        const pageSize = countWholeCards({ cards: firstPage.cards, container: firstPage.list });
        expect(pageSize, 'cards that the row shows whole').toBeGreaterThan(0);
        const pageCount = Math.ceil(projects.length / pageSize);
        // With a single page, the test would compare the first page with itself
        expect(pageCount, 'pages of the row').toBeGreaterThan(1);
        const lastPageStart = (pageCount - 1) * pageSize;
        for (let pageIndex = 1; pageIndex < pageCount; pageIndex += 1) {
          await section.getByRole('button', { name: texts.nextPage }).click();
        }
        // A last page as full as the first one would show the same number of cards before the click
        await expect(
          cards.first().locator('img'),
          'screenshot of the first card of the last page',
        ).toHaveAttribute('src', getThumbnailUrl(projects[lastPageStart]));
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

      for (const language of LANGUAGES) {
        test(`the arrows of "${title}" show every project in turn, in ${language}`, async ({
          page,
        }) => {
          const languageTexts = TEXTS[language];
          const { section, list } = await openSection({
            page,
            title: languageTexts[titleKey],
            language,
          });
          const previousButton = section.getByRole('button', { name: languageTexts.previousPage });
          const nextButton = section.getByRole('button', { name: languageTexts.nextPage });
          const showAllButton = section.getByRole('button', {
            name: languageTexts.showAll.replace('{{count}}', String(projects.length)),
          });
          const projectImages = projects.map(getThumbnailUrl);

          // The buttons stand from left to right in the order of the page, which Tab follows
          const buttons = [previousButton, nextButton, showAllButton];
          const buttonLefts = await Promise.all(
            buttons.map(async button => (await button.boundingBox())?.x ?? Number.NaN),
          );
          expect(buttonLefts, 'left of each section button').toEqual(
            [...buttonLefts].sort((left, otherLeft) => left - otherLeft),
          );
          await previousButton.focus();
          await page.keyboard.press('Tab');
          await expect(nextButton, 'button after "Previous" in the tab order').toBeFocused();
          await page.keyboard.press('Tab');
          await expect(showAllButton, 'button after "Next" in the tab order').toBeFocused();

          // At the first page, "Previous" can go nowhere, and shows it
          await expect(previousButton).toHaveAttribute('aria-disabled', 'true');
          await expect(nextButton).toHaveAttribute('aria-disabled', 'false');
          const opacityOf = (button: Locator) =>
            button.evaluate(element => Number(getComputedStyle(element).opacity));
          expect(await opacityOf(previousButton), 'opacity of the disabled arrow').toBeLessThan(
            await opacityOf(nextButton),
          );

          const forwardPages = await collectPageImages({
            list,
            arrow: nextButton,
            maxPageCount: projects.length,
          });
          expect(forwardPages.flat(), 'projects shown whole by "Next", page after page').toEqual(
            projectImages,
          );
          await expect(nextButton).toHaveAttribute('aria-disabled', 'true');
          await expect(previousButton).toHaveAttribute('aria-disabled', 'false');

          const backwardPages = await collectPageImages({
            list,
            arrow: previousButton,
            maxPageCount: projects.length,
          });
          expect(
            backwardPages.reverse().flat(),
            'projects shown whole by "Previous", page after page',
          ).toEqual(projectImages);
          await expect(previousButton).toHaveAttribute('aria-disabled', 'true');
        });
      }
    }
  });
}
