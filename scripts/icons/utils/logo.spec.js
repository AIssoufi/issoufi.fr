// @vitest-environment node
import { readFileSync } from 'node:fs';

import { APP_ICONS } from '../../../src/utils/icons.ts';
import { ICON_LAYOUTS, MASKABLE_SAFE_ZONE_RADIUS_RATIO } from '../constants.mjs';
import {
  contourToPathData,
  formatCoordinate,
  getHeaderLogo,
  getLogoTransform,
  getMismatchRatio,
  layoutLogo,
  parseEmLength,
  renderIconSvg,
  toLogoPathData,
} from './logo.mjs';
import { readGlyphOutlines } from './woff2.mjs';

/** A point of an outline, on the curve unless said otherwise. */
const point = ({ x, y, onCurve = true }) => ({ x, y, onCurve });

/** A square glyph of 100 font units, from the baseline up. */
const squareGlyph = ({ character, advanceWidth }) => ({
  character,
  advanceWidth,
  contours: [
    [
      point({ x: 0, y: 0 }),
      point({ x: 0, y: 100 }),
      point({ x: 100, y: 100 }),
      point({ x: 100, y: 0 }),
    ],
  ],
});

/** The glyphs of the logo of the site, in its font. */
const siteOutlines = readGlyphOutlines({
  file: readFileSync('public/fonts/saira-stencil-one-latin.woff2'),
  text: 'AI',
});

/** The logo of the site, laid out as `pnpm icons` does. */
const siteLogo = layoutLogo({ outlines: siteOutlines, letterSpacingEm: 0.02 });

describe('parseEmLength', () => {
  it.each([
    ['0.02em', 0.02],
    ['-0.01em', -0.01],
    ['.5em', 0.5],
    ['2em', 2],
    [' 0.02em ', 0.02],
  ])('reads %j as %d ems', (length, ems) => {
    expect(parseEmLength(length)).toBe(ems);
  });

  it.each(['2px', '0.02 em', 'em', '', '0.02EM', undefined, null, 0.02, {}])(
    'gives NaN for %o, which is not a length in ems',
    length => {
      expect(parseEmLength(length)).toBeNaN();
    },
  );
});

describe('getMismatchRatio', () => {
  it('gives the share of the inked pixels that differ', () => {
    expect(getMismatchRatio({ inkedCount: 1000, mismatchCount: 12 })).toBe(0.012);
    expect(getMismatchRatio({ inkedCount: 1000, mismatchCount: 0 })).toBe(0);
    expect(getMismatchRatio({ inkedCount: 1000, mismatchCount: 1000 })).toBe(1);
  });

  it.each([
    { inkedCount: 0, mismatchCount: 0 },
    { inkedCount: 10, mismatchCount: 11 },
    { inkedCount: 10, mismatchCount: -1 },
    { inkedCount: Number.NaN, mismatchCount: 0 },
    { inkedCount: 10, mismatchCount: Number.NaN },
    {},
  ])('fails the check with 1 for %o', comparison => {
    expect(getMismatchRatio(comparison)).toBe(1);
  });
});

describe('layoutLogo', () => {
  it('puts each glyph after the advance of the previous one and the letter spacing', () => {
    const logo = layoutLogo({
      outlines: {
        unitsPerEm: 1000,
        glyphs: [
          squareGlyph({ character: 'A', advanceWidth: 150 }),
          squareGlyph({ character: 'I', advanceWidth: 150 }),
        ],
      },
      letterSpacingEm: 0.05,
    });

    expect(logo.contours.map(contour => contour[0].x)).toEqual([0, 200]);
    expect(logo.box).toEqual({ minX: 0, minY: -100, maxX: 300, maxY: 0 });
    // The letter spacing follows the last glyph too, as in the text
    expect(logo.advance).toBe(400);
  });

  it('flips the y axis, from the font to SVG', () => {
    const logo = layoutLogo({
      outlines: { unitsPerEm: 1000, glyphs: [squareGlyph({ character: 'I', advanceWidth: 100 })] },
      letterSpacingEm: 0,
    });

    expect(logo.contours[0]).toEqual([
      point({ x: 0, y: 0 }),
      point({ x: 0, y: -100 }),
      point({ x: 100, y: -100 }),
      point({ x: 100, y: 0 }),
    ]);
  });

  it('keeps the space of an empty glyph', () => {
    const logo = layoutLogo({
      outlines: {
        unitsPerEm: 1000,
        glyphs: [
          { character: ' ', advanceWidth: 250, contours: [] },
          squareGlyph({ character: 'I', advanceWidth: 100 }),
        ],
      },
      letterSpacingEm: 0,
    });

    expect(logo.box.minX).toBe(250);
    expect(logo.advance).toBe(350);
  });

  it('gives an empty box to a logo without contours', () => {
    expect(layoutLogo({ outlines: { unitsPerEm: 1000, glyphs: [] }, letterSpacingEm: 0 })).toEqual({
      contours: [],
      box: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      advance: 0,
    });
  });

  it('lays out the logo of the site on its baseline, as wide as its two letters', () => {
    // The A starts 2 units after its origin, and the I ends 65 units before its advance
    expect(siteLogo.box).toEqual({ minX: 2, minY: -688, maxX: 972, maxY: 0 });
    // The advances of the A and the I, 687 and 330 units, each followed by 20 units of spacing
    expect(siteLogo.advance).toBe(1057);
  });
});

describe('getLogoTransform', () => {
  const box = { minX: 0, minY: -50, maxX: 100, maxY: 0 };

  it('gives the logo the width of the layout, centered in the icon', () => {
    expect(
      getLogoTransform({ box, size: 200, layout: { shape: 'square', logoWidthRatio: 0.5 } }),
    ).toEqual({ scale: 1, translateX: 50, translateY: 125 });
  });

  it('shrinks the logo until the corners of its box stay in the safe zone', () => {
    const { scale } = getLogoTransform({
      box,
      size: 200,
      layout: { shape: 'square', logoWidthRatio: 1, safeZoneRadiusRatio: 0.4 },
    });

    expect(scale).toBeCloseTo((0.4 * 200) / (Math.hypot(100, 50) / 2));
    expect(scale).toBeLessThan(2);
  });

  it('keeps the width of a logo that already fits in the safe zone', () => {
    expect(
      getLogoTransform({
        box,
        size: 200,
        layout: { shape: 'square', logoWidthRatio: 0.2, safeZoneRadiusRatio: 0.4 },
      }).scale,
    ).toBeCloseTo(0.4);
  });

  it.each([
    { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    { minX: 0, minY: -50, maxX: 0, maxY: 0 },
    { minX: 10, minY: 0, maxX: 0, maxY: 0 },
  ])('draws no logo for the box %o, which has no area', emptyBox => {
    expect(
      getLogoTransform({ box: emptyBox, size: 64, layout: { shape: 'tile', logoWidthRatio: 0.8 } }),
    ).toEqual({ scale: 0, translateX: 32, translateY: 32 });
  });
});

describe('formatCoordinate', () => {
  it.each([
    [12.5, '12.5'],
    [3, '3'],
    [1.23456, '1.23'],
    [-7.899, '-7.9'],
    [-0.001, '0'],
    [-0, '0'],
  ])('writes %d as %j', (value, text) => {
    expect(formatCoordinate(value)).toBe(text);
  });
});

describe('contourToPathData', () => {
  it('draws lines between on-curve points, and closes the contour', () => {
    expect(
      contourToPathData([
        point({ x: 0, y: 0 }),
        point({ x: 10, y: 0 }),
        point({ x: 10, y: 10 }),
        point({ x: 0, y: 10 }),
      ]),
    ).toBe('M0 0L10 0L10 10L0 10Z');
  });

  it('draws a quadratic curve through an off-curve point', () => {
    expect(
      contourToPathData([
        point({ x: 0, y: 0 }),
        point({ x: 10, y: 0, onCurve: false }),
        point({ x: 10, y: 10 }),
      ]),
    ).toBe('M0 0Q10 0 10 10Z');
  });

  it('adds the on-curve point implied between two off-curve points', () => {
    expect(
      contourToPathData([
        point({ x: 0, y: 0 }),
        point({ x: 10, y: 0, onCurve: false }),
        point({ x: 20, y: 10, onCurve: false }),
        point({ x: 20, y: 20 }),
      ]),
    ).toBe('M0 0Q10 0 15 5Q20 10 20 20Z');
  });

  it('starts on an on-curve point when the contour starts with an off-curve one', () => {
    expect(
      contourToPathData([
        point({ x: 10, y: 0, onCurve: false }),
        point({ x: 10, y: 10 }),
        point({ x: 0, y: 0 }),
      ]),
    ).toBe('M10 10L0 0Q10 0 10 10Z');
  });

  it('draws a contour of off-curve points only from their implied on-curve points', () => {
    expect(
      contourToPathData([
        point({ x: 0, y: 10, onCurve: false }),
        point({ x: 10, y: 10, onCurve: false }),
        point({ x: 10, y: 0, onCurve: false }),
        point({ x: 0, y: 0, onCurve: false }),
      ]),
    ).toBe('M5 10Q10 10 10 5Q10 0 5 0Q0 0 0 5Q0 10 5 10Z');
  });

  it('draws nothing for a contour without points', () => {
    expect(contourToPathData([])).toBe('');
  });
});

describe('toLogoPathData', () => {
  it('scales and moves every contour into the icon, one after the other', () => {
    const contours = [
      [point({ x: 0, y: 0 }), point({ x: 10, y: 0 }), point({ x: 10, y: -10 })],
      [point({ x: 20, y: 0 }), point({ x: 30, y: 0 }), point({ x: 30, y: -10 })],
    ];

    expect(
      toLogoPathData({ contours, transform: { scale: 0.5, translateX: 4, translateY: 8 } }),
    ).toBe('M4 8L9 8L9 3ZM14 8L19 8L19 3Z');
  });

  it('draws nothing for a logo without contours', () => {
    expect(
      toLogoPathData({ contours: [], transform: { scale: 1, translateX: 0, translateY: 0 } }),
    ).toBe('');
  });
});

describe('getHeaderLogo', () => {
  /** Glyphs of a square letter, in a font of the vertical metrics given. */
  const squareOutlines = ({
    unitsPerEm = 1000,
    ascender = 800,
    descender = -200,
    lineGap = 0,
  }) => ({
    unitsPerEm,
    ascender,
    descender,
    lineGap,
    glyphs: [squareGlyph({ character: 'I', advanceWidth: 150 })],
  });

  /** Gives the logo of the header of the glyphs given, laid out with a letter spacing of 0.05em. */
  const getLogo = outlines =>
    getHeaderLogo({ outlines, logo: layoutLogo({ outlines, letterSpacingEm: 0.05 }) });

  it('covers the line of the text, from the ascender to the descender, as wide as its advance', () => {
    expect(getLogo(squareOutlines({}))).toEqual({
      viewBox: '0 -800 200 1000',
      widthEm: 0.2,
      heightEm: 1,
      descentEm: 0.2,
      pathData: 'M0 0L0 -100L100 -100L100 0Z',
    });
  });

  it('shares the line gap of the font between the top and the bottom of the line', () => {
    expect(getLogo(squareOutlines({ lineGap: 100 }))).toMatchObject({
      viewBox: '0 -850 200 1100',
      heightEm: 1.1,
      descentEm: 0.25,
    });
  });

  it('measures its sizes in ems of the font, rounded to a hundred thousandth', () => {
    // The 150 units of the advance and the 102.4 of the spacing, in an em of 2048 units
    expect(getLogo(squareOutlines({ unitsPerEm: 2048 }))).toMatchObject({
      widthEm: 0.12324,
      heightEm: 0.48828,
      descentEm: 0.09766,
    });
  });

  it('draws the logo of the site in the box of the line of its text', () => {
    const logo = getHeaderLogo({ outlines: siteOutlines, logo: siteLogo });

    expect(logo).toMatchObject({
      viewBox: '0 -1135 1057 1574',
      widthEm: 1.057,
      heightEm: 1.574,
      descentEm: 0.439,
    });
    expect(logo.pathData).toBe(
      toLogoPathData({
        contours: siteLogo.contours,
        transform: { scale: 1, translateX: 0, translateY: 0 },
      }),
    );
  });

  it('draws nothing for a logo without contours', () => {
    const outlines = { ...squareOutlines({}), glyphs: [] };

    expect(getLogo(outlines)).toEqual({
      viewBox: '0 -800 0 1000',
      widthEm: 0,
      heightEm: 1,
      descentEm: 0.2,
      pathData: '',
    });
  });

  it.each([0, -1000, Number.NaN, undefined])(
    'throws on a font of %s units per em, which no em could measure',
    unitsPerEm => {
      const outlines = { ...squareOutlines({}), unitsPerEm };

      expect(() => getHeaderLogo({ outlines, logo: siteLogo })).toThrow('no units per em');
    },
  );
});

describe('renderIconSvg', () => {
  const colors = { background: '#000000', foreground: '#ffffff' };
  const render = layout =>
    renderIconSvg({ logo: siteLogo, size: 64, layout, cornerRadiusRatio: 0.2, colors });

  it('draws the logo as a path over the background, in the colors given', () => {
    const svg = render({ shape: 'square', logoWidthRatio: 0.5 });

    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="64" height="64" viewBox="0 0 64 64">/,
    );
    expect(svg).toContain('<rect width="64" height="64" rx="0" fill="#000000"/>');
    expect(svg).toMatch(/<path d="M[\d. LMQZ-]+" fill="#ffffff"\/><\/svg>\n$/);
    expect(svg).not.toContain('<text');
  });

  it('rounds the corners of a tile', () => {
    expect(render({ shape: 'tile', logoWidthRatio: 0.5 })).toContain('rx="12.8"');
  });

  it('centers the logo in the icon', () => {
    const pathData = render({ shape: 'square', logoWidthRatio: 0.5 }).match(/ d="([^"]*)"/)[1];
    const coordinates = [...pathData.matchAll(/[MLQ ](-?[\d.]+) (-?[\d.]+)/g)].map(([, x, y]) => [
      Number(x),
      Number(y),
    ]);
    const xs = coordinates.map(([x]) => x);
    const ys = coordinates.map(([, y]) => y);

    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(32, 1);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(32, 1);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(32, 1);
  });
});

describe('ICON_LAYOUTS', () => {
  it('lays out every icon of the site', () => {
    expect(Object.keys(ICON_LAYOUTS).sort()).toEqual(Object.keys(APP_ICONS).sort());
  });

  it('keeps the logo of the maskable icon in its safe zone', () => {
    const size = APP_ICONS.maskable.sizePx;
    const { scale } = getLogoTransform({ box: siteLogo.box, size, layout: ICON_LAYOUTS.maskable });
    const halfDiagonal =
      (Math.hypot(siteLogo.box.maxX - siteLogo.box.minX, siteLogo.box.maxY - siteLogo.box.minY) *
        scale) /
      2;

    expect(halfDiagonal).toBeLessThanOrEqual(MASKABLE_SAFE_ZONE_RADIUS_RATIO * size);
  });

  it('keeps the logo of every icon inside it', () => {
    Object.values(ICON_LAYOUTS).forEach(layout => {
      expect(layout.logoWidthRatio).toBeGreaterThan(0);
      expect(layout.logoWidthRatio).toBeLessThan(1);
    });
  });
});
