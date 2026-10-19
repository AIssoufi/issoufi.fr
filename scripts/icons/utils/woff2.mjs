// @ts-check
// Reads the outlines of glyphs from a WOFF2 font file, such as the web fonts of public/fonts/, so
// that `pnpm icons` draws the logo as vector paths, which an SVG favicon renders without its font.
// It reads only what that needs, with no font library: the table directory and the Brotli stream
// of the file (https://www.w3.org/TR/WOFF2/), the cmap, head, hhea and hmtx tables
// (`font-tables.mjs`), and the simple glyphs of the glyf table that WOFF2 transforms
// (`glyf.mjs`).
import { brotliDecompressSync } from 'node:zlib';

import { createByteReader, readUIntBase128 } from './byte-reader.mjs';
import {
  ARBITRARY_TAG_INDEX,
  COLLECTION_FLAVOR,
  HEAD_UNITS_PER_EM_OFFSET,
  HHEA_ASCENDER_OFFSET,
  HHEA_DESCENDER_OFFSET,
  HHEA_LINE_GAP_OFFSET,
  KNOWN_TABLE_TAGS,
  NULL_GLYF_TRANSFORM_VERSION,
  TABLE_TAG_BYTES,
  TAG_INDEX_MASK,
  TRANSFORM_VERSION_SHIFT,
  WOFF2_COMPRESSED_LENGTH_OFFSET,
  WOFF2_HEADER_BYTES,
  WOFF2_SIGNATURE,
  WOFF2_TABLE_COUNT_OFFSET,
} from './constants.mjs';
import { findGlyphIndex, readAdvanceWidth } from './font-tables.mjs';
import { readTransformedGlyphs } from './glyf.mjs';

/** @typedef {import('./glyf.mjs').OutlinePoint} OutlinePoint */

/**
 * Outline of a glyph and its advance.
 * @typedef {object} GlyphOutline
 * @property {string} character - Character that the glyph draws.
 * @property {number} advanceWidth - Distance to the origin of the next glyph, in font units.
 * @property {OutlinePoint[][]} contours - Closed contours of the glyph, none for a space.
 */

/**
 * Glyphs of a text, as {@link readGlyphOutlines} gives them, with the vertical metrics of the
 * font, from its hhea table, from which browsers set the height of a line of text in it.
 * @typedef {object} FontOutlines
 * @property {number} unitsPerEm - Font units in an em, the font size.
 * @property {number} ascender - Height of a line above its baseline, in font units.
 * @property {number} descender - Depth of a line below its baseline, in font units, negative.
 * @property {number} lineGap - Space between two lines, in font units, which a browser shares
 * between the top and the bottom of a line.
 * @property {GlyphOutline[]} glyphs - Glyph of each character of the text, in its order.
 */

/**
 * A table of the font, as WOFF2 stores it.
 * @typedef {object} Woff2Table
 * @property {Buffer} data - Bytes of the table, transformed or not.
 * @property {boolean} isTransformed - Whether WOFF2 transformed the table, as it does by default
 * for glyf and loca.
 */

/**
 * Tells whether WOFF2 transformed a table, from the version of the transform of its entry in the
 * table directory: version 0 transforms the glyf and loca tables, and leaves the others as they
 * are.
 * @param {{ tag: string, transformVersion: number }} entry - Tag and transform version of a table.
 * @returns {boolean} True for a transformed table.
 */
const isTransformedTable = ({ tag, transformVersion }) => {
  const isGlyphTable = tag === 'glyf' || tag === 'loca';
  return isGlyphTable ? transformVersion !== NULL_GLYF_TRANSFORM_VERSION : transformVersion !== 0;
};

/**
 * Reads the tables of a WOFF2 file: its table directory, then the Brotli stream that holds every
 * table, one after the other.
 * @param {Buffer} file - Content of the WOFF2 file.
 * @returns {Map<string, Woff2Table>} Each table, by tag.
 * @throws {Error} When the file is not a WOFF2 font, or is a collection.
 * @throws {RangeError} When the file is truncated.
 */
export const readWoff2Tables = file => {
  const reader = createByteReader(file);
  if (reader.u32() !== WOFF2_SIGNATURE) throw new Error('Not a WOFF2 font file');
  if (reader.u32() === COLLECTION_FLAVOR) throw new Error('WOFF2 font collections are not read');

  reader.skip(WOFF2_TABLE_COUNT_OFFSET - reader.offset());
  const tableCount = reader.u16();
  reader.skip(WOFF2_COMPRESSED_LENGTH_OFFSET - reader.offset());
  const compressedLength = reader.u32();
  reader.skip(WOFF2_HEADER_BYTES - reader.offset());

  const entries = Array.from({ length: tableCount }, () => {
    const flags = reader.u8();
    const tagIndex = flags & TAG_INDEX_MASK;
    const tag =
      tagIndex === ARBITRARY_TAG_INDEX
        ? reader.bytes(TABLE_TAG_BYTES).toString('latin1')
        : KNOWN_TABLE_TAGS[tagIndex];
    const isTransformed = isTransformedTable({
      tag,
      transformVersion: flags >> TRANSFORM_VERSION_SHIFT,
    });
    const originalLength = readUIntBase128(reader);
    const length = isTransformed ? readUIntBase128(reader) : originalLength;
    return { tag, length, isTransformed };
  });

  const stream = brotliDecompressSync(reader.bytes(compressedLength));
  const streamReader = createByteReader(stream);
  return new Map(
    entries.map(({ tag, length, isTransformed }) => [
      tag,
      { data: streamReader.bytes(length), isTransformed },
    ]),
  );
};

/**
 * Parameters of {@link getPlainTable}.
 * @typedef {object} GetPlainTableParams
 * @property {Map<string, Woff2Table>} tables - Tables of the font.
 * @property {string} tag - Tag of the table, e.g. `head`.
 */

/**
 * Reads a table that the reader needs, untransformed.
 * @param {GetPlainTableParams} params
 * @returns {Buffer} Its bytes.
 * @throws {Error} When the font has no such table, or WOFF2 transformed it.
 */
const getPlainTable = ({ tables, tag }) => {
  const table = tables.get(tag);
  if (!table) throw new Error(`The font has no ${tag} table`);
  if (table.isTransformed) throw new Error(`The ${tag} table of the font is transformed`);
  return table.data;
};

/**
 * Parameters of {@link readGlyphOutlines}.
 * @typedef {object} ReadGlyphOutlinesParams
 * @property {Buffer} file - Content of a WOFF2 font file whose glyf table is transformed, as the
 * web fonts of `public/fonts/`.
 * @property {string} text - Characters whose glyphs to read, e.g. `AI`.
 */

/**
 * Reads the outlines of the glyphs that draw a text, with their advances, from a WOFF2 font file,
 * as a browser draws the text without kerning.
 * @param {ReadGlyphOutlinesParams} params
 * @returns {FontOutlines} The size of the em and the glyph of each character, in font units.
 * @throws {Error} When the file is not a WOFF2 font, lacks a table it reads, its glyf table is
 * not transformed, or the font draws a character of the text with its missing glyph, or with a
 * composite glyph.
 * @example
 * const file = readFileSync('public/fonts/saira-stencil-one-latin.woff2');
 * readGlyphOutlines({ file, text: 'AI' });
 * // { unitsPerEm: 1000, glyphs: [{ character: 'A', advanceWidth: 687, contours: […] }, …] }
 */
export const readGlyphOutlines = ({ file, text }) => {
  const tables = readWoff2Tables(file);
  const glyf = tables.get('glyf');
  if (!glyf?.isTransformed) throw new Error('The glyf table of the font is not transformed');

  const cmap = getPlainTable({ tables, tag: 'cmap' });
  const hhea = getPlainTable({ tables, tag: 'hhea' });
  const hmtx = getPlainTable({ tables, tag: 'hmtx' });
  // Each character of [...text] is one whole code point
  const characters = [...text];
  const glyphIndices = characters.map(character => {
    const codePoint = /** @type {number} */ (character.codePointAt(0));
    const glyphIndex = findGlyphIndex({ cmap, codePoint });
    if (glyphIndex === 0) throw new Error(`The font does not draw ${JSON.stringify(character)}`);
    return glyphIndex;
  });
  const outlines = readTransformedGlyphs({ glyf: glyf.data, glyphIndices });

  return {
    unitsPerEm: getPlainTable({ tables, tag: 'head' }).readUInt16BE(HEAD_UNITS_PER_EM_OFFSET),
    ascender: hhea.readInt16BE(HHEA_ASCENDER_OFFSET),
    descender: hhea.readInt16BE(HHEA_DESCENDER_OFFSET),
    lineGap: hhea.readInt16BE(HHEA_LINE_GAP_OFFSET),
    glyphs: characters.map((character, index) => ({
      character,
      advanceWidth: readAdvanceWidth({ hhea, hmtx, glyphIndex: glyphIndices[index] }),
      // readTransformedGlyphs gives the contours of every glyph asked for, or throws
      contours: /** @type {OutlinePoint[][]} */ (outlines.get(glyphIndices[index])),
    })),
  };
};
