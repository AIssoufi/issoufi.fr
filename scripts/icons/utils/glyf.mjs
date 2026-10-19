// @ts-check
// Reads the outlines of the simple glyphs of a glyf table that WOFF2 transforms: its streams hold
// every glyph one after the other, the coordinates of their points in the triplet encoding of
// https://www.w3.org/TR/WOFF2/#glyf_table_format.
import { createByteReader, readUInt255 } from './byte-reader.mjs';
import {
  ARG_1_AND_2_ARE_WORDS,
  COMPONENT_BYTE_ARGUMENTS_BYTES,
  COMPONENT_SCALE_BYTES,
  COMPONENT_TWO_BY_TWO_BYTES,
  COMPONENT_WORD_ARGUMENTS_BYTES,
  COMPONENT_X_AND_Y_SCALE_BYTES,
  COMPOSITE_GLYPH_CONTOUR_COUNT,
  GLYF_STREAM_COUNT,
  MORE_COMPONENTS,
  OFF_CURVE_FLAG,
  TRANSFORMED_GLYF_GLYPH_COUNT_OFFSET,
  TRANSFORMED_GLYF_HEADER_BYTES,
  TRIPLET_ONE_BYTE_END,
  TRIPLET_THREE_BYTE_LENGTH,
  TRIPLET_THREE_BYTES_END,
  TRIPLET_TWO_BYTES_END,
  TRIPLET_X_ONLY_END,
  TRIPLET_Y_ONLY_END,
  UINT16_BYTES,
  WE_HAVE_A_SCALE,
  WE_HAVE_A_TWO_BY_TWO,
  WE_HAVE_AN_X_AND_Y_SCALE,
  WE_HAVE_INSTRUCTIONS,
} from './constants.mjs';

/** @typedef {import('./byte-reader.mjs').ByteReader} ByteReader */

/**
 * A point of the outline of a glyph, in font units, with the y axis pointing up.
 * @typedef {object} OutlinePoint
 * @property {number} x - Horizontal position, from the origin of the glyph.
 * @property {number} y - Vertical position, from the baseline.
 * @property {boolean} onCurve - Whether the outline goes through the point, rather than being
 * pulled towards it, as the control point of a quadratic curve.
 */

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
      dy: ySign * (1 + (((high % 12) >> 2) << 8) + reader.u8()),
    };
  }
  if (flag < TRIPLET_THREE_BYTES_END) {
    const [first, second, third] = reader.bytes(TRIPLET_THREE_BYTE_LENGTH);
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
 * Splits the transformed glyf table into its streams, whose sizes its header gives in order.
 * @param {Buffer} glyf - The transformed glyf table.
 * @returns {{ glyphCount: number, streams: GlyfStreams }} The number of glyphs and the streams.
 */
const readGlyfStreams = glyf => {
  const header = createByteReader(glyf);
  header.skip(TRANSFORMED_GLYF_GLYPH_COUNT_OFFSET);
  const glyphCount = header.u16();
  // The format of the index of the loca table, which the outlines do not need
  header.skip(UINT16_BYTES);
  const [contourCounts, pointCounts, flags, glyphs, composites, boxes, instructions] = Array.from(
    { length: GLYF_STREAM_COUNT },
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
  // The boxes of the glyphs, which the outlines do not need
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
 * Tells whether a flag of a component of a composite glyph is set.
 * @param {{ flags: number, flag: number }} params - Flags of the component, and the flag to test.
 * @returns {boolean} True when the flag is set.
 */
const hasFlag = ({ flags, flag }) => (flags & flag) !== 0;

/**
 * Gives the size of the scale of a component of a composite glyph, from its flags.
 * @param {number} flags - Flags of the component.
 * @returns {number} The size of its scale in bytes, 0 without a scale. A malformed font that sets
 * several scale flags gets the first one of WE_HAVE_A_SCALE, WE_HAVE_AN_X_AND_Y_SCALE and
 * WE_HAVE_A_TWO_BY_TWO.
 * @example
 * getComponentScaleBytes(WE_HAVE_AN_X_AND_Y_SCALE | MORE_COMPONENTS); // 4
 */
export const getComponentScaleBytes = flags => {
  if (hasFlag({ flags, flag: WE_HAVE_A_SCALE })) return COMPONENT_SCALE_BYTES;
  if (hasFlag({ flags, flag: WE_HAVE_AN_X_AND_Y_SCALE })) return COMPONENT_X_AND_Y_SCALE_BYTES;
  if (hasFlag({ flags, flag: WE_HAVE_A_TWO_BY_TWO })) return COMPONENT_TWO_BY_TWO_BYTES;
  return 0;
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
    const argumentBytes = hasFlag({ flags, flag: ARG_1_AND_2_ARE_WORDS })
      ? COMPONENT_WORD_ARGUMENTS_BYTES
      : COMPONENT_BYTE_ARGUMENTS_BYTES;
    // The ID of the component glyph, its offset and its scale
    streams.composites.skip(UINT16_BYTES + argumentBytes + getComponentScaleBytes(flags));
    hasInstructions = hasInstructions || hasFlag({ flags, flag: WE_HAVE_INSTRUCTIONS });
    hasMoreComponents = hasFlag({ flags, flag: MORE_COMPONENTS });
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
 * @throws {RangeError} When the table is truncated.
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
