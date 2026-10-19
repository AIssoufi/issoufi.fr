// @vitest-environment node
import { readFileSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';

import { readGlyphOutlines, readWoff2Tables } from './woff2.mjs';

/** The display font of the site, which draws the logo. */
const LOGO_FONT_FILE = readFileSync('public/fonts/saira-stencil-one-latin.woff2');

/** The body font of the site, a variable font, for a second WOFF2 file. */
const BODY_FONT_FILE = readFileSync('public/fonts/montserrat-latin.woff2');

/** Writes a number as a UIntBase128 of WOFF2. */
const encodeUIntBase128 = value => {
  const bytes = [value % 128];
  for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) {
    bytes.unshift((rest % 128) | 0x80);
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
      { tag: 'hmtx', data: Buffer.from([7]), transformVersion: 1 },
    ]);

    expect([...readWoff2Tables(font)]).toEqual([
      ['Abcd', { data: Buffer.from([1, 2, 3]), isTransformed: false }],
      ['glyf', { data: Buffer.from([4, 5]), isTransformed: true }],
      ['loca', { data: Buffer.from([6]), isTransformed: false }],
      ['hmtx', { data: Buffer.from([7]), isTransformed: true }],
    ]);
  });

  it('reads the other web font of the site', () => {
    expect(readWoff2Tables(BODY_FONT_FILE).get('glyf').isTransformed).toBe(true);
  });

  it('throws on a file that is not a WOFF2 font', () => {
    expect(() => readWoff2Tables(readFileSync('public/favicon.svg'))).toThrow('Not a WOFF2');
  });

  it.each([
    ['an empty file', Buffer.alloc(0)],
    ['a header without its directory', LOGO_FONT_FILE.subarray(0, 48)],
    ['a font truncated in its Brotli stream', LOGO_FONT_FILE.subarray(0, 1000)],
  ])('throws on %s', (_, file) => {
    expect(() => readWoff2Tables(file)).toThrow(RangeError);
  });

  it('throws on a font collection, whose directory it does not read', () => {
    const collection = Buffer.from(LOGO_FONT_FILE);
    collection.write('ttcf', 4, 'latin1');

    expect(() => readWoff2Tables(collection)).toThrow('collections');
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

  it('gives a space no contour, and a character met twice the same glyph each time', () => {
    const { glyphs } = readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'I I' });

    expect(glyphs.map(({ contours }) => contours.length)).toEqual([1, 0, 1]);
    expect(glyphs[2]).toEqual(glyphs[0]);
  });

  it('gives no glyph for an empty text', () => {
    expect(readGlyphOutlines({ file: LOGO_FONT_FILE, text: '' }).glyphs).toEqual([]);
  });

  it('throws on a character that the font draws with its missing glyph', () => {
    expect(() => readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'A→' })).toThrow('"→"');
  });

  it('throws on a character that the font draws with a composite glyph', () => {
    expect(() => readGlyphOutlines({ file: LOGO_FONT_FILE, text: 'É' })).toThrow('composite');
  });

  it('throws on a file that is not a WOFF2 font', () => {
    expect(() => readGlyphOutlines({ file: Buffer.from('wOF2'), text: 'AI' })).toThrow(RangeError);
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
