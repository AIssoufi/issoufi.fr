// @ts-check
// Packs PNG images into an ICO file, the favicon format of the browsers that read no SVG one, and
// reads them back: a directory of the images, then each PNG as it is, which every browser of the
// last decade reads.
import {
  BITS_PER_PIXEL,
  COLOR_PLANES,
  ICO_ENTRY_BITS_PER_PIXEL_OFFSET,
  ICO_ENTRY_BYTES,
  ICO_ENTRY_HEIGHT_OFFSET,
  ICO_ENTRY_IMAGE_OFFSET,
  ICO_ENTRY_LENGTH_OFFSET,
  ICO_ENTRY_PLANES_OFFSET,
  ICO_ENTRY_WIDTH_OFFSET,
  ICO_HEADER_BYTES,
  ICO_IMAGE_COUNT_OFFSET,
  ICO_TYPE_OFFSET,
  ICON_RESOURCE_TYPE,
  MAX_ICO_IMAGE_SIZE_PX,
} from './constants.mjs';

/**
 * An image of an ICO file.
 * @typedef {object} IcoImage
 * @property {number} size - Width and height of the image, in pixels, from 1 to 256.
 * @property {Buffer} png - The image, as a PNG file.
 */

/**
 * Tells whether a size fits an image of an ICO file.
 * @param {unknown} size - Width and height of the image, in pixels.
 * @returns {boolean} True for an integer from 1 to 256.
 */
const isIcoImageSize = size =>
  Number.isInteger(size) && Number(size) >= 1 && Number(size) <= MAX_ICO_IMAGE_SIZE_PX;

/**
 * Packs square PNG images into an ICO file, each one stored as it is, in the order given.
 * @param {IcoImage[]} images - Images of the file, e.g. the favicon at 16, 32 and 48 px.
 * @returns {Buffer} The ICO file.
 * @throws {RangeError} Without images, or for a size that is not an integer from 1 to 256.
 * @example
 * toIco([{ size: 16, png: favicon16 }, { size: 32, png: favicon32 }]);
 */
export const toIco = images => {
  if (images.length === 0) throw new RangeError('An ICO file needs an image');
  const invalidImage = images.find(({ size }) => !isIcoImageSize(size));
  if (invalidImage) throw new RangeError(`Invalid ICO image size: ${invalidImage.size}`);

  const header = Buffer.alloc(ICO_HEADER_BYTES);
  header.writeUInt16LE(ICON_RESOURCE_TYPE, ICO_TYPE_OFFSET);
  header.writeUInt16LE(images.length, ICO_IMAGE_COUNT_OFFSET);

  let imageOffset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ICO_ENTRY_BYTES);
    // A size of 256 does not fit in a byte: the format writes it as 0
    const sizeByte = size % MAX_ICO_IMAGE_SIZE_PX;
    entry.writeUInt8(sizeByte, ICO_ENTRY_WIDTH_OFFSET);
    entry.writeUInt8(sizeByte, ICO_ENTRY_HEIGHT_OFFSET);
    entry.writeUInt16LE(COLOR_PLANES, ICO_ENTRY_PLANES_OFFSET);
    entry.writeUInt16LE(BITS_PER_PIXEL, ICO_ENTRY_BITS_PER_PIXEL_OFFSET);
    entry.writeUInt32LE(png.length, ICO_ENTRY_LENGTH_OFFSET);
    entry.writeUInt32LE(imageOffset, ICO_ENTRY_IMAGE_OFFSET);
    imageOffset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
};

/**
 * Reads the images of an ICO file, as {@link toIco} packs them.
 * @param {Buffer} ico - Content of the ICO file.
 * @returns {IcoImage[]} Each image with its size, 256 for a size written as 0, in the order of
 * the directory.
 * @throws {RangeError} When the file is shorter than its directory says.
 * @example
 * readIcoImages(readFileSync('public/favicon.ico')).map(({ size }) => size); // [16, 32, 48]
 */
export const readIcoImages = ico =>
  Array.from({ length: ico.readUInt16LE(ICO_IMAGE_COUNT_OFFSET) }, (_, index) => {
    const entry = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES;
    const offset = ico.readUInt32LE(entry + ICO_ENTRY_IMAGE_OFFSET);
    const length = ico.readUInt32LE(entry + ICO_ENTRY_LENGTH_OFFSET);
    if (offset + length > ico.length) throw new RangeError(`ICO image ${index} past the end`);

    return {
      size: ico.readUInt8(entry + ICO_ENTRY_WIDTH_OFFSET) || MAX_ICO_IMAGE_SIZE_PX,
      png: ico.subarray(offset, offset + length),
    };
  });
