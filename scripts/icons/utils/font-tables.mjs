// @ts-check
// Reads the glyph of a character and its advance in the cmap, hhea and hmtx tables of a font.
import { createByteReader } from './byte-reader.mjs';
import {
  CMAP_SUBTABLE_COUNT_OFFSET,
  GLYPH_ID_MODULO,
  HHEA_METRIC_COUNT_OFFSET,
  LONG_HOR_METRIC_BYTES,
  SEGMENT_COUNT_X2_OFFSET,
  SEGMENT_MAPPING_FORMAT,
  SEGMENT_MAPPING_HEADER_BYTES,
  UINT16_BYTES,
  WINDOWS_PLATFORM_ID,
  WINDOWS_UNICODE_BMP_ENCODING_ID,
} from './constants.mjs';

/**
 * Tells whether an encoding record of the cmap table is the Unicode BMP one of Windows.
 * @param {{ platformId: number, encodingId: number }} record - Encoding record of the cmap table.
 * @returns {boolean} True for the platform 3, encoding 1.
 */
const isWindowsUnicodeRecord = ({ platformId, encodingId }) =>
  platformId === WINDOWS_PLATFORM_ID && encodingId === WINDOWS_UNICODE_BMP_ENCODING_ID;

/**
 * Wraps a glyph ID computed with a delta around the 16 bits of an ID, as the cmap table does.
 * @param {number} glyphId - Glyph ID plus its delta, possibly negative or past 65535.
 * @returns {number} The glyph ID, from 0 to 65535.
 */
const wrapGlyphId = glyphId => (glyphId + GLYPH_ID_MODULO) % GLYPH_ID_MODULO;

/**
 * Parameters of {@link findGlyphIndex}.
 * @typedef {object} FindGlyphIndexParams
 * @property {Buffer} cmap - The cmap table of the font.
 * @property {number} codePoint - Unicode code point of the character, e.g. `0x41` for `A`.
 */

/**
 * Finds the glyph of a character in the cmap table of a font, in its Windows Unicode BMP
 * subtable, of format 4, which every web font has: the first segment that ends at or after the
 * character maps it with a delta, or through its array of glyph IDs.
 * @param {FindGlyphIndexParams} params
 * @returns {number} The glyph ID, 0 (the missing glyph) for a character the font does not draw.
 * @throws {Error} When the font has no format 4 Windows Unicode subtable.
 * @example
 * findGlyphIndex({ cmap, codePoint: 'A'.codePointAt(0) }); // 4 in the display font of the site
 */
export const findGlyphIndex = ({ cmap, codePoint }) => {
  const reader = createByteReader(cmap);
  reader.skip(CMAP_SUBTABLE_COUNT_OFFSET);
  const subtableCount = reader.u16();
  const records = Array.from({ length: subtableCount }, () => ({
    platformId: reader.u16(),
    encodingId: reader.u16(),
    offset: reader.u32(),
  }));
  const subtableOffset = records
    .filter(isWindowsUnicodeRecord)
    .map(({ offset }) => offset)
    .find(offset => cmap.readUInt16BE(offset) === SEGMENT_MAPPING_FORMAT);
  if (subtableOffset === undefined) throw new Error('The font has no format 4 Unicode cmap');

  // Four arrays of one 16-bit value per segment follow the header, the first one followed by a
  // reserved value: the end codes, the start codes, the deltas and the range offsets
  const segmentCount = cmap.readUInt16BE(subtableOffset + SEGMENT_COUNT_X2_OFFSET) / 2;
  const arrayBytes = segmentCount * UINT16_BYTES;
  const endCodesOffset = subtableOffset + SEGMENT_MAPPING_HEADER_BYTES;
  const startCodesOffset = endCodesOffset + arrayBytes + UINT16_BYTES;
  const deltasOffset = startCodesOffset + arrayBytes;
  const rangeOffsetsOffset = deltasOffset + arrayBytes;

  const segment = Array.from({ length: segmentCount }, (_, index) => index).find(
    index => cmap.readUInt16BE(endCodesOffset + index * UINT16_BYTES) >= codePoint,
  );
  if (segment === undefined) return 0;

  const startCode = cmap.readUInt16BE(startCodesOffset + segment * UINT16_BYTES);
  if (startCode > codePoint) return 0;

  const delta = cmap.readInt16BE(deltasOffset + segment * UINT16_BYTES);
  const rangeOffsetPosition = rangeOffsetsOffset + segment * UINT16_BYTES;
  const rangeOffset = cmap.readUInt16BE(rangeOffsetPosition);
  if (rangeOffset === 0) return wrapGlyphId(codePoint + delta);

  // The range offset counts from its own position to the glyph ID of the start code
  const glyphIdPosition =
    rangeOffsetPosition + rangeOffset + (codePoint - startCode) * UINT16_BYTES;
  const glyphId = cmap.readUInt16BE(glyphIdPosition);
  return glyphId === 0 ? 0 : wrapGlyphId(glyphId + delta);
};

/**
 * Parameters of {@link readAdvanceWidth}.
 * @typedef {object} ReadAdvanceWidthParams
 * @property {Buffer} hhea - The hhea table of the font.
 * @property {Buffer} hmtx - The hmtx table of the font, untransformed.
 * @property {number} glyphIndex - ID of the glyph.
 */

/**
 * Reads the advance width of a glyph in the hmtx table: the glyphs past the last long metric
 * share its advance, as in a monospaced run.
 * @param {ReadAdvanceWidthParams} params
 * @returns {number} The advance width, in font units.
 */
export const readAdvanceWidth = ({ hhea, hmtx, glyphIndex }) => {
  const metricCount = hhea.readUInt16BE(HHEA_METRIC_COUNT_OFFSET);
  const metricIndex = Math.min(glyphIndex, metricCount - 1);
  return hmtx.readUInt16BE(metricIndex * LONG_HOR_METRIC_BYTES);
};
