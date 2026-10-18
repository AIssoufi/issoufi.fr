import { PAGES } from '../src/utils/pages';
import { MAX_DOT_OFFSET_PX, NOT_FOUND_ROUTE } from './constants';
import {
  doBoxesOverlap,
  getCenterDistanceX,
  getCheckedRoutes,
  getQuadCenterX,
  isInBottomLeftCorner,
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

describe('doBoxesOverlap', () => {
  const badge = { x: 20, y: 738, width: 160, height: 42 };

  it.each([
    ['a line of text across it', { x: 0, y: 750, width: 320, height: 18 }],
    ['an icon inside it', { x: 30, y: 745, width: 16, height: 16 }],
    ['a card around it', { x: 0, y: 600, width: 320, height: 400 }],
    ['a box covering one pixel of its corner', { x: 179, y: 779, width: 10, height: 10 }],
  ])('finds that %s overlaps the badge', (_name, box) => {
    expect(doBoxesOverlap({ box, otherBox: badge })).toBe(true);
    expect(doBoxesOverlap({ box: badge, otherBox: box })).toBe(true);
  });

  it.each([
    ['a line of text above it', { x: 0, y: 700, width: 320, height: 18 }],
    ['a line of text touching its top edge', { x: 0, y: 720, width: 320, height: 18 }],
    ['a box touching its right edge', { x: 180, y: 738, width: 40, height: 42 }],
    ['a box right of it at the same height', { x: 200, y: 738, width: 40, height: 42 }],
    ['a box below the screen', { x: 20, y: 900, width: 160, height: 42 }],
  ])('finds that %s does not overlap the badge', (_name, box) => {
    expect(doBoxesOverlap({ box, otherBox: badge })).toBe(false);
    expect(doBoxesOverlap({ box: badge, otherBox: box })).toBe(false);
  });

  describe('edge cases', () => {
    it.each([
      undefined,
      null,
      {},
      { x: 30, y: 745, width: 0, height: 16 },
      { x: 30, y: 745, width: 16, height: -16 },
      { x: Number.NaN, y: 745, width: 16, height: 16 },
      { x: 30, y: Number.POSITIVE_INFINITY, width: 16, height: 16 },
      { x: '30', y: 745, width: 16, height: 16 },
      'box',
    ])('finds that the box %j covers nothing', box => {
      expect(doBoxesOverlap({ box: box as never, otherBox: badge })).toBe(false);
      expect(doBoxesOverlap({ box: badge, otherBox: box as never })).toBe(false);
    });

    it('finds no overlap without boxes', () => {
      expect(doBoxesOverlap()).toBe(false);
      expect(doBoxesOverlap({})).toBe(false);
    });
  });
});

describe('isInBottomLeftCorner', () => {
  const screen = { width: 320, height: 800 };

  it.each([
    [
      'the site badge on a narrow screen, wider than half of it',
      { x: 20, y: 738, width: 180, height: 42 },
    ],
    ['a box touching the corner', { x: 0, y: 758, width: 160, height: 42 }],
  ])('finds %s in the corner', (_name, box) => {
    expect(isInBottomLeftCorner({ box, screen })).toBe(true);
  });

  it.each([
    ['as near the right edge as the left one', { x: 20, y: 738, width: 280, height: 42 }],
    ['as near the top edge as the bottom one', { x: 20, y: 20, width: 160, height: 760 }],
    ['in the top left corner', { x: 20, y: 20, width: 160, height: 42 }],
    ['in the bottom right corner', { x: 140, y: 738, width: 160, height: 42 }],
    ['partly left of the screen', { x: -1, y: 738, width: 160, height: 42 }],
    ['partly below the screen', { x: 20, y: 759, width: 160, height: 42 }],
    ['below the screen', { x: 20, y: 900, width: 160, height: 42 }],
  ])('finds a box %s out of the corner', (_name, box) => {
    expect(isInBottomLeftCorner({ box, screen })).toBe(false);
  });

  describe('edge cases', () => {
    it.each([undefined, null, {}, { x: 20, y: 738, width: 0, height: 42 }, 'box'])(
      'finds the box %j out of the corner',
      box => {
        expect(isInBottomLeftCorner({ box: box as never, screen })).toBe(false);
      },
    );

    it.each([undefined, null, {}, { width: 0, height: 800 }, { width: 320, height: Number.NaN }])(
      'finds any box out of the corner of the screen %j',
      invalidScreen => {
        const box = { x: 20, y: 738, width: 160, height: 42 };
        expect(isInBottomLeftCorner({ box, screen: invalidScreen as never })).toBe(false);
      },
    );

    it('finds nothing in the corner without a box nor a screen', () => {
      expect(isInBottomLeftCorner()).toBe(false);
    });
  });
});
