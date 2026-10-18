import { PAGES } from '../src/utils/pages';
import { MAX_CARD_OFFSET_PX, MAX_DOT_OFFSET_PX, NOT_FOUND_ROUTE } from './constants';
import {
  countOccurrences,
  countWholeCards,
  doBoxesOverlapHorizontally,
  filterWholeCards,
  findSkippedHeadingLevels,
  getBoxBottom,
  getBoxCenterDistanceX,
  getBoxCenterDistanceY,
  getBoxRight,
  getButtonAimPoints,
  getCenterDistanceX,
  getCheckedRoutes,
  getQuadCenterX,
  getScreenBox,
  getScreenCenter,
  groupCardsIntoRows,
  isBoxInside,
  isGoogleHost,
  isGoogleUrl,
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

describe('filterWholeCards', () => {
  /** The cards of {@link PHONE_ROW}, each with the screenshot it shows. */
  const NAMED_ROW = PHONE_ROW.map((card, column) => ({ ...card, src: `/card-${column}.webp` }));

  it('keeps the cards that the list shows whole, with the other fields they carry', () => {
    expect(filterWholeCards({ cards: NAMED_ROW, container: PHONE_LIST })).toEqual([NAMED_ROW[0]]);
  });

  it('keeps the whole cards in the order given', () => {
    const wideList = { ...PHONE_LIST, width: ROW_CARD_LEFT_PX + 3 * CARD_STEP_PX };
    const reversedRow = [...NAMED_ROW].reverse();

    expect(filterWholeCards({ cards: reversedRow, container: wideList })).toEqual(reversedRow);
  });

  it.each([
    ['no parameters', undefined],
    ['cards that are not a list', { cards: 'cards', container: PHONE_LIST }],
    ['no container', { cards: NAMED_ROW }],
    ['a container at NaN', { cards: NAMED_ROW, container: { ...PHONE_LIST, left: NaN } }],
  ])('keeps no card with %s', (_case, params) => {
    expect(filterWholeCards(params as never)).toEqual([]);
  });

  it('leaves out the entries that are not boxes', () => {
    const cards = [null as never, { src: '/no-box.webp' } as never, NAMED_ROW[0]];

    expect(filterWholeCards({ cards, container: PHONE_LIST })).toEqual([NAMED_ROW[0]]);
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

describe('getBoxCenterDistanceY', () => {
  const cvButton = { x: 735, y: 450, width: 44, height: 44 };

  it('finds no distance between a box and the box it is centered on', () => {
    expect(
      getBoxCenterDistanceY({
        box: { x: 590, y: 456.5, width: 140, height: 31 },
        referenceBox: cvButton,
      }),
    ).toBe(0);
  });

  it.each([
    ['above', { x: 590, y: 455.5, width: 140, height: 31 }, 1],
    ['below', { x: 590, y: 457, width: 140, height: 31 }, 0.5],
    ['far from', { x: 590, y: 0, width: 140, height: 32 }, 456],
  ])('measures a box centered %s the reference', (_name, box, expected) => {
    expect(getBoxCenterDistanceY({ box, referenceBox: cvButton })).toBe(expected);
    expect(getBoxCenterDistanceY({ box: cvButton, referenceBox: box })).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'box',
      { x: 0, y: Number.NaN, width: 32, height: 32 },
      { x: 0, y: 0, width: 32, height: Number.NEGATIVE_INFINITY },
      { x: 590, y: '456', width: 140, height: 31 },
    ])('returns NaN for the box %j', box => {
      expect(getBoxCenterDistanceY({ box: box as never, referenceBox: cvButton })).toBeNaN();
      expect(getBoxCenterDistanceY({ box: cvButton, referenceBox: box as never })).toBeNaN();
    });

    it('returns NaN without boxes', () => {
      expect(getBoxCenterDistanceY()).toBeNaN();
    });
  });
});

describe('getBoxBottom', () => {
  it.each([
    [{ x: 1374, y: 361, width: 46, height: 78 }, 439],
    [{ x: 0, y: -20, width: 10, height: 20 }, 0],
    [{ x: 0, y: 12.5, width: 10, height: 0 }, 12.5],
  ])('finds the bottom of %j', (box, expected) => {
    expect(getBoxBottom(box)).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'box',
      { x: 0, y: Number.NaN, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: Number.POSITIVE_INFINITY },
      { x: 0, y: '10', width: 10, height: 10 },
    ])('returns NaN for the box %j', box => {
      expect(getBoxBottom(box as never)).toBeNaN();
    });
  });
});

describe('getBoxRight', () => {
  it.each([
    [{ x: 590, y: 456, width: 140, height: 31 }, 730],
    [{ x: -20, y: 0, width: 20, height: 10 }, 0],
    [{ x: 12.5, y: 0, width: 0, height: 10 }, 12.5],
  ])('finds the right edge of %j', (box, expected) => {
    expect(getBoxRight(box)).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'box',
      { x: Number.NaN, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 10 },
      { x: '10', y: 0, width: 10, height: 10 },
    ])('returns NaN for the box %j', box => {
      expect(getBoxRight(box as never)).toBeNaN();
    });
  });
});

describe('doBoxesOverlapHorizontally', () => {
  const toggle = { x: 1374, y: 411, width: 46, height: 78 };

  it.each([
    ['a button whose right end is under it', { x: 1289, y: 517, width: 127, height: 32 }],
    ['a line of text far above it, across its width', { x: 24, y: -900, width: 1392, height: 18 }],
    ['an icon inside its width', { x: 1380, y: 900, width: 33, height: 32 }],
    [
      'a box overlapping its left edge by half a pixel',
      { x: 1300, y: 411, width: 74.5, height: 78 },
    ],
  ])('finds that %s overlaps it', (_name, box) => {
    expect(doBoxesOverlapHorizontally({ box, otherBox: toggle })).toBe(true);
    expect(doBoxesOverlapHorizontally({ box: toggle, otherBox: box })).toBe(true);
  });

  it.each([
    ['a box ending 14 px before it', { x: 24, y: 411, width: 1336, height: 78 }],
    ['a box touching its left edge', { x: 1300, y: 411, width: 74, height: 78 }],
    ['a box right of it', { x: 1420, y: 411, width: 20, height: 78 }],
  ])('finds that %s does not overlap it', (_name, box) => {
    expect(doBoxesOverlapHorizontally({ box, otherBox: toggle })).toBe(false);
    expect(doBoxesOverlapHorizontally({ box: toggle, otherBox: box })).toBe(false);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'box',
      { x: 1380, y: 0, width: 0, height: 32 },
      { x: 1380, y: 0, width: -10, height: 32 },
      { x: Number.NaN, y: 0, width: 32, height: 32 },
      { x: '1380', y: 0, width: 32, height: 32 },
    ])('finds that the box %j covers nothing', box => {
      expect(doBoxesOverlapHorizontally({ box: box as never, otherBox: toggle })).toBe(false);
      expect(doBoxesOverlapHorizontally({ box: toggle, otherBox: box as never })).toBe(false);
    });

    it('finds no overlap without boxes', () => {
      expect(doBoxesOverlapHorizontally()).toBe(false);
    });
  });
});

describe('isBoxInside', () => {
  const screen = { x: 0, y: 0, width: 800, height: 800 };

  it.each([
    ['a tooltip in the middle of the screen', { x: 590, y: 380, width: 140, height: 31 }],
    ['a box on its top left corner', { x: 0, y: 0, width: 10, height: 10 }],
    ['a box touching its right and bottom edges', { x: 790, y: 790, width: 10, height: 10 }],
    ['the screen itself', screen],
    ['a box without any size', { x: 400, y: 400, width: 0, height: 0 }],
  ])('finds %s inside it', (_name, box) => {
    expect(isBoxInside({ box, container: screen })).toBe(true);
  });

  it.each([
    ['cut by the left edge', { x: -0.5, y: 380, width: 140, height: 31 }],
    ['cut by the right edge', { x: 700, y: 380, width: 100.5, height: 31 }],
    ['cut by the top edge', { x: 590, y: -1, width: 140, height: 31 }],
    ['cut by the bottom edge', { x: 590, y: 780, width: 140, height: 31 }],
    ['wider than the screen', { x: -10, y: 380, width: 820, height: 31 }],
    ['out of the screen', { x: 900, y: 900, width: 10, height: 10 }],
  ])('finds a box %s outside it', (_name, box) => {
    expect(isBoxInside({ box, container: screen })).toBe(false);
  });

  it('measures from the position of the container', () => {
    const container = { x: 100, y: 100, width: 50, height: 50 };

    expect(isBoxInside({ box: { x: 110, y: 110, width: 10, height: 10 }, container })).toBe(true);
    expect(isBoxInside({ box: { x: 90, y: 110, width: 10, height: 10 }, container })).toBe(false);
  });

  describe('edge cases', () => {
    const box = { x: 590, y: 380, width: 140, height: 31 };

    it.each([
      undefined,
      null,
      {},
      'box',
      { x: 0, y: Number.NaN, width: 10, height: 10 },
      { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 10 },
      { x: '0', y: 0, width: 10, height: 10 },
    ])('returns false for the box %j', invalidBox => {
      expect(isBoxInside({ box: invalidBox as never, container: screen })).toBe(false);
      expect(isBoxInside({ box, container: invalidBox as never })).toBe(false);
    });

    it('returns false without any parameters', () => {
      expect(isBoxInside()).toBe(false);
    });
  });
});

describe('getScreenBox', () => {
  it.each([
    [
      { width: 568, height: 320 },
      { x: 0, y: 0, width: 568, height: 320 },
    ],
    [
      { width: 1440, height: 800 },
      { x: 0, y: 0, width: 1440, height: 800 },
    ],
    [
      { width: 0, height: 0 },
      { x: 0, y: 0, width: 0, height: 0 },
    ],
  ])('builds the box of a screen of %j', (viewport, expected) => {
    expect(getScreenBox(viewport)).toEqual(expected);
  });

  it('holds what shows whole on the screen, and not what it cuts', () => {
    const screen = getScreenBox({ width: 568, height: 320 });

    expect(isBoxInside({ box: { x: 230, y: 250, width: 32, height: 32 }, container: screen })).toBe(
      true,
    );
    expect(isBoxInside({ box: { x: 230, y: 305, width: 32, height: 32 }, container: screen })).toBe(
      false,
    );
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      'screen',
      { width: 568 },
      { width: Number.NaN, height: 320 },
      { width: 568, height: Number.POSITIVE_INFINITY },
      { width: '568', height: 320 },
    ])('returns null for the size %j, inside which no box is', viewport => {
      expect(getScreenBox(viewport as never)).toBeNull();
      expect(
        isBoxInside({
          box: { x: 0, y: 0, width: 1, height: 1 },
          container: getScreenBox(viewport as never),
        }),
      ).toBe(false);
    });
  });
});

describe('isGoogleHost', () => {
  it.each([
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'google.com',
    'www.google.com',
    'www.googletagmanager.com',
    'region1.google-analytics.com',
    'stats.g.doubleclick.net',
    'www.youtube-nocookie.com',
    'i.ytimg.com',
    'www.recaptcha.net',
    'google.fr',
    'www.google.co.uk',
    'google.com.br',
    'FONTS.GOOGLEAPIS.COM',
    'fonts.googleapis.com.',
    '  fonts.gstatic.com ',
  ])('finds that %s belongs to Google', host => {
    expect(isGoogleHost(host)).toBe(true);
  });

  it.each([
    'issoufi.fr',
    'localhost',
    '127.0.0.1',
    'notgoogle.com',
    'mygoogleapis.com',
    'google.com.example.org',
    'googleapis.com.evil.net',
    'fonts.bunny.net',
    'github.com',
    '',
  ])('finds that %j does not belong to Google', host => {
    expect(isGoogleHost(host)).toBe(false);
  });

  it.each([undefined, null, 42, {}, ['google.com']])('finds no Google host in %j', host => {
    expect(isGoogleHost(host)).toBe(false);
  });
});

describe('isGoogleUrl', () => {
  it.each([
    'https://fonts.googleapis.com/css2?family=Montserrat&display=swap',
    'https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm459WlhyyTh89Y.woff2',
    'http://www.google-analytics.com/collect',
    'https://www.google.fr/',
    'wss://www.youtube.com/socket',
    'https://fonts.googleapis.com:443/css2',
  ])('finds that %s goes to Google', url => {
    expect(isGoogleUrl(url)).toBe(true);
  });

  it.each([
    'http://localhost:4173/fonts/montserrat-latin.woff2',
    'https://issoufi.fr/en/projects',
    'https://example.org/?next=https://fonts.googleapis.com/css2',
    'https://github.com/AIssoufi',
    'data:font/woff2;base64,d09GMg==',
    'blob:http://localhost:4173/0f2a',
    'about:blank',
    'chrome-extension://google.com/script.js',
  ])('finds that %s does not go to Google', url => {
    expect(isGoogleUrl(url)).toBe(false);
  });

  it.each([
    undefined,
    null,
    42,
    {},
    '',
    'fonts.googleapis.com',
    '//fonts.googleapis.com',
    'http://',
  ])('finds no Google request in %j, not an absolute URL', url => {
    expect(isGoogleUrl(url)).toBe(false);
  });
});

describe('getScreenCenter', () => {
  it.each([
    [
      { width: 568, height: 320 },
      { x: 284, y: 160 },
    ],
    [
      { width: 375, height: 667 },
      { x: 187.5, y: 333.5 },
    ],
    [
      { width: 0, height: 0 },
      { x: 0, y: 0 },
    ],
  ])('finds the middle of a screen of %j', (viewport, expected) => {
    expect(getScreenCenter(viewport)).toEqual(expected);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      { height: 320 },
      { width: Number.NaN, height: 320 },
      { width: 568, height: Number.NEGATIVE_INFINITY },
      { width: 568, height: '320' },
    ])('returns null for the size %j', viewport => {
      expect(getScreenCenter(viewport as never)).toBeNull();
    });
  });
});

describe('findSkippedHeadingLevels', () => {
  it('finds no skip in headings that go down one level at a time, and back up', () => {
    expect(findSkippedHeadingLevels([1, 2, 3, 4, 3, 4, 4, 2, 3, 2, 3, 4])).toEqual([]);
  });

  it('finds a heading two levels deeper than the one before it', () => {
    expect(findSkippedHeadingLevels([1, 3, 3, 2, 3, 4, 2])).toEqual([{ index: 1, level: 3 }]);
  });

  it('compares each heading with the one right before it, not with the deepest one', () => {
    expect(findSkippedHeadingLevels([1, 2, 3, 2, 4])).toEqual([{ index: 4, level: 4 }]);
  });

  it('compares a heading with the one before it even when that one skipped a level', () => {
    expect(findSkippedHeadingLevels([1, 3, 4, 6])).toEqual([
      { index: 1, level: 3 },
      { index: 3, level: 6 },
    ]);
  });

  it.each([
    ['a h1', [1], []],
    ['a h2', [2], [{ index: 0, level: 2 }]],
    ['a h6', [6], [{ index: 0, level: 6 }]],
  ])('accepts only a h1 as the first heading, given %s', (_case, levels, expected) => {
    expect(findSkippedHeadingLevels(levels)).toEqual(expected);
  });

  it('lets a heading go back up to any level', () => {
    expect(findSkippedHeadingLevels([1, 2, 3, 4, 5, 6, 1, 2])).toEqual([]);
  });

  it.each([0, 7, -1, 2.5, Number.NaN, '2', null, undefined])(
    'counts the level %j, which no heading has, as a skip, and goes on from the last valid one',
    level => {
      expect(findSkippedHeadingLevels([1, level, 2])).toEqual([{ index: 1, level }]);
    },
  );

  it.each([[[]], [undefined], [null], ['1, 2, 3'], [{ 0: 1 }]])(
    'finds no skip in %j, which holds no heading',
    levels => {
      expect(findSkippedHeadingLevels(levels as never)).toEqual([]);
    },
  );
});

describe('countOccurrences', () => {
  it('counts every occurrence of a text', () => {
    expect(
      countOccurrences({ text: 'août 2021 à Aujourd’hui · août 2021', searched: 'août 2021' }),
    ).toBe(2);
  });

  it('counts a single occurrence, at the start, the middle or the end', () => {
    expect(countOccurrences({ text: 'mai 2017 à août 2017', searched: 'mai 2017' })).toBe(1);
    expect(countOccurrences({ text: 'Stage mai 2017 à août 2017 3 mois', searched: 'à' })).toBe(1);
    expect(countOccurrences({ text: 'mai 2017 à août 2017', searched: 'août 2017' })).toBe(1);
  });

  it('counts no occurrence of an absent text, or of one that differs in case', () => {
    expect(countOccurrences({ text: 'août 2021 ↓ Aujourd’hui', searched: 'août 2021 à' })).toBe(0);
    expect(countOccurrences({ text: 'Aujourd’hui', searched: 'aujourd’hui' })).toBe(0);
  });

  it('counts occurrences that would overlap only once', () => {
    expect(countOccurrences({ text: 'aaa', searched: 'aa' })).toBe(1);
  });

  it.each([
    ['an empty searched text', { text: 'août 2021', searched: '' }],
    ['an empty text', { text: '', searched: 'août 2021' }],
    ['no searched text', { text: 'août 2021' }],
    ['no text', { searched: 'août 2021' }],
    ['a text that is not a string', { text: 2021, searched: '2021' }],
    ['a searched text that is not a string', { text: 'août 2021', searched: 2021 }],
    ['null values', { text: null, searched: null }],
  ])('counts 0 with %s', (_case, params) => {
    expect(countOccurrences(params)).toBe(0);
  });

  it('counts 0 without parameters', () => {
    expect(countOccurrences()).toBe(0);
  });
});

describe('getButtonAimPoints', () => {
  it('aims at the center of a pill, then at 9 points along the straight part of its top edge', () => {
    expect(getButtonAimPoints({ x: 100, y: 600, width: 300, height: 46 })).toEqual([
      { x: 250, y: 623 },
      ...[123, 154.75, 186.5, 218.25, 250, 281.75, 313.5, 345.25, 377].map(x => ({ x, y: 601 })),
    ]);
  });

  it('aims at the middle of the top edge of a button narrower than it is high', () => {
    expect(getButtonAimPoints({ x: 0, y: 0, width: 20, height: 40 })).toEqual([
      { x: 10, y: 20 },
      ...Array.from({ length: 9 }, () => ({ x: 10, y: 1 })),
    ]);
  });

  it.each([
    ['a missing box', undefined],
    ['null', null],
    ['a box without width', { x: 0, y: 0, width: 0, height: 46 }],
    ['a box without height', { x: 0, y: 0, width: 300, height: 0 }],
    ['a box of negative width', { x: 0, y: 0, width: -300, height: 46 }],
    ['a box of negative height', { x: 0, y: 0, width: 300, height: -46 }],
    ['a box of NaN', { x: Number.NaN, y: 0, width: 300, height: 46 }],
    ['a box of strings', { x: '0', y: '0', width: '300', height: '46' }],
  ])('aims at no point of %s', (_case, box) => {
    expect(getButtonAimPoints(box as never)).toEqual([]);
  });
});
