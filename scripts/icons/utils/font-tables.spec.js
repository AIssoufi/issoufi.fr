// @vitest-environment node
import { readFileSync } from 'node:fs';

import { findGlyphIndex, readAdvanceWidth } from './font-tables.mjs';
import { readWoff2Tables } from './woff2.mjs';

/** Tables of the display font of the site, which draws the logo. */
const LOGO_FONT_TABLES = readWoff2Tables(
  readFileSync('public/fonts/saira-stencil-one-latin.woff2'),
);

/**
 * Builds a cmap table with a Windows Unicode BMP subtable of format 4, whose segments map their
 * characters to glyphs either by a delta or through an array of glyph IDs.
 */
const buildCmap = ({ segments, glyphIds = [] }) => {
  const segmentCount = segments.length;
  // Version 0, one subtable: platform 3, encoding 1, at the offset 12, as two words
  const header = [0, 1, 3, 1, 0, 12];
  const subtable = [
    4,
    0,
    0,
    segmentCount * 2,
    0,
    0,
    0,
    ...segments.map(({ end }) => end),
    0,
    ...segments.map(({ start }) => start),
    ...segments.map(({ delta = 0 }) => (delta + 0x10000) % 0x10000),
    ...segments.map(({ usesGlyphIds }, index) =>
      // From the range offset of the segment to the first glyph ID of the array
      usesGlyphIds ? (segmentCount - index) * 2 : 0,
    ),
    ...glyphIds,
  ];
  const words = [...header, ...subtable];
  const cmap = Buffer.alloc(words.length * 2);
  words.forEach((word, index) => cmap.writeUInt16BE(word, index * 2));
  return cmap;
};

describe('findGlyphIndex', () => {
  const cmap = LOGO_FONT_TABLES.get('cmap').data;

  it('finds the glyphs of the logo in the font', () => {
    expect(findGlyphIndex({ cmap, codePoint: 0x41 })).toBe(4);
    expect(findGlyphIndex({ cmap, codePoint: 0x49 })).toBe(25);
  });

  it.each([0x2192, 0x4e2d, 0xffff, 0x1f600])(
    'gives the missing glyph for U+%s, which the latin subset does not draw',
    codePoint => {
      expect(findGlyphIndex({ cmap, codePoint })).toBe(0);
    },
  );

  it('maps a segment through its delta', () => {
    const table = buildCmap({
      segments: [
        { start: 0x41, end: 0x43, delta: -0x40 },
        { start: 0xffff, end: 0xffff, delta: 1 },
      ],
    });

    expect(findGlyphIndex({ cmap: table, codePoint: 0x41 })).toBe(1);
    expect(findGlyphIndex({ cmap: table, codePoint: 0x43 })).toBe(3);
    expect(findGlyphIndex({ cmap: table, codePoint: 0x40 })).toBe(0);
    expect(findGlyphIndex({ cmap: table, codePoint: 0x44 })).toBe(0);
  });

  it('maps a segment through its array of glyph IDs, a zero one meaning no glyph', () => {
    const table = buildCmap({
      segments: [
        { start: 0x61, end: 0x63, delta: 2, usesGlyphIds: true },
        { start: 0xffff, end: 0xffff, delta: 1 },
      ],
      glyphIds: [10, 0, 30],
    });

    expect(findGlyphIndex({ cmap: table, codePoint: 0x61 })).toBe(12);
    expect(findGlyphIndex({ cmap: table, codePoint: 0x62 })).toBe(0);
    expect(findGlyphIndex({ cmap: table, codePoint: 0x63 })).toBe(32);
  });

  it('gives the missing glyph past the last segment', () => {
    const table = buildCmap({ segments: [{ start: 0x41, end: 0x43, delta: -0x40 }] });

    expect(findGlyphIndex({ cmap: table, codePoint: 0x44 })).toBe(0);
  });

  it('throws on a cmap without a format 4 Windows Unicode subtable', () => {
    const table = Buffer.alloc(14);
    table.writeUInt16BE(1, 2);
    table.writeUInt16BE(1, 4);
    table.writeUInt16BE(0, 6);
    table.writeUInt32BE(12, 8);
    table.writeUInt16BE(6, 12);

    expect(() => findGlyphIndex({ cmap: table, codePoint: 0x41 })).toThrow('format 4');
  });

  it('throws on a truncated cmap', () => {
    expect(() => findGlyphIndex({ cmap: cmap.subarray(0, 6), codePoint: 0x41 })).toThrow(
      RangeError,
    );
  });
});

describe('readAdvanceWidth', () => {
  // Two long metrics: advance widths 500 and 600, then a side bearing per glyph after them
  const hhea = Buffer.alloc(36);
  hhea.writeUInt16BE(2, 34);
  const hmtx = Buffer.from([0x01, 0xf4, 0, 0, 0x02, 0x58, 0, 0, 0, 0]);

  it.each([
    [0, 500],
    [1, 600],
    [2, 600],
    [300, 600],
  ])('gives glyph %d an advance of %d', (glyphIndex, advance) => {
    expect(readAdvanceWidth({ hhea, hmtx, glyphIndex })).toBe(advance);
  });

  it('reads the advances of the logo in the font', () => {
    const hheaTable = LOGO_FONT_TABLES.get('hhea').data;
    const hmtxTable = LOGO_FONT_TABLES.get('hmtx').data;

    expect(readAdvanceWidth({ hhea: hheaTable, hmtx: hmtxTable, glyphIndex: 4 })).toBe(687);
    expect(readAdvanceWidth({ hhea: hheaTable, hmtx: hmtxTable, glyphIndex: 25 })).toBe(330);
  });
});
