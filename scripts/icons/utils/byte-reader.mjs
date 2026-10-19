// @ts-check
// Reads the numbers of a binary file one after the other: big-endian integers, and the
// variable-length numbers of WOFF2 (UIntBase128 and 255UInt16).
import {
  UINT16_BYTES,
  UINT32_BYTES,
  UINT_255_LOWEST_U_CODE,
  UINT_255_ONE_MORE_BYTE_CODE_1,
  UINT_255_ONE_MORE_BYTE_CODE_2,
  UINT_255_WORD_CODE,
  UINT_BASE_128_CONTINUATION_BIT,
  UINT_BASE_128_MAX_BYTES,
  UINT_BASE_128_MAX_PREFIX,
  UINT_BASE_128_RADIX,
  UINT_BASE_128_VALUE_BITS,
} from './constants.mjs';

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
    u16: () => buffer.readUInt16BE(advance(UINT16_BYTES)),
    i16: () => buffer.readInt16BE(advance(UINT16_BYTES)),
    u32: () => buffer.readUInt32BE(advance(UINT32_BYTES)),
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
    const hasLeadingZero = index === 0 && byte === UINT_BASE_128_CONTINUATION_BIT;
    const overflows = value > UINT_BASE_128_MAX_PREFIX;
    if (hasLeadingZero || overflows) throw new RangeError('Invalid UIntBase128 number');

    value = value * UINT_BASE_128_RADIX + (byte & UINT_BASE_128_VALUE_BITS);
    const isLastByte = (byte & UINT_BASE_128_CONTINUATION_BIT) === 0;
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
