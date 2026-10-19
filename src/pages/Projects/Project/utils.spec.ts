import { ROW_CARD_COUNT } from './constants';
import type { ProjectItemData } from './types';
import {
  countWholeCards,
  getCardTilt,
  getLastPageStart,
  getNextPageStart,
  getPageProjects,
  getPreviousPageStart,
  getProjectLinkUrl,
  getThumbnailSources,
  parseLikedIds,
  setLike,
} from './utils';

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

describe('countWholeCards', () => {
  it.each([
    // One card between the page gutters, the next one starts in the right gutter
    [
      'a phone 375 px wide',
      { rowWidth: 375, firstCardStart: 24, cardWidth: 327, cardPitch: 337 },
      1,
    ],
    // Two columns, the third card starts in the right gutter
    [
      'a tablet 768 px wide',
      { rowWidth: 768, firstCardStart: 24, cardWidth: 355, cardPitch: 365 },
      2,
    ],
    // Two columns of the desktop layout, the third card out of view on the right
    [
      'a tablet 800 px wide',
      { rowWidth: 696, firstCardStart: 5, cardWidth: 338, cardPitch: 348 },
      2,
    ],
    // Cards narrower than the row, the third one cut by its edge
    ['a row that scrolls', { rowWidth: 696, firstCardStart: 5, cardWidth: 260, cardPitch: 270 }, 2],
    [
      'a laptop 1440 px wide',
      { rowWidth: 1336, firstCardStart: 5, cardWidth: 435.33, cardPitch: 445.33 },
      3,
    ],
  ])('counts the cards that the row shows whole on %s', (_screen, measures, expected) => {
    expect(countWholeCards(measures)).toBe(expected);
  });

  it('counts the cards that fit, more than a row of three holds', () => {
    expect(
      countWholeCards({ rowWidth: 1000, firstCardStart: 0, cardWidth: 100, cardPitch: 110 }),
    ).toBe(9);
  });

  it.each([
    ['ends on the edge of the row', 351, {}, 1],
    ['passes the edge by less than the rounding of the row width', 351.5, {}, 1],
    ['passes the edge by more than the rounding', 352.5, {}, 0],
    ['passes the edge with no tolerance', 351.5, { tolerancePx: 0 }, 0],
    ['passes the edge with a negative tolerance, counted as none', 351.5, { tolerancePx: -5 }, 0],
    ['passes the edge with a tolerance that is NaN', 351.5, { tolerancePx: Number.NaN }, 0],
  ])('counts a card that %s', (_case, cardWidth, options, expected) => {
    expect(
      countWholeCards({ rowWidth: 375, firstCardStart: 24, cardWidth, cardPitch: 400, ...options }),
    ).toBe(expected);
  });

  it('counts no card when even the first one is wider than the row', () => {
    expect(
      countWholeCards({ rowWidth: 280, firstCardStart: 5, cardWidth: 300, cardPitch: 310 }),
    ).toBe(0);
  });

  const MEASURES = { rowWidth: 375, firstCardStart: 24, cardWidth: 327, cardPitch: 337 };

  it.each([
    ['no measures', undefined],
    ['empty measures', {}],
    ['a row of no width, as nothing is laid out in jsdom', { ...MEASURES, rowWidth: 0 }],
    ['cards of no width', { ...MEASURES, cardWidth: 0, cardPitch: 0 }],
    ['a card width that is NaN', { ...MEASURES, cardWidth: Number.NaN }],
    ['a negative pitch', { ...MEASURES, cardPitch: -337 }],
    ['an infinite row width', { ...MEASURES, rowWidth: Number.POSITIVE_INFINITY }],
    ['a missing card width', { ...MEASURES, cardWidth: undefined }],
    ['a negative start', { ...MEASURES, firstCardStart: -1 }],
    ['a start that is NaN', { ...MEASURES, firstCardStart: Number.NaN }],
    ['a start that is a string', { ...MEASURES, firstCardStart: '24' as unknown as number }],
  ])('cannot count with %s', (_case, measures) => {
    expect(countWholeCards(measures)).toBeNull();
  });

  it('counts from a first card at the left edge of the row', () => {
    expect(countWholeCards({ ...MEASURES, firstCardStart: 0 })).toBe(1);
  });
});

describe('getCardTilt', () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };

  it('does not tilt at the center', () => {
    const tilt = getCardTilt({ pointer: { x: 200, y: 150 }, rect, maxTilt: 6 });
    expect(tilt.rotateX).toBeCloseTo(0);
    expect(tilt.rotateY).toBeCloseTo(0);
    expect(tilt).toMatchObject({ x: 100, y: 50 });
  });

  it('tilts by the maximum at the corners', () => {
    expect(getCardTilt({ pointer: { x: 300, y: 100 }, rect, maxTilt: 6 })).toEqual({
      rotateX: 6,
      rotateY: 6,
      x: 200,
      y: 0,
    });
  });

  it('does not tilt an empty card instead of returning NaN', () => {
    const empty = { left: 0, top: 0, width: 0, height: 0 };
    expect(getCardTilt({ pointer: { x: 5, y: 5 }, rect: empty, maxTilt: 6 })).toEqual({
      rotateX: 0,
      rotateY: 0,
      x: 5,
      y: 5,
    });
  });
});

describe('parseLikedIds', () => {
  it.each([
    ['[1,5]', [1, 5]],
    ['[5]', [5]],
    ['[]', []],
    ['[0,-3]', [0, -3]],
  ])('reads the ids of the stored list %s', (storedValue, expectedIds) => {
    expect([...parseLikedIds(storedValue)]).toEqual(expectedIds);
  });

  it('keeps each id once, in the order of its first like', () => {
    expect([...parseLikedIds('[5,1,5,1]')]).toEqual([5, 1]);
  });

  it('likes nothing on a first visit, when the key is not stored', () => {
    expect(parseLikedIds(null).size).toBe(0);
  });

  it.each(['', '  ', '[1,', 'not json', 'undefined', '{"1":true}', '1', '"[1]"', 'true', 'null'])(
    'likes nothing for the stored text %j, which is not a list',
    storedValue => {
      expect(parseLikedIds(storedValue).size).toBe(0);
    },
  );

  it('leaves out the entries that are not integers', () => {
    // 1e400 parses to Infinity
    const storedValue = '["1",1.5,null,true,{},[2],1e400,7]';

    expect([...parseLikedIds(storedValue)]).toEqual([7]);
  });
});

describe('setLike', () => {
  it('adds the like of a project to the others', () => {
    expect([...setLike({ likedIds: new Set([1]), id: 5, isLiked: true })]).toEqual([1, 5]);
  });

  it('removes the like of a project, and only that one', () => {
    expect([...setLike({ likedIds: new Set([1, 5]), id: 1, isLiked: false })]).toEqual([5]);
  });

  it.each([
    ['liking a liked project', { likedIds: new Set([1]), id: 1, isLiked: true }, [1]],
    ['unliking a project not liked', { likedIds: new Set([1]), id: 5, isLiked: false }, [1]],
    ['unliking without likes', { likedIds: new Set<number>(), id: 1, isLiked: false }, []],
  ])('changes nothing when %s', (_change, params, expectedIds) => {
    expect([...setLike(params)]).toEqual(expectedIds);
  });

  it('returns a new set, leaving the previous likes as they were', () => {
    const likedIds = new Set([1]);

    const nextLikedIds = setLike({ likedIds, id: 5, isLiked: true });

    expect(nextLikedIds).not.toBe(likedIds);
    expect([...likedIds]).toEqual([1]);
  });
});

describe('getProjectLinkUrl', () => {
  const URL = 'https://example.com/chess';

  it('links a card that has a url and a name', () => {
    expect(getProjectLinkUrl({ url: URL, name: 'Chess' })).toBe(URL);
  });

  it.each([
    ['no url', { name: 'Chess' }],
    ['an empty url', { url: '', name: 'Chess' }],
    ['a blank url', { url: '   ', name: 'Chess' }],
    ['a url that is not a string', { url: 42, name: 'Chess' }],
    ['no name', { url: URL }],
    ['an empty name', { url: URL, name: '' }],
    ['a blank name', { url: URL, name: '  ' }],
    ['a null name', { url: URL, name: null }],
    ['no project', undefined],
    ['a null project', null],
  ])('gives no link to a card with %s', (_case, project) => {
    expect(getProjectLinkUrl(project as Parameters<typeof getProjectLinkUrl>[0])).toBeUndefined();
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

  it('leaves the projects unchanged', () => {
    const projects = [1, 2, 3, 4].map(projectOf);

    getPageProjects({ projects, pageStart: 1 });

    expect(projects.map(({ id }) => id)).toEqual([1, 2, 3, 4]);
  });
});

describe('getThumbnailSources', () => {
  const NARROW = { url: '/chess-480.webp', width: 480, height: 300 };
  const MEDIUM = { url: '/chess-720.webp', width: 720, height: 450 };
  const WIDE = { url: '/chess-960.webp', width: 960, height: 600 };

  it('names every file with its width, from the narrowest, and gives the widest as the src', () => {
    expect(getThumbnailSources([NARROW, MEDIUM, WIDE])).toEqual({
      src: '/chess-960.webp',
      srcSet: '/chess-480.webp 480w, /chess-720.webp 720w, /chess-960.webp 960w',
      width: 960,
      height: 600,
    });
  });

  it('orders the files by width, whatever their order in the data', () => {
    expect(getThumbnailSources([WIDE, NARROW, MEDIUM])?.srcSet).toBe(
      '/chess-480.webp 480w, /chess-720.webp 720w, /chess-960.webp 960w',
    );
  });

  it('takes a single file', () => {
    expect(getThumbnailSources([NARROW])).toEqual({
      src: '/chess-480.webp',
      srcSet: '/chess-480.webp 480w',
      width: 480,
      height: 300,
    });
  });

  it('keeps the first file of a width that a srcset cannot hold twice', () => {
    const copy = { url: '/copy-480.webp', width: 480, height: 300 };

    expect(getThumbnailSources([NARROW, copy, WIDE])?.srcSet).toBe(
      '/chess-480.webp 480w, /chess-960.webp 960w',
    );
  });

  it.each([
    ['without a url', { width: 960, height: 600 }],
    ['with an empty url', { url: '', width: 960, height: 600 }],
    ['with a blank url', { url: '  ', width: 960, height: 600 }],
    ['with a url holding a space', { url: '/chess 960.webp', width: 960, height: 600 }],
    ['with a url that is not a string', { url: 960, width: 960, height: 600 }],
    ['without a width', { url: '/chess-960.webp', height: 600 }],
    ['with a width of zero', { url: '/chess-960.webp', width: 0, height: 600 }],
    ['with a negative width', { url: '/chess-960.webp', width: -960, height: 600 }],
    ['with a fractional width', { url: '/chess-960.webp', width: 960.5, height: 600 }],
    ['with a width written as text', { url: '/chess-960.webp', width: '960', height: 600 }],
    ['with an infinite width', { url: '/chess-960.webp', width: Infinity, height: 600 }],
    ['with a width that is not a number', { url: '/chess-960.webp', width: NaN, height: 600 }],
    ['without a height', { url: '/chess-960.webp', width: 960 }],
    ['with a height of zero', { url: '/chess-960.webp', width: 960, height: 0 }],
    ['that is null', null],
    ['that is a text', '/chess-960.webp'],
    ['that is a list', ['/chess-960.webp', 960, 600]],
  ])('leaves out a file %s', (_case, file) => {
    expect(getThumbnailSources([NARROW, file])).toEqual(getThumbnailSources([NARROW]));
  });

  it.each([undefined, null, [], [null], '/chess-960.webp', 42, {}, { 0: WIDE, length: 1 }])(
    'gives no sources for %j, which holds no valid file',
    files => {
      expect(getThumbnailSources(files)).toBeUndefined();
    },
  );
});
