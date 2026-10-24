import { ROW_CARD_COUNT } from '../constants.ts';
import type { ProjectItemData } from '../types.ts';
import {
  getLastPageStart,
  getNextPageStart,
  getPageProjects,
  getPageRange,
  getPreviousPageStart,
} from './paging.ts';

describe('getLastPageStart', () => {
  it.each([
    [4, 3, 3],
    [3, 3, 0],
    [7, 3, 6],
    [6, 3, 3],
    [4, 1, 3],
    [1, 1, 0],
    [4, 2, 2],
    [5, 2, 4],
  ])('starts the last page of %i cards, %i per page, at card %i', (total, pageSize, expected) => {
    expect(getLastPageStart({ total, pageSize })).toBe(expected);
  });

  it.each([
    ['no card', { total: 0, pageSize: 3 }],
    ['a negative number of cards', { total: -2, pageSize: 3 }],
    ['a number of cards that is NaN', { total: Number.NaN, pageSize: 3 }],
    ['an empty page size', { total: 5, pageSize: 0 }],
    ['a negative page size', { total: 5, pageSize: -1 }],
    ['a page size that is NaN', { total: 5, pageSize: Number.NaN }],
    ['an infinite page size', { total: 5, pageSize: Number.POSITIVE_INFINITY }],
  ])('starts at the first card with %s', (_, params) => {
    expect(getLastPageStart(params)).toBe(0);
  });
});

describe('getNextPageStart', () => {
  it.each([
    [0, 3, 4],
    [3, 3, 4],
    [0, 3, 5],
    [3, 3, 5],
    [0, 3, 7],
    [3, 6, 7],
    [6, 6, 7],
  ])('goes from %i to %i with %i cards, 3 per page', (currentStart, expected, total) => {
    expect(getNextPageStart({ currentStart, total, pageSize: 3 })).toBe(expected);
  });

  it.each([
    [0, 1, 1],
    [2, 3, 1],
    [3, 3, 1],
    [0, 2, 2],
    [2, 2, 2],
  ])('goes from %i to %i of 4 cards, %i per page', (currentStart, expected, pageSize) => {
    expect(getNextPageStart({ currentStart, total: 4, pageSize })).toBe(expected);
  });

  it('goes back to the last page from a start past it, as after the page size grows', () => {
    expect(getNextPageStart({ currentStart: 3, total: 4, pageSize: 2 })).toBe(2);
  });

  it.each([
    ['3 cards or fewer', { currentStart: 0, total: 3, pageSize: 3 }],
    ['no card', { currentStart: 0, total: 0, pageSize: 3 }],
    ['an empty page size', { currentStart: 0, total: 5, pageSize: 0 }],
    ['a negative page size', { currentStart: 0, total: 5, pageSize: -3 }],
    ['a page size that is NaN', { currentStart: 0, total: 5, pageSize: Number.NaN }],
  ])('stays on the first page with %s', (_, params) => {
    expect(getNextPageStart(params)).toBe(0);
  });
});

describe('getPreviousPageStart', () => {
  it.each([
    [6, 3],
    [3, 0],
    [0, 0],
    [1, 0],
  ])('goes from %i to %i', (currentStart, expected) => {
    expect(getPreviousPageStart({ currentStart, pageSize: 3 })).toBe(expected);
  });

  it.each([
    [3, 2],
    [1, 0],
  ])('goes from %i to %i, one card per page', (currentStart, expected) => {
    expect(getPreviousPageStart({ currentStart, pageSize: 1 })).toBe(expected);
  });
});

describe('getPageProjects', () => {
  /** Project of the id `id`, the only field that the pages read. */
  const projectOf = (id: number) => ({ id }) as ProjectItemData;
  const PROJECTS = [1, 2, 3, 4, 5].map(projectOf);

  it.each([
    [0, [1, 2, 3]],
    [1, [2, 3, 4]],
    [2, [3, 4, 5]],
    [3, [4, 5]],
    [4, [5]],
    [5, []],
  ])('shows the row from the card %i: the projects %j', (pageStart, ids) => {
    expect(getPageProjects({ projects: PROJECTS, pageStart }).map(({ id }) => id)).toEqual(ids);
  });

  it('holds as many cards as the row', () => {
    expect(getPageProjects({ projects: PROJECTS, pageStart: 0 })).toHaveLength(ROW_CARD_COUNT);
  });

  it('shows nothing without projects', () => {
    expect(getPageProjects({ projects: [], pageStart: 0 })).toEqual([]);
  });

  it.each([-1, -4, 1.5, NaN, Infinity, -Infinity])(
    'shows the first page from %s, which starts no page',
    pageStart => {
      expect(getPageProjects({ projects: PROJECTS, pageStart }).map(({ id }) => id)).toEqual([
        1, 2, 3,
      ]);
    },
  );

  it('leaves the projects unchanged', () => {
    const projects = [1, 2, 3, 4].map(projectOf);

    getPageProjects({ projects, pageStart: 1 });

    expect(projects.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
  });
});

describe('getPageRange', () => {
  it.each([
    [5, 0, { first: 1, last: 3, count: 3 }],
    [5, 1, { first: 2, last: 4, count: 3 }],
    [4, 1, { first: 2, last: 4, count: 3 }],
    [5, 3, { first: 4, last: 5, count: 2 }],
    [4, 3, { first: 4, last: 4, count: 1 }],
    [1, 0, { first: 1, last: 1, count: 1 }],
  ])('gives the cards of %i from the card %i: %j', (total, pageStart, range) => {
    expect(getPageRange({ total, pageStart })).toEqual(range);
  });

  it('gives the cards of getPageProjects', () => {
    const projects = [1, 2, 3, 4, 5].map(id => ({ id }) as ProjectItemData);

    [0, 1, 2, 3, 4].forEach(pageStart => {
      const ids = getPageProjects({ projects, pageStart }).map(({ id }) => id);
      const range = getPageRange({ total: projects.length, pageStart });

      expect(range?.first).toBe(ids[0]);
      expect(range?.last).toBe(ids.at(-1));
      expect(range?.count).toBe(ids.length);
    });
  });

  it.each([
    [0, 0],
    [4, 4],
    [4, 9],
  ])('gives none for %i cards from the card %i, which shows none', (total, pageStart) => {
    expect(getPageRange({ total, pageStart })).toBeUndefined();
  });

  it.each([-1, 1.5, NaN, Infinity])('gives none for a total of %s', total => {
    expect(getPageRange({ total, pageStart: 0 })).toBeUndefined();
  });

  it.each([-1, -4, 1.5, NaN, Infinity, -Infinity])(
    'gives the first page from %s, which starts no page',
    pageStart => {
      expect(getPageRange({ total: 5, pageStart })).toEqual({ first: 1, last: 3, count: 3 });
    },
  );
});
