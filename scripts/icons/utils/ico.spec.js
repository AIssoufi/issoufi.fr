// @vitest-environment node
import { toIco } from './ico.mjs';

/** Stands for a PNG file: the packer stores the bytes as they are. */
const fakePng = ({ length, byte }) => Buffer.alloc(length, byte);

describe('toIco', () => {
  const small = fakePng({ length: 10, byte: 1 });
  const large = fakePng({ length: 20, byte: 2 });
  const ico = toIco([
    { size: 16, png: small },
    { size: 32, png: large },
  ]);

  it('writes the header of an icon file with its image count', () => {
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(2);
  });

  it('writes a directory entry per image, with its size, depth, length and offset', () => {
    const entries = [6, 22].map(offset => ({
      width: ico.readUInt8(offset),
      height: ico.readUInt8(offset + 1),
      planes: ico.readUInt16LE(offset + 4),
      bitsPerPixel: ico.readUInt16LE(offset + 6),
      length: ico.readUInt32LE(offset + 8),
      offset: ico.readUInt32LE(offset + 12),
    }));

    expect(entries).toEqual([
      { width: 16, height: 16, planes: 1, bitsPerPixel: 32, length: 10, offset: 38 },
      { width: 32, height: 32, planes: 1, bitsPerPixel: 32, length: 20, offset: 48 },
    ]);
  });

  it('stores each image as it is, after the directory, in the order given', () => {
    expect(ico).toHaveLength(38 + 10 + 20);
    expect(ico.subarray(38, 48)).toEqual(small);
    expect(ico.subarray(48)).toEqual(large);
  });

  it('writes a size of 256 as 0, as the format does', () => {
    const icon = toIco([{ size: 256, png: small }]);

    expect(icon.readUInt8(6)).toBe(0);
    expect(icon.readUInt8(7)).toBe(0);
  });

  it('throws without an image', () => {
    expect(() => toIco([])).toThrow(RangeError);
  });

  it.each([0, -16, 257, 1.5, Number.NaN, undefined, '16'])('throws on the size %o', size => {
    expect(() => toIco([{ size, png: small }])).toThrow(RangeError);
  });
});
