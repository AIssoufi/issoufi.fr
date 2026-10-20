// @ts-check
// Constants of the binary formats that the helpers of `pnpm icons` read and write: WOFF2 and its
// table directory (https://www.w3.org/TR/WOFF2/), the TrueType tables that give the glyphs of a
// text (https://learn.microsoft.com/typography/opentype/spec/), and the ICO file of the favicon.

/** Size of an unsigned or signed 16-bit integer, in bytes. */
export const UINT16_BYTES = 2;

/** Size of an unsigned 32-bit integer, in bytes. */
export const UINT32_BYTES = 4;

/** Size of the tag that names a table of a font, such as `glyf`, in bytes. */
export const TABLE_TAG_BYTES = 4;

/** Bit of a byte of a UIntBase128 number set while another byte follows. */
export const UINT_BASE_128_CONTINUATION_BIT = 0x80;

/** Bits of a byte of a UIntBase128 number that hold its value. */
export const UINT_BASE_128_VALUE_BITS = 0x7f;

/** Value that each byte of a UIntBase128 number multiplies the previous ones by: 2 to the 7. */
export const UINT_BASE_128_RADIX = 128;

/** Largest number of bytes of a UIntBase128 number. */
export const UINT_BASE_128_MAX_BYTES = 5;

/**
 * Largest value of a UIntBase128 number before its last byte, past which that byte would overflow
 * 32 bits.
 */
export const UINT_BASE_128_MAX_PREFIX = 0x1ffffff;

/** First byte of a 255UInt16 number written in the two bytes that follow it. */
export const UINT_255_WORD_CODE = 253;

/** First byte of a 255UInt16 number whose next byte counts from twice the lowest code. */
export const UINT_255_ONE_MORE_BYTE_CODE_2 = 254;

/** First byte of a 255UInt16 number whose next byte counts from the lowest code. */
export const UINT_255_ONE_MORE_BYTE_CODE_1 = 255;

/** Lowest value that a 255UInt16 number does not write in its first byte alone. */
export const UINT_255_LOWEST_U_CODE = 253;

/** First four bytes of a WOFF2 file: `wOF2`. */
export const WOFF2_SIGNATURE = 0x774f4632;

/** Flavor of a font collection, whose directory the reader does not read. */
export const COLLECTION_FLAVOR = 0x74746366;

/** Offset of the table count in the header of a WOFF2 file, in bytes. */
export const WOFF2_TABLE_COUNT_OFFSET = 12;

/** Offset of the length of the Brotli stream in the header of a WOFF2 file, in bytes. */
export const WOFF2_COMPRESSED_LENGTH_OFFSET = 20;

/** Size of the header of a WOFF2 file, before its table directory, in bytes. */
export const WOFF2_HEADER_BYTES = 48;

/**
 * Tags of the tables that WOFF2 names by their index in this list, in the low 6 bits of the flags
 * of their entry in the table directory, from its specification.
 */
// prettier-ignore
export const KNOWN_TABLE_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca',
  'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea',
  'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL',
  'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

/** Index of the flags of a table entry that announces an arbitrary tag, written after them. */
export const ARBITRARY_TAG_INDEX = 63;

/** Bits of the flags of a table entry that give the index of its tag. */
export const TAG_INDEX_MASK = 0x3f;

/** Shift of the flags of a table entry that gives the version of its transform. */
export const TRANSFORM_VERSION_SHIFT = 6;

/** Transform version of the glyf and loca tables when they are not transformed. */
export const NULL_GLYF_TRANSFORM_VERSION = 3;

/** Offset of the `unitsPerEm` field in the head table, in bytes. */
export const HEAD_UNITS_PER_EM_OFFSET = 18;

/** Offset of the `ascender` field in the hhea table, in bytes. */
export const HHEA_ASCENDER_OFFSET = 4;

/** Offset of the `descender` field in the hhea table, in bytes. */
export const HHEA_DESCENDER_OFFSET = 6;

/** Offset of the `lineGap` field in the hhea table, in bytes. */
export const HHEA_LINE_GAP_OFFSET = 8;

/** Offset of the `numberOfHMetrics` field in the hhea table, in bytes. */
export const HHEA_METRIC_COUNT_OFFSET = 34;

/** Size of a long horizontal metric of the hmtx table: an advance width and a side bearing. */
export const LONG_HOR_METRIC_BYTES = 4;

/** Platform of the cmap subtable of the Unicode BMP characters on Windows. */
export const WINDOWS_PLATFORM_ID = 3;

/** Encoding of the cmap subtable of the Unicode BMP characters on Windows. */
export const WINDOWS_UNICODE_BMP_ENCODING_ID = 1;

/** Offset of the subtable count in the cmap table, after its version, in bytes. */
export const CMAP_SUBTABLE_COUNT_OFFSET = 2;

/** Format of the cmap subtable that maps the BMP characters by segments. */
export const SEGMENT_MAPPING_FORMAT = 4;

/** Offset of the doubled segment count (`segCountX2`) in a cmap format 4 subtable, in bytes. */
export const SEGMENT_COUNT_X2_OFFSET = 6;

/** Size of the header of a cmap format 4 subtable, before its end codes, in bytes. */
export const SEGMENT_MAPPING_HEADER_BYTES = 14;

/** Number of glyph IDs of the font, which a 16-bit ID wraps around. */
export const GLYPH_ID_MODULO = 0x10000;

/** Offset of the glyph count in the header of the transformed glyf table, in bytes. */
export const TRANSFORMED_GLYF_GLYPH_COUNT_OFFSET = 4;

/**
 * Number of the streams of the transformed glyf table, whose sizes its header gives in order:
 * contour counts, point counts, flags, glyphs, composites, boxes and instructions.
 */
export const GLYF_STREAM_COUNT = 7;

/** Size of the header of the transformed glyf table, before its streams, in bytes. */
export const TRANSFORMED_GLYF_HEADER_BYTES = 36;

/** Number of contours that marks a composite glyph. */
export const COMPOSITE_GLYPH_CONTOUR_COUNT = -1;

/** Flag of a component of a composite glyph whose offset is two words rather than two bytes. */
export const ARG_1_AND_2_ARE_WORDS = 0x0001;

/** Flag of a component of a composite glyph scaled by one number, the same both ways. */
export const WE_HAVE_A_SCALE = 0x0008;

/** Flag of a component of a composite glyph followed by another component. */
export const MORE_COMPONENTS = 0x0020;

/** Flag of a component of a composite glyph scaled by two numbers, one per axis. */
export const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;

/** Flag of a component of a composite glyph transformed by a matrix of four numbers. */
export const WE_HAVE_A_TWO_BY_TWO = 0x0080;

/** Flag of a component of a composite glyph whose glyph has hinting instructions. */
export const WE_HAVE_INSTRUCTIONS = 0x0100;

/** Size of the offset of a component of a composite glyph written as two bytes, in bytes. */
export const COMPONENT_BYTE_ARGUMENTS_BYTES = 2;

/** Size of the offset of a component of a composite glyph written as two words, in bytes. */
export const COMPONENT_WORD_ARGUMENTS_BYTES = 4;

/** Size of the scale of a component of a composite glyph, one 2.14 number, in bytes. */
export const COMPONENT_SCALE_BYTES = 2;

/** Size of the scale of a component of a composite glyph per axis, two numbers, in bytes. */
export const COMPONENT_X_AND_Y_SCALE_BYTES = 4;

/** Size of the matrix of a component of a composite glyph, four numbers, in bytes. */
export const COMPONENT_TWO_BY_TWO_BYTES = 8;

/** Bit of the flag of a point of the transformed glyf table set for an off-curve point. */
export const OFF_CURVE_FLAG = 0x80;

/**
 * End, excluded, of the flags of the triplet encoding whose point moves vertically only, by a
 * delta of one byte.
 */
export const TRIPLET_Y_ONLY_END = 10;

/**
 * End, excluded, of the flags of the triplet encoding whose point moves horizontally only, by a
 * delta of one byte.
 */
export const TRIPLET_X_ONLY_END = 20;

/** End, excluded, of the flags of the triplet encoding whose two deltas share one byte. */
export const TRIPLET_ONE_BYTE_END = 84;

/** End, excluded, of the flags of the triplet encoding whose two deltas take a byte each. */
export const TRIPLET_TWO_BYTES_END = 120;

/**
 * End, excluded, of the flags of the triplet encoding whose two deltas share three bytes, 12 bits
 * each; past it, they take two bytes each.
 */
export const TRIPLET_THREE_BYTES_END = 124;

/** Number of bytes of the two deltas of a point whose flag is a three-byte triplet. */
export const TRIPLET_THREE_BYTE_LENGTH = 3;

/** Size of the header of an ICO file, in bytes: a reserved word, its type and its image count. */
export const ICO_HEADER_BYTES = 6;

/** Offset of the type in the header of an ICO file, in bytes. */
export const ICO_TYPE_OFFSET = 2;

/** Offset of the image count in the header of an ICO file, in bytes. */
export const ICO_IMAGE_COUNT_OFFSET = 4;

/** Size of the directory entry of each image of an ICO file, in bytes. */
export const ICO_ENTRY_BYTES = 16;

/** Offset of the width of the image in a directory entry of an ICO file, in bytes. */
export const ICO_ENTRY_WIDTH_OFFSET = 0;

/** Offset of the height of the image in a directory entry of an ICO file, in bytes. */
export const ICO_ENTRY_HEIGHT_OFFSET = 1;

/** Offset of the color planes of the image in a directory entry of an ICO file, in bytes. */
export const ICO_ENTRY_PLANES_OFFSET = 4;

/** Offset of the bits per pixel of the image in a directory entry of an ICO file, in bytes. */
export const ICO_ENTRY_BITS_PER_PIXEL_OFFSET = 6;

/** Offset of the length of the image in a directory entry of an ICO file, in bytes. */
export const ICO_ENTRY_LENGTH_OFFSET = 8;

/** Offset of the position of the image in the file in its directory entry, in bytes. */
export const ICO_ENTRY_IMAGE_OFFSET = 12;

/** Type of an ICO file in its header, as opposed to a cursor. */
export const ICON_RESOURCE_TYPE = 1;

/** Color planes of a PNG image, as its directory entry in an ICO file states them. */
export const COLOR_PLANES = 1;

/** Bits per pixel of a 32-bit PNG image, as its directory entry in an ICO file states them. */
export const BITS_PER_PIXEL = 32;

/** Largest width and height of an image of an ICO file, which its entry writes as 0. */
export const MAX_ICO_IMAGE_SIZE_PX = 256;
