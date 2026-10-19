// @ts-check
// Packs PNG images into an ICO file, the favicon format of the browsers that read no SVG one: a
// directory of the images, then each PNG as it is, which every browser of the last decade reads.

/** Size of the header of an ICO file, in bytes: a reserved word, its type and its image count. */
const ICO_HEADER_BYTES = 6;

/** Size of the directory entry of each image, in bytes. */
const ICO_ENTRY_BYTES = 16;

/** Type of an ICO file in its header, as opposed to a cursor. */
const ICON_RESOURCE_TYPE = 1;

/** Color planes and bits per pixel of a 32-bit PNG image, as its directory entry states them. */
const COLOR_PLANES = 1;
const BITS_PER_PIXEL = 32;

/** Largest width and height of an image of an ICO file, which its entry writes as 0. */
const MAX_ICO_IMAGE_SIZE_PX = 256;

/**
 * An image of an ICO file.
 * @typedef {object} IcoImage
 * @property {number} size - Width and height of the image, in pixels, from 1 to 256.
 * @property {Buffer} png - The image, as a PNG file.
 */

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
  const invalidImage = images.find(
    ({ size }) => !Number.isInteger(size) || size < 1 || size > MAX_ICO_IMAGE_SIZE_PX,
  );
  if (invalidImage) throw new RangeError(`Invalid ICO image size: ${invalidImage.size}`);

  const header = Buffer.alloc(ICO_HEADER_BYTES);
  header.writeUInt16LE(ICON_RESOURCE_TYPE, 2);
  header.writeUInt16LE(images.length, 4);

  let imageOffset = ICO_HEADER_BYTES + ICO_ENTRY_BYTES * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(ICO_ENTRY_BYTES);
    // A size of 256 does not fit in a byte: the format writes it as 0
    const sizeByte = size % MAX_ICO_IMAGE_SIZE_PX;
    entry.writeUInt8(sizeByte, 0);
    entry.writeUInt8(sizeByte, 1);
    entry.writeUInt16LE(COLOR_PLANES, 4);
    entry.writeUInt16LE(BITS_PER_PIXEL, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(imageOffset, 12);
    imageOffset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
};
