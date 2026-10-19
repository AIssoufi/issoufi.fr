// @ts-check
// Reads the outlines of glyphs from a WOFF2 font file, such as the web fonts of public/fonts/, so
// that `pnpm icons` draws the logo as vector paths, which an SVG favicon renders without its font.
// It reads only what that needs: the cmap, head, hhea and hmtx tables, and the simple glyphs of
// the glyf table that WOFF2 transforms, as the specification describes them:
// https://www.w3.org/TR/WOFF2/
import { brotliDecompressSync } from 'node:zlib';

/** First four bytes of a WOFF2 file: `wOF2`. */
const WOFF2_SIGNATURE = 0x774f4632;

/** Size of the header of a WOFF2 file, before its table directory, in bytes. */
const WOFF2_HEADER_BYTES = 48;

/** Flavor of a font collection, whose directory this reader does not read. */
const COLLECTION_FLAVOR = 0x74746366;

/**
 * Tags of the tables that WOFF2 names by their index in this list, in the low 6 bits of the flags
 * of their entry in the table directory, from its specification.
 */
// prettier-ignore
const KNOWN_TABLE_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca',
  'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
  'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL',
  'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

/** Index of the flags of a table entry that announces an arbitrary tag, written after them. */
const ARBITRARY_TAG_INDEX = 63;

/** Bits of the flags of a table entry that give the index of its tag. */
const TAG_INDEX_MASK = 0x3f;

/** Shift of the flags of a table entry that gives the version of its transform. */
const TRANSFORM_VERSION_SHIFT = 6;

/** Transform version of the glyf and loca tables when they are not transformed. */
const NULL_GLYF_TRANSFORM_VERSION = 3;

/** Largest number of bytes of a UIntBase128 number. */
const UINT_BASE_128_MAX_BYTES = 5;

/** Codes of the 255UInt16 numbers of the transformed glyf table. */
const UINT_255_WORD_CODE = 253;
const UINT_255_ONE_MORE_BYTE_CODE_2 = 254;
const UINT_255_ONE_MORE_BYTE_CODE_1 = 255;
const UINT_255_LOWEST_U_CODE = 253;

/** Offset of the `unitsPerEm` field in the head table, in bytes. */
const HEAD_UNITS_PER_EM_OFFSET = 18;

/** Offset of the `numberOfHMetrics` field in the hhea table, in bytes. */
const HHEA_METRIC_COUNT_OFFSET = 34;

/** Size of a long horizontal metric of the hmtx table: an advance width and a side bearing. */
const LONG_HOR_METRIC_BYTES = 4;

/** Platform and encoding of the cmap subtable of the Unicode BMP characters on Windows. */
const WINDOWS_PLATFORM_ID = 3;
const WINDOWS_UNICODE_BMP_ENCODING_ID = 1;

/** Format of the cmap subtable that maps the BMP characters by segments. */
const SEGMENT_MAPPING_FORMAT = 4;

/** Size of the header of a cmap format 4 subtable, before its end codes, in bytes. */
const SEGMENT_MAPPING_HEADER_BYTES = 14;

/** Number of glyph IDs of the font, which a 16-bit ID wraps around. */
const GLYPH_ID_MODULO = 0x10000;

/** Size of the header of the transformed glyf table, before its streams, in bytes. */
const TRANSFORMED_GLYF_HEADER_BYTES = 36;

/** Number of contours that marks a composite glyph. */
const COMPOSITE_GLYPH_CONTOUR_COUNT = -1;

/** Flags of a component of a composite glyph that tell the size of its data. */
const ARG_1_AND_2_ARE_WORDS = 0x0001;
const WE_HAVE_A_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
const WE_HAVE_A_TWO_BY_TWO = 0x0080;
const WE_HAVE_INSTRUCTIONS = 0x0100;

/** Bit of the flag of a point of the transformed glyf table set for an off-curve point. */
const OFF_CURVE_FLAG = 0x80;

/**
 * Ends of the ranges of the flags of the triplet encoding, each excluded: below the first one, a
 * point moves vertically, by a delta of one byte; then horizontally, by one byte; then both ways,
 * by one byte, two bytes and three bytes; past the last one, by four bytes.
 */
const TRIPLET_Y_ONLY_END = 10;
const TRIPLET_X_ONLY_END = 20;
const TRIPLET_ONE_BYTE_END = 84;
const TRIPLET_TWO_BYTES_END = 120;
const TRIPLET_THREE_BYTES_END = 124;

/**
 * A point of the outline of a glyph, in font units, with the y axis pointing up.
 * @typedef {object} OutlinePoint
 * @property {number} x - Horizontal position, from the origin of the glyph.
 * @property {number} y - Vertical position, from the baseline.
 * @property {boolean} onCurve - Whether the outline goes through the point, rather than being
 * pulled towards it, as the control point of a quadratic curve.
 */

/**
 * Outline of a glyph and its advance.
 * @typedef {object} GlyphOutline
 * @property {string} character - Character that the glyph draws.
 * @property {number} advanceWidth - Distance to the origin of the next glyph, in font units.
 * @property {OutlinePoint[][]} contours - Closed contours of the glyph, none for a space.
 */

/**
 * Glyphs of a text, as {@link readGlyphOutlines} gives them.
 * @typedef {object} FontOutlines
 * @property {number} unitsPerEm - Font units in an em, the font size.
 * @property {GlyphOutline[]} glyphs - Glyph of each character of the text, in its order.
 */

/**
 * Reader of a buffer, from a position that moves forward with each read.
 * @typedef {object} ByteReader
 * @property {() => number} u8 - Reads an unsigned byte.
 * @property {() => number} u16 - Reads an unsigned 16-bit big-endian integer.
 * @property {() => number} i16 - Reads a signed 16-bit big-endian integer.
 * @property {() => number} u32 - Reads an unsigned 32-bit big-endian integer.
 * @property {(length: number) => Buffer} bytes - Reads a number of bytes.
 * @property {(length: number) => void} skip - Skips a number of bytes.
 * @property {() => number} offset - Gives the position of the next read.
 */

/**
 * Creates a reader of a buffer, from its start.
 * @param {Buffer} buffer - Bytes to read.
 * @returns {ByteReader} The reader.
 * @throws {RangeError} On a read beyond the end of the buffer.
 */
export const createByteReader = buffer => {
  let position = 0;
  /**
   * Moves past a number of bytes, and gives the position they start at.
   * @param {number} length - Number of bytes.
   */
  const advance = length => {
    const start = position;
    if (start + length > buffer.length) {
      throw new RangeError(`Read of ${length} bytes at ${start}, past the end (${buffer.length})`);
    }
    position += length;
    return start;
  };

  return {
    u8: () => buffer.readUInt8(advance(1)),
    u16: () => buffer.readUInt16BE(advance(2)),
    i16: () => buffer.readInt16BE(advance(2)),
    u32: () => buffer.readUInt32BE(advance(4)),
    bytes: length => buffer.subarray(advance(length), position),
    skip: length => {
      advance(length);
    },
    offset: () => position,
  };
};

/**
 * Reads a UIntBase128 number of WOFF2: up to 5 bytes of 7 bits, the highest bit of each one set
 * while another byte follows.
 * @param {ByteReader} reader - Reader at the number.
 * @returns {number} The number.
 * @throws {RangeError} When the number starts with a zero byte, takes more than 5 bytes or
 * overflows 32 bits, as the specification forbids.
 */
export const readUIntBase128 = reader => {
  let value = 0;
  for (let index = 0; index < UINT_BASE_128_MAX_BYTES; index += 1) {
    const byte = reader.u8();
    const hasLeadingZero = index === 0 && byte === 0x80;
    const overflows = value > 0x1ffffff;
    if (hasLeadingZero || overflows) throw new RangeError('Invalid UIntBase128 number');

    value = value * 128 + (byte & 0x7f);
    const isLastByte = (byte & 0x80) === 0;
    if (isLastByte) return value;
  }
  throw new RangeError('UIntBase128 number longer than 5 bytes');
};

/**
 * Reads a 255UInt16 number of the transformed glyf table: one byte for the values below 253, two or
 * three for the others.
 * @param {ByteReader} reader - Reader at the number.
 * @returns {number} The number.
 */
export const readUInt255 = reader => {
  const code = reader.u8();
  if (code === UINT_255_WORD_CODE) return reader.u16();
  if (code === UINT_255_ONE_MORE_BYTE_CODE_1) return reader.u8() + UINT_255_LOWEST_U_CODE;
  if (code === UINT_255_ONE_MORE_BYTE_CODE_2) return reader.u8() + UINT_255_LOWEST_U_CODE * 2;
  return code;
};

/**
 * A table of the font, as WOFF2 stores it.
 * @typedef {object} Woff2Table
 * @property {Buffer} data - Bytes of the table, transformed or not.
 * @property {boolean} isTransformed - Whether WOFF2 transformed the table, as it does by default
 * for glyf and loca.
 */

/**
 * Reads the tables of a WOFF2 file: its table directory, then the Brotli stream that holds every
 * table, one after the other.
 * @param {Buffer} file - Content of the WOFF2 file.
 * @returns {Map<string, Woff2Table>} Each table, by tag.
 * @throws {Error} When the file is not a WOFF2 font, is a collection, or is truncated.
 */
export const readWoff2Tables = file => {
  const reader = createByteReader(file);
  if (reader.u32() !== WOFF2_SIGNATURE) throw new Error('Not a WOFF2 font file');
  if (reader.u32() === COLLECTION_FLAVOR) throw new Error('WOFF2 font collections are not read');

  reader.skip(4);
  const tableCount = reader.u16();
  reader.skip(6);
  const compressedLength = reader.u32();
  reader.skip(WOFF2_HEADER_BYTES - reader.offset());

  const entries = Array.from({ length: tableCount }, () => {
    const flags = reader.u8();
    const tagIndex = flags & TAG_INDEX_MASK;
    const tag =
      tagIndex === ARBITRARY_TAG_INDEX
        ? reader.bytes(4).toString('latin1')
        : KNOWN_TABLE_TAGS[tagIndex];
    const transformVersion = flags >> TRANSFORM_VERSION_SHIFT;
    const isGlyphTable = tag === 'glyf' || tag === 'loca';
    const isTransformed = isGlyphTable
      ? transformVersion !== NULL_GLYF_TRANSFORM_VERSION
      : transformVersion !== 0;
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
 * Parameters of {@link findGlyphIndex}.
 * @typedef {object} FindGlyphIndexParams
 * @property {Buffer} cmap - The cmap table of the font.
 * @property {number} codePoint - Unicode code point of the character, e.g. `0x41` for `A`.
 */

/**
 * Finds the glyph of a character in the cmap table of a font, in its Windows Unicode BMP
 * subtable, of format 4, which every web font has.
 * @param {FindGlyphIndexParams} params
 * @returns {number} The glyph ID, 0 (the missing glyph) for a character the font does not draw.
 * @throws {Error} When the font has no format 4 Windows Unicode subtable.
 */
export const findGlyphIndex = ({ cmap, codePoint }) => {
  const reader = createByteReader(cmap);
  reader.skip(2);
  const subtableCount = reader.u16();
  const records = Array.from({ length: subtableCount }, () => ({
    platformId: reader.u16(),
    encodingId: reader.u16(),
    offset: reader.u32(),
  }));
  const subtableOffset = records
    .filter(
      ({ platformId, encodingId }) =>
        platformId === WINDOWS_PLATFORM_ID && encodingId === WINDOWS_UNICODE_BMP_ENCODING_ID,
    )
    .map(({ offset }) => offset)
    .find(offset => cmap.readUInt16BE(offset) === SEGMENT_MAPPING_FORMAT);
  if (subtableOffset === undefined) throw new Error('The font has no format 4 Unicode cmap');

  const segmentCount = cmap.readUInt16BE(subtableOffset + 6) / 2;
  const endCodesOffset = subtableOffset + SEGMENT_MAPPING_HEADER_BYTES;
  const startCodesOffset = endCodesOffset + segmentCount * 2 + 2;
  const deltasOffset = startCodesOffset + segmentCount * 2;
  const rangeOffsetsOffset = deltasOffset + segmentCount * 2;

  const segment = Array.from({ length: segmentCount }, (_, index) => index).find(
    index => cmap.readUInt16BE(endCodesOffset + index * 2) >= codePoint,
  );
  if (segment === undefined) return 0;

  const startCode = cmap.readUInt16BE(startCodesOffset + segment * 2);
  if (startCode > codePoint) return 0;

  const delta = cmap.readInt16BE(deltasOffset + segment * 2);
  const rangeOffsetPosition = rangeOffsetsOffset + segment * 2;
  const rangeOffset = cmap.readUInt16BE(rangeOffsetPosition);
  if (rangeOffset === 0) return (codePoint + delta + GLYPH_ID_MODULO) % GLYPH_ID_MODULO;

  const glyphId = cmap.readUInt16BE(
    rangeOffsetPosition + rangeOffset + (codePoint - startCode) * 2,
  );
  return glyphId === 0 ? 0 : (glyphId + delta + GLYPH_ID_MODULO) % GLYPH_ID_MODULO;
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

/**
 * Gives the sign of a coordinate delta from a bit of the flag of its point.
 * @param {number} bits - Flag of the point, shifted so that its lowest bit is the sign bit.
 * @returns {number} `1` when the bit is set, `-1` otherwise.
 */
const getSign = bits => ((bits & 1) === 1 ? 1 : -1);

/**
 * Parameters of {@link decodeTriplet}.
 * @typedef {object} DecodeTripletParams
 * @property {number} flag - Flag of the point, without its on-curve bit, from 0 to 127.
 * @property {ByteReader} reader - Reader of the glyph stream, at the bytes of the point.
 */

/**
 * Decodes the delta of a point of the transformed glyf table from its flag and the bytes that
 * follow it in the glyph stream, as the triplet encoding of the WOFF2 specification describes:
 * the range of the flag tells how many bytes hold the deltas, and its other bits, the high bits
 * and the signs of the two deltas. The bit arithmetic is the one of the reference decoder.
 * @param {DecodeTripletParams} params
 * @returns {{ dx: number, dy: number }} The horizontal and vertical deltas from the previous
 * point, in font units.
 */
export const decodeTriplet = ({ flag, reader }) => {
  const xSign = getSign(flag);
  const ySign = getSign(flag >> 1);
  if (flag < TRIPLET_Y_ONLY_END) return { dx: 0, dy: xSign * (((flag & 14) << 7) + reader.u8()) };
  if (flag < TRIPLET_X_ONLY_END) {
    return { dx: xSign * ((((flag - TRIPLET_Y_ONLY_END) & 14) << 7) + reader.u8()), dy: 0 };
  }
  if (flag < TRIPLET_ONE_BYTE_END) {
    const high = flag - TRIPLET_X_ONLY_END;
    const low = reader.u8();
    return {
      dx: xSign * (1 + (high & 0x30) + (low >> 4)),
      dy: ySign * (1 + ((high & 0x0c) << 2) + (low & 0x0f)),
    };
  }
  if (flag < TRIPLET_TWO_BYTES_END) {
    const high = flag - TRIPLET_ONE_BYTE_END;
    return {
      dx: xSign * (1 + (Math.floor(high / 12) << 8) + reader.u8()),
      dy: ySign * (1 + ((high % 12 >> 2) << 8) + reader.u8()),
    };
  }
  if (flag < TRIPLET_THREE_BYTES_END) {
    const [first, second, third] = reader.bytes(3);
    return {
      dx: xSign * ((first << 4) + (second >> 4)),
      dy: ySign * (((second & 0x0f) << 8) + third),
    };
  }
  return { dx: xSign * reader.u16(), dy: ySign * reader.u16() };
};

/**
 * Streams of the transformed glyf table, each read from its start.
 * @typedef {object} GlyfStreams
 * @property {ByteReader} contourCounts - Number of contours of each glyph.
 * @property {ByteReader} pointCounts - Number of points of each contour.
 * @property {ByteReader} flags - Flag of each point.
 * @property {ByteReader} glyphs - Coordinates of the points and instruction lengths.
 * @property {ByteReader} composites - Components of the composite glyphs.
 * @property {ByteReader} instructions - Hinting instructions.
 */

/**
 * Splits the transformed glyf table into its streams.
 * @param {Buffer} glyf - The transformed glyf table.
 * @returns {{ glyphCount: number, streams: GlyfStreams }} The number of glyphs and the streams.
 */
const readGlyfStreams = glyf => {
  const header = createByteReader(glyf);
  header.skip(4);
  const glyphCount = header.u16();
  header.skip(2);
  const [contourCounts, pointCounts, flags, glyphs, composites, boxes, instructions] = Array.from(
    { length: 7 },
    () => header.u32(),
  );
  const body = createByteReader(glyf.subarray(TRANSFORMED_GLYF_HEADER_BYTES));
  const streams = {
    contourCounts: createByteReader(body.bytes(contourCounts)),
    pointCounts: createByteReader(body.bytes(pointCounts)),
    flags: createByteReader(body.bytes(flags)),
    glyphs: createByteReader(body.bytes(glyphs)),
    composites: createByteReader(body.bytes(composites)),
  };
  body.skip(boxes);
  return {
    glyphCount,
    streams: { ...streams, instructions: createByteReader(body.bytes(instructions)) },
  };
};

/**
 * Parameters of {@link readSimpleGlyph}.
 * @typedef {object} ReadSimpleGlyphParams
 * @property {GlyfStreams} streams - Streams, at the glyph.
 * @property {number} contourCount - Number of contours of the glyph.
 */

/**
 * Reads the next simple glyph of the streams: the points of each of its contours, then skips its
 * instructions.
 * @param {ReadSimpleGlyphParams} params
 * @returns {OutlinePoint[][]} Its contours.
 */
const readSimpleGlyph = ({ streams, contourCount }) => {
  const pointCounts = Array.from({ length: contourCount }, () => readUInt255(streams.pointCounts));
  let x = 0;
  let y = 0;
  const contours = pointCounts.map(pointCount =>
    Array.from({ length: pointCount }, () => {
      const flag = streams.flags.u8();
      const { dx, dy } = decodeTriplet({ flag: flag & ~OFF_CURVE_FLAG, reader: streams.glyphs });
      x += dx;
      y += dy;
      return { x, y, onCurve: (flag & OFF_CURVE_FLAG) === 0 };
    }),
  );
  streams.instructions.skip(readUInt255(streams.glyphs));
  return contours;
};

/**
 * Skips the next composite glyph of the streams: its components, then its instructions, if any.
 * @param {GlyfStreams} streams - Streams, at the glyph.
 */
const skipCompositeGlyph = streams => {
  let hasMoreComponents = true;
  let hasInstructions = false;
  while (hasMoreComponents) {
    const flags = streams.composites.u16();
    const argumentBytes = (flags & ARG_1_AND_2_ARE_WORDS) !== 0 ? 4 : 2;
    let scaleBytes = 0;
    if ((flags & WE_HAVE_A_SCALE) !== 0) scaleBytes = 2;
    else if ((flags & WE_HAVE_AN_X_AND_Y_SCALE) !== 0) scaleBytes = 4;
    else if ((flags & WE_HAVE_A_TWO_BY_TWO) !== 0) scaleBytes = 8;
    // The ID of the component glyph, its offset and its scale
    streams.composites.skip(2 + argumentBytes + scaleBytes);
    hasInstructions = hasInstructions || (flags & WE_HAVE_INSTRUCTIONS) !== 0;
    hasMoreComponents = (flags & MORE_COMPONENTS) !== 0;
  }

  if (hasInstructions) streams.instructions.skip(readUInt255(streams.glyphs));
};

/**
 * Parameters of {@link readTransformedGlyphs}.
 * @typedef {object} ReadTransformedGlyphsParams
 * @property {Buffer} glyf - The glyf table, as WOFF2 transforms it.
 * @property {number[]} glyphIndices - IDs of the glyphs to read.
 */

/**
 * Reads the contours of glyphs from the transformed glyf table, whose streams hold every glyph one
 * after the other: it goes through the glyphs in order, up to the last one asked for.
 * @param {ReadTransformedGlyphsParams} params
 * @returns {Map<number, OutlinePoint[][]>} The contours of each glyph asked for, by ID, none for
 * an empty glyph.
 * @throws {Error} When a glyph asked for is composite, made of other glyphs, or past the last one.
 */
export const readTransformedGlyphs = ({ glyf, glyphIndices }) => {
  const { glyphCount, streams } = readGlyfStreams(glyf);
  const lastIndex = Math.max(...glyphIndices);
  if (lastIndex >= glyphCount) throw new Error(`The font has no glyph ${lastIndex}`);

  /** @type {Map<number, OutlinePoint[][]>} */
  const outlines = new Map();
  for (let index = 0; index <= lastIndex; index += 1) {
    const contourCount = streams.contourCounts.i16();
    const isWanted = glyphIndices.includes(index);
    if (contourCount === COMPOSITE_GLYPH_CONTOUR_COUNT) {
      if (isWanted) throw new Error(`Glyph ${index} is composite, which is not read`);
      skipCompositeGlyph(streams);
    } else {
      const contours = contourCount > 0 ? readSimpleGlyph({ streams, contourCount }) : [];
      if (isWanted) outlines.set(index, contours);
    }
  }
  return outlines;
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
 * @throws {Error} When the file is not a WOFF2 font, its glyf table is not transformed, the font
 * draws a character of the text with its missing glyph, or with a composite glyph.
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
  const characters = [...text];
  const glyphIndices = characters.map(character => {
    const glyphIndex = findGlyphIndex({ cmap, codePoint: character.codePointAt(0) ?? 0 });
    if (glyphIndex === 0) throw new Error(`The font does not draw ${JSON.stringify(character)}`);
    return glyphIndex;
  });
  const outlines = readTransformedGlyphs({ glyf: glyf.data, glyphIndices });

  return {
    unitsPerEm: getPlainTable({ tables, tag: 'head' }).readUInt16BE(HEAD_UNITS_PER_EM_OFFSET),
    glyphs: characters.map((character, index) => ({
      character,
      advanceWidth: readAdvanceWidth({ hhea, hmtx, glyphIndex: glyphIndices[index] }),
      contours: outlines.get(glyphIndices[index]) ?? [],
    })),
  };
};
