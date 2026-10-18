import { PAGES } from '../src/utils/pages';
import { MAX_CARD_OFFSET_PX, MAX_DOT_OFFSET_PX, NOT_FOUND_ROUTE } from './constants';
import {
  countWholeCards,
  getCenterDistanceX,
  getCheckedRoutes,
  getQuadCenterX,
  groupCardsIntoRows,
} from './utils';

describe('getCheckedRoutes', () => {
  it('opens every page of PAGES, then the not found page', () => {
    expect(getCheckedRoutes(PAGES)).toEqual([...PAGES.map(({ path }) => path), NOT_FOUND_ROUTE]);
  });

  it('opens a new page without any change to the tests', () => {
    expect(getCheckedRoutes([{ path: '/' }, { path: '/skills' }])).toEqual([
      '/',
      '/skills',
      NOT_FOUND_ROUTE,
    ]);
  });

  it('keeps the order of the pages', () => {
    expect(getCheckedRoutes([{ path: '/projects' }, { path: '/' }])).toEqual([
      '/projects',
      '/',
      NOT_FOUND_ROUTE,
    ]);
  });

  describe('edge cases', () => {
    it.each([undefined, null, [], 'index.html', 42, { path: '/' }])(
      'opens only the not found page for the pages %j',
      pages => {
        expect(getCheckedRoutes(pages as never)).toEqual([NOT_FOUND_ROUTE]);
      },
    );

    it('opens each route once, a page at the not found route included', () => {
      expect(getCheckedRoutes([{ path: '/' }, { path: '/' }, { path: NOT_FOUND_ROUTE }])).toEqual([
        '/',
        NOT_FOUND_ROUTE,
      ]);
    });

    it.each([undefined, null, '', 'projects', 'https://issoufi.fr/', 42, ['/'], {}])(
      'skips a page whose path %j is not a route',
      path => {
        expect(getCheckedRoutes([{ path }, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
      },
    );

    it.each([undefined, null, '/projects', 42, true])(
      'skips the entry %j, which is not a page',
      entry => {
        expect(getCheckedRoutes([entry as never, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
      },
    );

    it('skips a page without a path', () => {
      expect(getCheckedRoutes([{}, { path: '/' }])).toEqual(['/', NOT_FOUND_ROUTE]);
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

/** Box of a card placed at the given position, with the size of {@link CARD_SIZE}. */
const cardAt = ({ left, top = PHONE_LIST.top }: { left: number; top?: number }) => ({
  left,
  top,
  ...CARD_SIZE,
});

/** The three cards of a row on a phone: the first one whole, the others scrolled out of view. */
const PHONE_ROW = [29, 29 + CARD_STEP_PX, 29 + 2 * CARD_STEP_PX].map(left => cardAt({ left }));

describe('countWholeCards', () => {
  it('counts only the cards of the row that the list shows whole', () => {
    expect(countWholeCards({ cards: PHONE_ROW, container: PHONE_LIST })).toBe(1);
  });

  it('counts every card of a row that fits in the list', () => {
    const wideList = { ...PHONE_LIST, width: 3 * CARD_STEP_PX + 29 };

    expect(countWholeCards({ cards: PHONE_ROW, container: wideList })).toBe(3);
  });

  it('counts a card cut on the left of the list as not whole', () => {
    const cards = [cardAt({ left: -10 }), cardAt({ left: 50 })];

    expect(countWholeCards({ cards, container: PHONE_LIST })).toBe(1);
  });

  it('ignores how far the cards are from the list vertically', () => {
    const lowerCard = cardAt({ left: 29, top: 5000 });

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

    it.each([undefined, null, 42, {}, { ...cardAt({ left: 29 }), width: Infinity }])(
      'does not count the entry %j, which is not a box',
      entry => {
        const cards = [entry as never, cardAt({ left: 29 })];

        expect(countWholeCards({ cards, container: PHONE_LIST })).toBe(1);
      },
    );
  });
});

describe('groupCardsIntoRows', () => {
  /** Vertical distance from the top of a row of cards to the top of the next one. */
  const ROW_STEP_PX = 317;
  /** Cards of three columns wrapped onto two rows, as "Show all" lays out five projects. */
  const firstRow = [24, 294, 564].map(left => cardAt({ left }));
  const secondRow = [24, 294].map(left => cardAt({ left, top: PHONE_LIST.top + ROW_STEP_PX }));

  it('groups the cards of each row, from top to bottom', () => {
    expect(groupCardsIntoRows({ cards: [...firstRow, ...secondRow] })).toEqual([
      firstRow,
      secondRow,
    ]);
  });

  it('puts each card in a row of its own when the cards are stacked', () => {
    const stackedCards = [0, 1, 2].map(row =>
      cardAt({ left: 24, top: PHONE_LIST.top + row * ROW_STEP_PX }),
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
        cardAt({ left: 24 }),
        cardAt({ left: 294, top: PHONE_LIST.top + topOffsetPx }),
      ];

      expect(groupCardsIntoRows({ cards })).toHaveLength(expectedRowCount);
    });

    it('compares each card with the first card of its row, so a row cannot drift', () => {
      const cards = [0, 0.4, 0.8].map((topOffsetPx, column) =>
        cardAt({ left: 24 + column * CARD_STEP_PX, top: PHONE_LIST.top + topOffsetPx }),
      );

      expect(groupCardsIntoRows({ cards }).map(row => row.length)).toEqual([2, 1]);
    });

    it('applies the tolerance it is given', () => {
      const cards = [cardAt({ left: 24 }), cardAt({ left: 294, top: PHONE_LIST.top + 2 })];

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

    it.each([undefined, null, 'card', {}, { ...cardAt({ left: 24 }), top: NaN }])(
      'skips the entry %j, which is not a box',
      entry => {
        const cards = [entry as never, ...firstRow];

        expect(groupCardsIntoRows({ cards })).toEqual([firstRow]);
      },
    );
  });
});
