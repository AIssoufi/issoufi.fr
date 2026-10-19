// @vitest-environment node
import { createByteReader, readUInt255, readUIntBase128 } from './byte-reader.mjs';

/** Reads a buffer of bytes from its start. */
const readerOf = bytes => createByteReader(Buffer.from(bytes));

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
    expect(() => readerOf([1, 2, 3]).u32()).toThrow(RangeError);
    expect(() => readerOf([1, 2]).bytes(3)).toThrow(RangeError);
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

  it.each([[[253, 0x01]], [[255]], [[254]], [[]]])('throws on the truncated number %j', bytes => {
    expect(() => readUInt255(readerOf(bytes))).toThrow(RangeError);
  });
});
