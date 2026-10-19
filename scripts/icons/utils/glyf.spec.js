// @vitest-environment node
import { readFileSync } from 'node:fs';

import { createByteReader } from './byte-reader.mjs';
import { findGlyphIndex } from './font-tables.mjs';
import { decodeTriplet, readTransformedGlyphs } from './glyf.mjs';
import { readWoff2Tables } from './woff2.mjs';

/** Tables of the display font of the site, which draws the logo. */
const LOGO_FONT_TABLES = readWoff2Tables(
  readFileSync('public/fonts/saira-stencil-one-latin.woff2'),
);

/** Its glyf table, as WOFF2 transforms it. */
const GLYF = LOGO_FONT_TABLES.get('glyf').data;

/** Its number of glyphs, from its maxp table. */
const GLYPH_COUNT = LOGO_FONT_TABLES.get('maxp').data.readUInt16BE(4);

/** Finds the glyph of a character in the font. */
const glyphOf = character =>
  findGlyphIndex({ cmap: LOGO_FONT_TABLES.get('cmap').data, codePoint: character.codePointAt(0) });

describe('decodeTriplet', () => {
  it.each([
    ['moves down by one byte', 0, [5], { dx: 0, dy: -5 }],
    ['moves up by one byte', 1, [5], { dx: 0, dy: 5 }],
    ['adds the high bits of the flag to a vertical move', 3, [5], { dx: 0, dy: 261 }],
    ['moves left by one byte', 10, [7], { dx: -7, dy: 0 }],
    ['moves right by one byte', 11, [7], { dx: 7, dy: 0 }],
    ['splits one byte into two moves, both negative', 20, [0x12], { dx: -2, dy: -3 }],
    ['splits one byte into two moves, both positive', 23, [0x12], { dx: 2, dy: 3 }],
    ['moves both ways by a byte each', 84, [10, 20], { dx: -11, dy: -21 }],
    ['adds the high bits of the flag to each byte', 119, [1, 2], { dx: 514, dy: 515 }],
    ['splits three bytes into 12 bits each', 120, [0x12, 0x34, 0x56], { dx: -291, dy: -1110 }],
    ['splits three bytes, both positive', 123, [0x12, 0x34, 0x56], { dx: 291, dy: 1110 }],
    ['moves both ways by two bytes each', 124, [0x01, 0x00, 0x02, 0x00], { dx: -256, dy: -512 }],
    ['moves by two bytes each, both positive', 127, [0x01, 0x00, 0x02, 0x00], { dx: 256, dy: 512 }],
  ])('%s (flag %d)', (_, flag, bytes, delta) => {
    const reader = createByteReader(Buffer.from(bytes));

    expect(decodeTriplet({ flag, reader })).toEqual(delta);
    expect(reader.offset()).toBe(bytes.length);
  });

  it.each([
    [0, []],
    [84, [10]],
    [120, [0x12, 0x34]],
    [124, [0x01, 0x00, 0x02]],
  ])('throws when the bytes of the flag %d are missing', (flag, bytes) => {
    expect(() => decodeTriplet({ flag, reader: createByteReader(Buffer.from(bytes)) })).toThrow(
      RangeError,
    );
  });
});

describe('readTransformedGlyphs', () => {
  const head = LOGO_FONT_TABLES.get('head').data;
  const fontBox = {
    minX: head.readInt16BE(36),
    minY: head.readInt16BE(38),
    maxX: head.readInt16BE(40),
    maxY: head.readInt16BE(42),
  };

  it('reads the I of the logo, a rectangle of four on-curve points', () => {
    // Clockwise from the top left corner, as TrueType draws an outer contour
    expect(readTransformedGlyphs({ glyf: GLYF, glyphIndices: [25] }).get(25)).toEqual([
      [
        { x: 65, y: 688, onCurve: true },
        { x: 265, y: 688, onCurve: true },
        { x: 265, y: 0, onCurve: true },
        { x: 65, y: 0, onCurve: true },
      ],
    ]);
  });

  it('reads no contour for an empty glyph, as the space', () => {
    const space = glyphOf(' ');

    expect(readTransformedGlyphs({ glyf: GLYF, glyphIndices: [space] }).get(space)).toEqual([]);
  });

  it('reads every simple glyph, after the composite ones, within the box of the font', () => {
    const simpleIndices = Array.from({ length: GLYPH_COUNT }, (_, index) => index).filter(index => {
      try {
        readTransformedGlyphs({ glyf: GLYF, glyphIndices: [index] });
        return true;
      } catch {
        return false;
      }
    });
    const points = [
      ...readTransformedGlyphs({ glyf: GLYF, glyphIndices: simpleIndices }).values(),
    ].flat(2);

    expect(simpleIndices.length).toBeGreaterThan(GLYPH_COUNT / 2);
    expect(simpleIndices).toContain(GLYPH_COUNT - 1);
    points.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(fontBox.minX);
      expect(x).toBeLessThanOrEqual(fontBox.maxX);
      expect(y).toBeGreaterThanOrEqual(fontBox.minY);
      expect(y).toBeLessThanOrEqual(fontBox.maxY);
    });
  });

  it('reads nothing for no glyph', () => {
    expect(readTransformedGlyphs({ glyf: GLYF, glyphIndices: [] })).toEqual(new Map());
  });

  it('throws on a composite glyph, as the É, made of other glyphs', () => {
    expect(() => readTransformedGlyphs({ glyf: GLYF, glyphIndices: [glyphOf('É')] })).toThrow(
      'composite',
    );
  });

  it('throws on a glyph past the last one', () => {
    expect(() => readTransformedGlyphs({ glyf: GLYF, glyphIndices: [GLYPH_COUNT] })).toThrow(
      `no glyph ${GLYPH_COUNT}`,
    );
  });

  it.each([
    ['its header', 20],
    ['its streams', 400],
  ])('throws on a table truncated in %s', (_, length) => {
    expect(() =>
      readTransformedGlyphs({ glyf: GLYF.subarray(0, length), glyphIndices: [25] }),
    ).toThrow(RangeError);
  });
});
