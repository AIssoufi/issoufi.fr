// @vitest-environment node
import { readFileSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';

import {
  createByteReader,
  decodeTriplet,
  findGlyphIndex,
  readAdvanceWidth,
  readGlyphOutlines,
  readTransformedGlyphs,
  readUInt255,
  readUIntBase128,
  readWoff2Tables,
} from './woff2.mjs';

/** The display font of the site, which draws the logo. */
const LOGO_FONT_FILE = readFileSync('public/fonts/saira-stencil-one-latin.woff2');

/** The body font of the site, a variable font, for a second WOFF2 file. */
const BODY_FONT_FILE = readFileSync('public/fonts/montserrat-latin.woff2');

/** Reads a buffer of bytes from its start. */
const readerOf = bytes => createByteReader(Buffer.from(bytes));

/** Writes a number as a UIntBase128 of WOFF2. */
const encodeUIntBase128 = value => {
  const bytes = [value % 128];
  for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) {
    bytes.unshift(rest % 128 | 0x80);
  }
  return bytes;
};

/**
 * Builds a WOFF2 file of tables, each one named by its tag in the table directory, with its
 * transform version (0 transforms glyf and loca, and leaves the other tables as they are).
 */
const buildWoff2 = tables => {
  const directory = tables.flatMap(({ tag, data, transformVersion = 0 }) => {
    const isGlyphTable = tag === 'glyf' || tag === 'loca';
    const isTransformed = isGlyphTable ? transformVersion !== 3 : transformVersion !== 0;
    const length = encodeUIntBase128(data.length);
    return [
      (transformVersion << 6) | 63,
      ...Buffer.from(tag, 'latin1'),
      ...length,
      ...(isTransformed ? length : []),
    ];
  });
  const compressed = brotliCompressSync(Buffer.concat(tables.map(({ data }) => data)));
  const header = Buffer.alloc(48);
  header.write('wOF2', 0, 'latin1');
  header.writeUInt32BE(0x00010000, 4);
  header.writeUInt16BE(tables.length, 12);
  header.writeUInt32BE(compressed.length, 20);
  return Buffer.concat([header, Buffer.from(directory), compressed]);
};

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

describe('createByteReader', () => {
  it('reads big-endian integers and bytes, moving forward', () => {
    const reader = readerOf([0x01, 0x02, 0x03, 0xff, 0xfe, 0x00, 0x00, 0x01, 0x00, 0xaa, 0xbb]);

    expect(reader.u8()).toBe(1);
    expect(reader.u16()).toBe(0x0203);
    expect(reader.i16()).toBe(-2);
    expect(reader.u32()).toBe(0x00000100);
    expect(reader.offset()).toBe(9);
    expect([...reader.bytes(2)]).toEqual([0xaa, 0xbb]);
  });

  it('skips bytes', () => {
    const reader = readerOf([1, 2, 3]);
    reader.skip(2);

    expect(reader.u8()).toBe(3);
  });

  it('throws on a read past the end, rather than reading garbage', () => {
    const reader = readerOf([1]);

    expect(() => reader.u16()).toThrow(RangeError);
    expect(() => readerOf([]).u8()).toThrow(RangeError);
    expect(() => readerOf([1, 2]).skip(3)).toThrow(RangeError);
  });
});

describe('readUIntBase128', () => {
  it.each([
    [[0x00], 0],
    [[0x3f], 63],
    [[0x7f], 127],
    [[0x81, 0x00], 128],
    [[0x8f, 0xff, 0xff, 0xff, 0x7f], 0xffffffff],
  ])('reads %j as %d', (bytes, value) => {
    expect(readUIntBase128(readerOf(bytes))).toBe(value);
  });

  it('reads only the bytes of the number', () => {
    const reader = readerOf([0x81, 0x00, 0x05]);
    readUIntBase128(reader);

    expect(reader.u8()).toBe(5);
  });

  it.each([
    ['a leading zero byte', [0x80, 0x01]],
    ['more than 5 bytes', [0x81, 0x81, 0x81, 0x81, 0x81, 0x01]],
    ['more than 32 bits', [0x90, 0x80, 0x80, 0x80, 0x00]],
    ['a truncated number', [0x81]],
  ])('throws on %s', (_, bytes) => {
    expect(() => readUIntBase128(readerOf(bytes))).toThrow(RangeError);
  });
});

describe('readUInt255', () => {
  it.each([
    [[0], 0],
    [[252], 252],
    [[253, 0x01, 0x02], 0x0102],
    [[255, 0], 253],
    [[255, 252], 505],
    [[254, 0], 506],
    [[254, 10], 516],
  ])('reads %j as %d', (bytes, value) => {
    expect(readUInt255(readerOf(bytes))).toBe(value);
  });
});

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
    const reader = readerOf(bytes);

    expect(decodeTriplet({ flag, reader })).toEqual(delta);
    expect(reader.offset()).toBe(bytes.length);
  });
});

describe('readWoff2Tables', () => {
  const tables = readWoff2Tables(LOGO_FONT_FILE);

  it('reads every table of the font, the glyf and loca ones transformed', () => {
    expect([...tables.keys()]).toEqual(
      expect.arrayContaining(['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'glyf', 'loca', 'GPOS']),
    );
    expect(tables.get('glyf').isTransformed).toBe(true);
    expect(tables.get('loca').isTransformed).toBe(true);
    expect(tables.get('head').isTransformed).toBe(false);
    expect(tables.get('cmap').isTransformed).toBe(false);
  });

  it('gives each untransformed table its whole length', () => {
    // The head table of every TrueType font is 54 bytes long, and starts with its version 1.0
    expect(tables.get('head').data).toHaveLength(54);
    expect(tables.get('head').data.readUInt32BE(0)).toBe(0x00010000);
  });

  it('reads a table whose tag the directory writes in full, and its transform', () => {
    const font = buildWoff2([
      { tag: 'Abcd', data: Buffer.from([1, 2, 3]) },
      { tag: 'glyf', data: Buffer.from([4, 5]) },
      { tag: 'loca', data: Buffer.from([6]), transformVersion: 3 },
    ]);

    expect([...readWoff2Tables(font)]).toEqual([
      ['Abcd', { data: Buffer.from([1, 2, 3]), isTransformed: false }],
      ['glyf', { data: Buffer.from([4, 5]), isTransformed: true }],
      ['loca', { data: Buffer.from([6]), isTransformed: false }],
    ]);
  });

  it('reads the other web font of the site', () => {
    expect(readWoff2Tables(BODY_FONT_FILE).get('glyf').isTransformed).toBe(true);
  });

  it.each([
    ['a file that is not a WOFF2 font', readFileSync('public/favicon.svg')],
    ['an empty file', Buffer.alloc(0)],
    ['a truncated font', LOGO_FONT_FILE.subarray(0, 100)],
  ])('throws on %s', (_, file) => {
    expect(() => readWoff2Tables(file)).toThrow();
  });

  it('throws on a font collection, whose directory it does not read', () => {
    const collection = Buffer.from(LOGO_FONT_FILE);
    collection.write('ttcf', 4, 'latin1');

    expect(() => readWoff2Tables(collection)).toThrow('collections');
  });
});

describe('findGlyphIndex', () => {
  const cmap = readWoff2Tables(LOGO_FONT_FILE).get('cmap').data;

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

  it('throws on a cmap without a format 4 Windows Unicode subtable', () => {
    const table = Buffer.alloc(14);
    table.writeUInt16BE(1, 2);
    table.writeUInt16BE(1, 4);
    table.writeUInt16BE(0, 6);
    table.writeUInt32BE(12, 8);
    table.writeUInt16BE(6, 12);

    expect(() => findGlyphIndex({ cmap: table, codePoint: 0x41 })).toThrow('format 4');
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
});

describe('readTransformedGlyphs', () => {
  const tables = readWoff2Tables(LOGO_FONT_FILE);
  const glyf = tables.get('glyf').data;
  const glyphCount = tables.get('maxp').data.readUInt16BE(4);
  const head = tables.get('head').data;
  const fontBox = {
    minX: head.readInt16BE(36),
    minY: head.readInt16BE(38),
    maxX: head.readInt16BE(40),
    maxY: head.readInt16BE(42),
  };

  it('reads the I of the logo, a rectangle of four on-curve points', () => {
    const outlines = readTransformedGlyphs({ glyf, glyphIndices: [25] });

    // Clockwise from the top left corner, as TrueType draws an outer contour
    expect(outlines.get(25)).toEqual([
      [
        { x: 65, y: 688, onCurve: true },
        { x: 265, y: 688, onCurve: true },
        { x: 265, y: 0, onCurve: true },
        { x: 65, y: 0, onCurve: true },
      ],
    ]);
  });

  it('reads no contour for an empty glyph, as the space', () => {
    const space = findGlyphIndex({ cmap: tables.get('cmap').data, codePoint: 0x20 });

    expect(readTransformedGlyphs({ glyf, glyphIndices: [space] }).get(space)).toEqual([]);
  });

  it('reads every simple glyph, after the composite ones, within the box of the font', () => {
    const simpleIndices = Array.from({ length: glyphCount }, (_, index) => index).filter(index => {
      try {
        readTransformedGlyphs({ glyf, glyphIndices: [index] });
        return true;
      } catch {
        return false;
      }
    });
    const points = [...readTransformedGlyphs({ glyf, glyphIndices: simpleIndices }).values()].flat(
      2,
    );

    expect(simpleIndices.length).toBeGreaterThan(glyphCount / 2);
    expect(simpleIndices).toContain(glyphCount - 1);
    points.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(fontBox.minX);
      expect(x).toBeLessThanOrEqual(fontBox.maxX);
      expect(y).toBeGreaterThanOrEqual(fontBox.minY);
      expect(y).toBeLessThanOrEqual(fontBox.maxY);
    });
  });

  it('throws on a composite glyph, as the É, made of other glyphs', () => {
    const glyph = findGlyphIndex({ cmap: tables.get('cmap').data, codePoint: 0xc9 });

    expect(() => readTransformedGlyphs({ glyf, glyphIndices: [glyph] })).toThrow('composite');
  });

  it('throws on a glyph past the last one', () => {
    expect(() => readTransformedGlyphs({ glyf, glyphIndices: [glyphCount] })).toThrow(
      `no glyph ${glyphCount}`,
    );
  });
});

describe('readGlyphOutlines', () => {
  it('reads the glyphs of the logo, with their advances, in font units', () => {
    const { unitsPerEm, glyphs } = readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'AI' });

    expect(unitsPerEm).toBe(1000);
    expect(glyphs.map(({ character, advanceWidth }) => [character, advanceWidth])).toEqual([
      ['A', 687],
      ['I', 330],
    ]);
    expect(glyphs[0].contours).toHaveLength(2);
    expect(glyphs[1].contours).toHaveLength(1);
  });

  it('reads the curves of a round glyph as off-curve points', () => {
    const [o] = readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'O' }).glyphs;

    expect(o.contours.flat().some(({ onCurve }) => !onCurve)).toBe(true);
  });

  it('gives no glyph for an empty text', () => {
    expect(readGlyphOutlines({ file: LOGO_FONT_FILE, text: '' }).glyphs).toEqual([]);
  });

  it('throws on a character that the font draws with its missing glyph', () => {
    expect(() => readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'A→' })).toThrow('"→"');
  });

  it('throws on a file that is not a WOFF2 font', () => {
    expect(() => readGlyphOutlines({ file: Buffer.from('wOF2'), text: 'AI' })).toThrow();
  });

  describe('fonts that it does not read', () => {
    const table = Buffer.from([0, 0]);

    it('throws on a font whose glyf table is not transformed', () => {
      const font = buildWoff2([{ tag: 'glyf', data: table, transformVersion: 3 }]);

      expect(() => readGlyphOutlines({ file: font, text: 'AI' })).toThrow('not transformed');
    });

    it('throws on a font without glyf table', () => {
      const font = buildWoff2([{ tag: 'cmap', data: table }]);

      expect(() => readGlyphOutlines({ file: font, text: 'AI' })).toThrow('not transformed');
    });

    it('throws on a font that lacks a table it reads', () => {
      const font = buildWoff2([{ tag: 'glyf', data: table }]);

      expect(() => readGlyphOutlines({ file: font, text: 'AI' })).toThrow('no cmap table');
    });

    it('throws on a font whose hmtx table is transformed', () => {
      const font = buildWoff2([
        { tag: 'cmap', data: table },
        { tag: 'hhea', data: table },
        { tag: 'hmtx', data: table, transformVersion: 1 },
        { tag: 'glyf', data: table },
      ]);

      expect(() => readGlyphOutlines({ file: font, text: 'AI' })).toThrow(
        'hmtx table of the font is transformed',
      );
    });
  });
});
