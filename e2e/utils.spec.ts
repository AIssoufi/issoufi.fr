import { PAGES } from '../src/utils/pages';
import { MAX_CARD_OFFSET_PX, MAX_DOT_OFFSET_PX, NOT_FOUND_ROUTE } from './constants';
import {
  countWholeCards,
  getBoxCenterDistanceX,
  getCenterDistanceX,
  getCheckedRoutes,
  getQuadCenterX,
  groupCardsIntoRows,
} from './utils';

describe('getCheckedRoutes', () => {
  it('opens every page of PAGES, then the not found page, in the default language', () => {
    expect(getCheckedRoutes({ pages: PAGES })).toEqual([
      ...PAGES.map(({ path }) => path),
      NOT_FOUND_ROUTE,
    ]);
    expect(getCheckedRoutes({ pages: PAGES, language: 'fr' })).toEqual([
      ...PAGES.map(({ path }) => path),
      NOT_FOUND_ROUTE,
    ]);
  });

  it('opens every page of PAGES, then the not found page, at their English routes', () => {
    expect(getCheckedRoutes({ pages: PAGES, language: 'en' })).toEqual([
      '/en/',
      '/en/projects',
      '/en/experiences',
      `/en${NOT_FOUND_ROUTE}`,
    ]);
  });

  it('opens a new page without any change to the tests', () => {
    expect(getCheckedRoutes({ pages: [{ path: '/' }, { path: '/skills' }] })).toEqual([
      '/',
      '/skills',
      NOT_FOUND_ROUTE,
    ]);
  });

  it('keeps the order of the pages', () => {
    expect(getCheckedRoutes({ pages: [{ path: '/projects' }, { path: '/' }] })).toEqual([
      '/projects',
      '/',
      NOT_FOUND_ROUTE,
    ]);
  });

  describe('edge cases', () => {
    it.each([undefined, null, [], 'index.html', 42, { path: '/' }])(
      'opens only the not found page for the pages %j',
      pages => {
        expect(getCheckedRoutes({ pages: pages as never })).toEqual([NOT_FOUND_ROUTE]);
      },
    );

    it('opens only the not found page without any parameter', () => {
      expect(getCheckedRoutes()).toEqual([NOT_FOUND_ROUTE]);
    });

    it.each(['de', 'EN', '', null, undefined, 42])(
      'opens the routes of the default language for the language %j',
      language => {
        expect(getCheckedRoutes({ pages: [{ path: '/projects' }], language })).toEqual([
          '/projects',
          NOT_FOUND_ROUTE,
        ]);
      },
    );

    it('opens each route once, a page at the not found route included', () => {
      expect(
        getCheckedRoutes({ pages: [{ path: '/' }, { path: '/' }, { path: NOT_FOUND_ROUTE }] }),
      ).toEqual(['/', NOT_FOUND_ROUTE]);
    });

    it('opens an English route given to it once, in English', () => {
      expect(
        getCheckedRoutes({
          pages: [{ path: '/en/projects' }, { path: '/projects' }],
          language: 'en',
        }),
      ).toEqual(['/en/projects', `/en${NOT_FOUND_ROUTE}`]);
    });

    it.each([undefined, null, '', 'projects', 'https://issoufi.fr/', 42, ['/'], {}])(
      'skips a page whose path %j is not a route',
      path => {
        expect(getCheckedRoutes({ pages: [{ path }, { path: '/' }] })).toEqual([
          '/',
          NOT_FOUND_ROUTE,
        ]);
      },
    );

    it.each([undefined, null, '/projects', 42, true])(
      'skips the entry %j, which is not a page',
      entry => {
        expect(getCheckedRoutes({ pages: [entry as never, { path: '/' }] })).toEqual([
          '/',
          NOT_FOUND_ROUTE,
        ]);
      },
    );

    it('skips a page without a path', () => {
      expect(getCheckedRoutes({ pages: [{}, { path: '/' }] })).toEqual(['/', NOT_FOUND_ROUTE]);
    });
  });
});

/** Border quad of a 16 px dot whose center is at x = 30, the mobile line. */
const DOT_QUAD = [22, 180, 38, 180, 38, 196, 22, 196];

/** Quad of a 2 px wide line whose center is at x = 30. */
const LINE_QUAD = [29, 176, 31, 176, 31, 4000, 29, 4000];

describe('getQuadCenterX', () => {
  it('finds the horizontal center of a box', () => {
    expect(getQuadCenterX(DOT_QUAD)).toBe(30);
  });

  it('keeps the subpixel part of the center', () => {
    expect(getQuadCenterX([63, 455.3, 68.15, 455.3, 68.15, 477, 63, 477])).toBeCloseTo(65.575);
  });

  it('finds the center of a box that a transform turned, from its 4 corners', () => {
    expect(getQuadCenterX([30, 0, 40, 10, 30, 20, 20, 10])).toBe(30);
  });

  it('measures a box left of the screen, at negative x', () => {
    expect(getQuadCenterX([-10, 0, -4, 0, -4, 6, -10, 6])).toBe(-7);
  });

  describe('edge cases', () => {
    it.each([undefined, null, [], 'quad', 42, { 0: 22 }])('returns NaN for the quad %j', quad => {
      expect(getQuadCenterX(quad as never)).toBeNaN();
    });

    it.each([
      ['too few coordinates', [22, 180, 38, 180, 38, 196]],
      ['too many coordinates', [...DOT_QUAD, 22, 180]],
      ['a NaN', [Number.NaN, 180, 38, 180, 38, 196, 22, 196]],
      ['an infinite one', [22, 180, Infinity, 180, 38, 196, 22, 196]],
      ['a string', ['22', 180, 38, 180, 38, 196, 22, 196]],
      ['a missing one', [22, 180, 38, 180, 38, 196, undefined, 196]],
    ])('returns NaN for a quad with %s', (_case, quad) => {
      expect(getQuadCenterX(quad as never)).toBeNaN();
    });
  });
});

describe('getCenterDistanceX', () => {
  it('returns 0 for a box centered on the other one', () => {
    expect(getCenterDistanceX({ quad: DOT_QUAD, referenceQuad: LINE_QUAD })).toBe(0);
  });

  it.each([
    ['right', 1],
    ['left', -1],
  ])('returns 1 for a box 1 px to the %s of the other one', (_side, offsetPx) => {
    const movedQuad = DOT_QUAD.map((coordinate, index) =>
      index % 2 === 0 ? coordinate + offsetPx : coordinate,
    );

    expect(getCenterDistanceX({ quad: movedQuad, referenceQuad: LINE_QUAD })).toBe(1);
  });

  it('ignores how far apart the boxes are vertically', () => {
    const lowerQuad = DOT_QUAD.map((coordinate, index) =>
      index % 2 === 0 ? coordinate : coordinate + 1000,
    );

    expect(getCenterDistanceX({ quad: lowerQuad, referenceQuad: LINE_QUAD })).toBe(0);
  });

  describe('edge cases', () => {
    it.each([
      ['no parameters', undefined],
      ['no quads', {}],
      ['no quad', { referenceQuad: LINE_QUAD }],
      ['no reference quad', { quad: DOT_QUAD }],
      ['an invalid quad', { quad: [], referenceQuad: LINE_QUAD }],
      ['an invalid reference quad', { quad: DOT_QUAD, referenceQuad: null }],
    ])('returns NaN, which fails any comparison, for %s', (_case, params) => {
      const distance = getCenterDistanceX(params);

      expect(distance).toBeNaN();
      expect(distance <= MAX_DOT_OFFSET_PX).toBe(false);
    });
  });
});

/** Width and height of the cards of the tests, those of a project card on a phone. */
const CARD_SIZE = { width: 260, height: 302 };
/** Horizontal distance from the left edge of a card to the left edge of the next one. */
const CARD_STEP_PX = 270;
/** Visible box of a list 375 px wide, the width of a phone. */
const PHONE_LIST = { left: 0, top: 100, width: 375, height: 312 };
/** Left edge of the first card of the row on a phone: the page gutter, then the card margin. */
const ROW_CARD_LEFT_PX = 29;
/** Left edge of the cards of "Show all" on a phone, in line with the section title. */
const SHOW_ALL_CARD_LEFT_PX = 24;

/** Box of a card placed at the given position, with the size of {@link CARD_SIZE}. */
const cardAt = ({ left, top = PHONE_LIST.top }: { left: number; top?: number }) => ({
  left,
  top,
  ...CARD_SIZE,
});

/** The three cards of a row on a phone: the first one whole, the others scrolled out of view. */
const PHONE_ROW = [0, 1, 2].map(column =>
  cardAt({ left: ROW_CARD_LEFT_PX + column * CARD_STEP_PX }),
);

describe('countWholeCards', () => {
  it('counts only the cards of the row that the list shows whole', () => {
    expect(countWholeCards({ cards: PHONE_ROW, container: PHONE_LIST })).toBe(1);
  });

  it('counts every card of a row that fits in the list', () => {
    const wideList = { ...PHONE_LIST, width: ROW_CARD_LEFT_PX + 3 * CARD_STEP_PX };

    expect(countWholeCards({ cards: PHONE_ROW, container: wideList })).toBe(3);
  });

  it('counts a card cut on the left of the list as not whole', () => {
    const cards = [cardAt({ left: -10 }), cardAt({ left: 50 })];

    expect(countWholeCards({ cards, container: PHONE_LIST })).toBe(1);
  });

  it('ignores how far the cards are from the list vertically', () => {
    const lowerCard = cardAt({ left: ROW_CARD_LEFT_PX, top: 5000 });

    expect(countWholeCards({ cards: [lowerCard], container: PHONE_LIST })).toBe(1);
  });

  describe('boundaries', () => {
    const listRight = PHONE_LIST.left + PHONE_LIST.width;
    const cardEndingAt = (right: number) => cardAt({ left: right - CARD_SIZE.width });

    it.each([
      ['on the right edge of the list', listRight, 1],
      ['within the tolerance past it', listRight + MAX_CARD_OFFSET_PX, 1],
      ['just past the tolerance', listRight + MAX_CARD_OFFSET_PX + 0.01, 0],
    ])('tells whether a card ending %s is whole', (_position, right, expectedCount) => {
      expect(countWholeCards({ cards: [cardEndingAt(right)], container: PHONE_LIST })).toBe(
        expectedCount,
      );
    });

    it.each([
      ['on the left edge of the list', 0, 1],
      ['within the tolerance before it', -MAX_CARD_OFFSET_PX, 1],
      ['just before the tolerance', -MAX_CARD_OFFSET_PX - 0.01, 0],
    ])('tells whether a card starting %s is whole', (_position, left, expectedCount) => {
      expect(countWholeCards({ cards: [cardAt({ left })], container: PHONE_LIST })).toBe(
        expectedCount,
      );
    });

    it('applies the tolerance it is given', () => {
      const cards = [cardEndingAt(listRight + 2)];

      expect(countWholeCards({ cards, container: PHONE_LIST, tolerancePx: 2 })).toBe(1);
      expect(countWholeCards({ cards, container: PHONE_LIST, tolerancePx: 0 })).toBe(0);
    });
  });

  describe('edge cases', () => {
    it.each([
      ['no parameters', undefined],
      ['no cards', { container: PHONE_LIST }],
      ['cards that are not a list', { cards: 'cards', container: PHONE_LIST }],
      ['an empty list of cards', { cards: [], container: PHONE_LIST }],
      ['no container', { cards: PHONE_ROW }],
      ['a container without a size', { cards: PHONE_ROW, container: { left: 0, top: 0 } }],
      ['a container at NaN', { cards: PHONE_ROW, container: { ...PHONE_LIST, left: NaN } }],
    ])('returns 0 for %s', (_case, params) => {
      expect(countWholeCards(params as never)).toBe(0);
    });

    it('counts no card whole with a NaN tolerance, so that a check of the columns fails', () => {
      expect(countWholeCards({ cards: PHONE_ROW, container: PHONE_LIST, tolerancePx: NaN })).toBe(
        0,
      );
    });

    it.each([undefined, null, 42, {}, { ...cardAt({ left: ROW_CARD_LEFT_PX }), width: Infinity }])(
      'does not count the entry %j, which is not a box',
      entry => {
        const cards = [entry as never, cardAt({ left: ROW_CARD_LEFT_PX })];

        expect(countWholeCards({ cards, container: PHONE_LIST })).toBe(1);
      },
    );
  });
});

describe('groupCardsIntoRows', () => {
  /** Vertical distance from the top of a row of cards to the top of the next one. */
  const ROW_STEP_PX = 317;
  /** Left edges of the three columns of "Show all", from the left edge of the first card. */
  const SHOW_ALL_COLUMN_LEFTS = [0, 1, 2].map(
    column => SHOW_ALL_CARD_LEFT_PX + column * CARD_STEP_PX,
  );
  /** Cards of three columns wrapped onto two rows, as "Show all" lays out five projects. */
  const firstRow = SHOW_ALL_COLUMN_LEFTS.map(left => cardAt({ left }));
  const secondRow = SHOW_ALL_COLUMN_LEFTS.slice(0, 2).map(left =>
    cardAt({ left, top: PHONE_LIST.top + ROW_STEP_PX }),
  );

  it('groups the cards of each row, from top to bottom', () => {
    expect(groupCardsIntoRows({ cards: [...firstRow, ...secondRow] })).toEqual([
      firstRow,
      secondRow,
    ]);
  });

  it('puts each card in a row of its own when the cards are stacked', () => {
    const stackedCards = [0, 1, 2].map(row =>
      cardAt({ left: SHOW_ALL_CARD_LEFT_PX, top: PHONE_LIST.top + row * ROW_STEP_PX }),
    );

    expect(groupCardsIntoRows({ cards: stackedCards })).toEqual(stackedCards.map(card => [card]));
  });

  it('keeps a single row of cards together', () => {
    expect(groupCardsIntoRows({ cards: PHONE_ROW })).toEqual([PHONE_ROW]);
  });

  describe('boundaries', () => {
    it.each([
      ['at the same top', 0, 1],
      ['within the tolerance', MAX_CARD_OFFSET_PX, 1],
      ['just past the tolerance', MAX_CARD_OFFSET_PX + 0.01, 2],
      ['just past the tolerance, above', -MAX_CARD_OFFSET_PX - 0.01, 2],
    ])('tells whether a card %s is in the same row', (_position, topOffsetPx, expectedRowCount) => {
      const cards = [
        cardAt({ left: SHOW_ALL_CARD_LEFT_PX }),
        cardAt({ left: SHOW_ALL_CARD_LEFT_PX + CARD_STEP_PX, top: PHONE_LIST.top + topOffsetPx }),
      ];

      expect(groupCardsIntoRows({ cards })).toHaveLength(expectedRowCount);
    });

    it('compares each card with the first card of its row, so a row cannot drift', () => {
      const cards = [0, 0.4, 0.8].map((topOffsetPx, column) =>
        cardAt({
          left: SHOW_ALL_CARD_LEFT_PX + column * CARD_STEP_PX,
          top: PHONE_LIST.top + topOffsetPx,
        }),
      );

      expect(groupCardsIntoRows({ cards }).map(row => row.length)).toEqual([2, 1]);
    });

    it('applies the tolerance it is given', () => {
      const cards = [
        cardAt({ left: SHOW_ALL_CARD_LEFT_PX }),
        cardAt({ left: SHOW_ALL_CARD_LEFT_PX + CARD_STEP_PX, top: PHONE_LIST.top + 2 }),
      ];

      expect(groupCardsIntoRows({ cards, tolerancePx: 2 })).toHaveLength(1);
      expect(groupCardsIntoRows({ cards, tolerancePx: 0 })).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it.each([
      ['no parameters', undefined],
      ['no cards', {}],
      ['cards that are not a list', { cards: { length: 2 } }],
      ['an empty list of cards', { cards: [] }],
    ])('returns no rows for %s', (_case, params) => {
      expect(groupCardsIntoRows(params as never)).toEqual([]);
    });

    it('puts each card in a row of its own with a NaN tolerance', () => {
      expect(groupCardsIntoRows({ cards: firstRow, tolerancePx: NaN })).toEqual(
        firstRow.map(card => [card]),
      );
    });

    it.each([
      undefined,
      null,
      'card',
      {},
      { ...cardAt({ left: SHOW_ALL_CARD_LEFT_PX }), top: NaN },
    ])('skips the entry %j, which is not a box', entry => {
      const cards = [entry as never, ...firstRow];

      expect(groupCardsIntoRows({ cards })).toEqual([firstRow]);
    });
  });
});

describe('getBoxCenterDistanceX', () => {
  const toggle = { x: 1374, y: 361, width: 46, height: 78 };

  it('finds no distance between a box and the box it is centered on', () => {
    expect(
      getBoxCenterDistanceX({
        box: { x: 1381, y: 460, width: 32, height: 32 },
        referenceBox: toggle,
      }),
    ).toBe(0);
  });

  it.each([
    ['left of', { x: 1380, y: 460, width: 32, height: 32 }, 1],
    ['right of', { x: 1381.5, y: 460, width: 32, height: 32 }, 0.5],
    ['far from', { x: 24, y: 460, width: 32, height: 32 }, 1357],
  ])('measures a box centered %s the reference', (_name, box, expected) => {
    expect(getBoxCenterDistanceX({ box, referenceBox: toggle })).toBe(expected);
    expect(getBoxCenterDistanceX({ box: toggle, referenceBox: box })).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'box',
      { x: Number.NaN, y: 0, width: 32, height: 32 },
      { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 32 },
      { x: '1381', y: 460, width: 32, height: 32 },
    ])('returns NaN for the box %j', box => {
      expect(getBoxCenterDistanceX({ box: box as never, referenceBox: toggle })).toBeNaN();
      expect(getBoxCenterDistanceX({ box: toggle, referenceBox: box as never })).toBeNaN();
    });

    it('returns NaN without boxes', () => {
      expect(getBoxCenterDistanceX()).toBeNaN();
    });
  });
});
