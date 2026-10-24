import { ROW_CARD_COUNT } from '../constants.ts';
import type { ProjectItemData } from '../types.ts';

/** Parameters of {@link getLastPageStart}. */
interface GetLastPageStartParams {
  /** Total number of cards. */
  total: number;
  /** Number of cards per page. */
  pageSize: number;
}

/** Tells whether cards can be split into pages: some cards, and a finite page size above zero. */
const canPage = ({ total, pageSize }: GetLastPageStartParams) =>
  total > 0 && pageSize > 0 && Number.isFinite(pageSize);

/**
 * Returns the index of the first card of the last page. Pages start every `pageSize` cards from
 * the first one, so the last page may hold fewer cards, in the columns of the first page.
 *
 * @returns `0` without cards, or with a page size that is not a finite number above zero, as
 * with a single page.
 *
 * @example
 * getLastPageStart({ total: 5, pageSize: 2 }); // 4
 */
export function getLastPageStart({ total, pageSize }: GetLastPageStartParams): number {
  if (!canPage({ total, pageSize })) return 0;

  return Math.floor((total - 1) / pageSize) * pageSize;
}

/** Parameters of {@link getNextPageStart}. */
interface GetNextPageStartParams {
  /** Index of the first card of the current page. */
  currentStart: number;
  /** Total number of cards. */
  total: number;
  /** Number of cards per page. */
  pageSize: number;
}

/**
 * Returns the index of the first card of the next page, staying on the last page once reached,
 * so "next" never shows an empty page.
 *
 * @returns `0` without cards, or with a page size that is not a finite number above zero, as
 * with a single page.
 *
 * @example
 * getNextPageStart({ currentStart: 0, total: 4, pageSize: 1 }); // 1
 */
export function getNextPageStart({
  currentStart,
  total,
  pageSize,
}: GetNextPageStartParams): number {
  if (!canPage({ total, pageSize })) return 0;

  return Math.min(currentStart + pageSize, getLastPageStart({ total, pageSize }));
}

/** Parameters of {@link getPreviousPageStart}. */
interface GetPreviousPageStartParams {
  /** Index of the first card of the current page. */
  currentStart: number;
  /** Number of cards per page. */
  pageSize: number;
}

/** Returns the index of the first card of the previous page, never before the first card. */
export function getPreviousPageStart({
  currentStart,
  pageSize,
}: GetPreviousPageStartParams): number {
  return Math.max(0, currentStart - pageSize);
}

/** Parameters of {@link getPageProjects}. */
interface GetPageProjectsParams {
  /** Every project of the section, in their order. */
  projects: readonly ProjectItemData[];
  /** Index of the first card of the page. */
  pageStart: number;
}

/** Whether a value can start a page: a whole number of cards from the first one. */
const isPageStart = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * Returns the projects that the row shows from a page: {@link ROW_CARD_COUNT} cards from its
 * first one, those it shows whole and the next ones, which it scrolls to.
 *
 * @returns Fewer cards on the last page, and none past the last project. A start that is not a
 * whole number from zero, such as `-1`, `1.5` or `NaN`, shows the first page.
 *
 * @example
 * getPageProjects({ projects: [chess, calculator, store, connectFour], pageStart: 1 });
 * // [calculator, store, connectFour]
 */
export function getPageProjects({ projects, pageStart }: GetPageProjectsParams): ProjectItemData[] {
  const start = isPageStart(pageStart) ? pageStart : 0;
  return projects.slice(start, start + ROW_CARD_COUNT);
}

/** Parameters of {@link getPageRange}. */
interface GetPageRangeParams {
  /** Total number of cards. */
  total: number;
  /** Index of the first card of the page. */
  pageStart: number;
}

/** Positions of the cards that a page shows, counted from one, as a visitor counts them. */
export interface PageRange {
  /** Position of the first card of the page. */
  first: number;
  /** Position of the last card of the page. */
  last: number;
  /** Number of cards of the page. */
  count: number;
}

/**
 * Returns the positions of the cards that the row shows from a page, those of
 * {@link getPageProjects}: {@link ROW_CARD_COUNT} cards from its first one, fewer on the last page.
 *
 * @returns `undefined` without cards, past the last one, or with a total that is not a whole
 * number. A start that is not a whole number from zero, such as `-1`, `1.5` or `NaN`, gives the
 * first page.
 *
 * @example
 * getPageRange({ total: 4, pageStart: 1 }); // { first: 2, last: 4, count: 3 }
 */
export function getPageRange({ total, pageStart }: GetPageRangeParams): PageRange | undefined {
  const start = isPageStart(pageStart) ? pageStart : 0;
  const hasCardToShow = isPageStart(total) && start < total;
  if (!hasCardToShow) return undefined;

  const end = Math.min(start + ROW_CARD_COUNT, total);
  // An index counts from zero, a position from one
  return { first: start + 1, last: end, count: end - start };
}
