import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Folder whose files are served at the root of the site. */
const PUBLIC_DIR = 'public';

/** Text of the first bytes of every WebP file, a RIFF container. */
const RIFF_SIGNATURE = 'RIFF';
/** Text that names the format of a RIFF container holding a WebP image. */
const WEBP_SIGNATURE = 'WEBP';
/** Type of the first chunk of a lossy WebP file, without extended header. */
const LOSSY_CHUNK_TYPE = 'VP8 ';
/** Type of the first chunk of a lossless WebP file. */
const LOSSLESS_CHUNK_TYPE = 'VP8L';
/** Type of the first chunk of an extended WebP file, as with transparency or metadata. */
const EXTENDED_CHUNK_TYPE = 'VP8X';
/** Offset of the format of a RIFF container, after its signature and its size. */
const RIFF_FORMAT_OFFSET = 8;
/** Offset of the type of the first chunk of a WebP file, such as `VP8 `. */
const CHUNK_TYPE_OFFSET = 12;
/** Bytes of a signature, a format or a chunk type of a RIFF container. */
const FOUR_CC_LENGTH = 4;
/** Fewest bytes of a WebP file that hold its width and height, whatever its kind. */
const WEBP_HEADER_LENGTH = 30;
/** Offset of the width of a lossy WebP file, then of its height 2 bytes further. */
const LOSSY_WIDTH_OFFSET = 26;
/** Bytes of the width or the height of a lossy WebP file. */
const LOSSY_SIZE_LENGTH = 2;
/** Bits of the 16 of the width or height of a lossy WebP file that hold it, the others scale it. */
const LOSSY_SIZE_MASK = 0x3fff;
/** Offset of the 32 bits of a lossless WebP file that hold its width and height. */
const LOSSLESS_SIZE_OFFSET = 21;
/** Bytes of the field of a lossless WebP file that holds its width and height. */
const LOSSLESS_SIZE_LENGTH = 4;
/** Bits of the width, then of the height, in the size field of a lossless WebP file, less one. */
const LOSSLESS_SIZE_BITS = 14;
/** Offset of the width of the canvas of an extended WebP file, less one. */
const EXTENDED_WIDTH_OFFSET = 24;
/** Offset of the height of the canvas of an extended WebP file, less one. */
const EXTENDED_HEIGHT_OFFSET = 27;
/** Bytes of the width or the height of the canvas of an extended WebP file. */
const EXTENDED_SIZE_LENGTH = 3;
/** Values of a byte, the base of the numbers that a file writes on several bytes. */
const BYTE_VALUES = 256;

/** Width and height of an image file, in its pixels. */
export interface ImageFileSize {
  /** Width, in pixels. */
  width: number;
  /** Height, in pixels. */
  height: number;
}

/** Parameters of the readers of the header of a WebP file. */
interface ReadBytesParams {
  /** Content of the file. */
  bytes: Uint8Array;
  /** Index of the first byte to read. */
  offset: number;
}

/** Parameters of {@link readLittleEndian}. */
interface ReadLittleEndianParams extends ReadBytesParams {
  /** Number of bytes of the number. */
  length: number;
}

/** Reads 4 bytes as text, such as the signature or a chunk type of a RIFF container. */
const readFourCc = ({ bytes, offset }: ReadBytesParams) =>
  String.fromCharCode(...bytes.subarray(offset, offset + FOUR_CC_LENGTH));

/** Reads a whole number written on `length` bytes, the lowest first, as WebP writes it. */
const readLittleEndian = ({ bytes, offset, length }: ReadLittleEndianParams) =>
  bytes
    .subarray(offset, offset + length)
    .reduceRight((value, byte) => value * BYTE_VALUES + byte, 0);

/**
 * Whether a value is an array of bytes, such as a `Uint8Array` or a `Buffer`. A `Buffer` of
 * Node.js is not an instance of the `Uint8Array` of jsdom, which most tests run in, so the check
 * reads the size of its elements rather than its class.
 */
const isByteArray = (value: unknown): value is Uint8Array =>
  ArrayBuffer.isView(value) && (value as Uint8Array).BYTES_PER_ELEMENT === 1;

/**
 * Whether an absolute URL such as `/chess-480.webp` names a file of `public/`, not a folder. Used
 * by the tests to check that every image or file that the site references is served.
 *
 * @param url - URL of the file, as written in the code or the data.
 * @returns `false` for a relative URL, a missing file, a folder, a path leaving `public/` or a
 * value that is not a string.
 */
export const isPublicFile = (url: unknown): boolean => {
  const isAbsoluteUrl = typeof url === 'string' && url.startsWith('/');
  if (!isAbsoluteUrl) return false;

  const filePath = join(PUBLIC_DIR, url);
  // join() resolves `..`, which could leave public/
  const isInsidePublicDir = filePath.startsWith(`${PUBLIC_DIR}${sep}`);
  return isInsidePublicDir && existsSync(filePath) && statSync(filePath).isFile();
};

/**
 * Reads the width and height of a WebP file in its header, lossy (`VP8 `), lossless (`VP8L`) or
 * extended (`VP8X`, as with transparency). Used by the tests to check that an image has the size
 * that the data or a budget gives it.
 *
 * @param bytes - Content of the file, an array of bytes such as a `Uint8Array` or a `Buffer`.
 * @returns `null` for a value that is not an array of bytes, a file shorter than a WebP header,
 * or one that is not a WebP file of these kinds.
 *
 * @example
 * readWebpSize(readFileSync('public/chess-480.webp')); // { width: 480, height: 300 }
 */
export const readWebpSize = (bytes: unknown): ImageFileSize | null => {
  const isLongEnough = isByteArray(bytes) && bytes.length >= WEBP_HEADER_LENGTH;
  if (!isLongEnough) return null;

  const isWebp =
    readFourCc({ bytes, offset: 0 }) === RIFF_SIGNATURE &&
    readFourCc({ bytes, offset: RIFF_FORMAT_OFFSET }) === WEBP_SIGNATURE;
  if (!isWebp) return null;

  switch (readFourCc({ bytes, offset: CHUNK_TYPE_OFFSET })) {
    case LOSSY_CHUNK_TYPE: {
      const readSize = (offset: number) =>
        readLittleEndian({ bytes, offset, length: LOSSY_SIZE_LENGTH }) & LOSSY_SIZE_MASK;
      return {
        width: readSize(LOSSY_WIDTH_OFFSET),
        height: readSize(LOSSY_WIDTH_OFFSET + LOSSY_SIZE_LENGTH),
      };
    }
    case LOSSLESS_CHUNK_TYPE: {
      const sizeField = readLittleEndian({
        bytes,
        offset: LOSSLESS_SIZE_OFFSET,
        length: LOSSLESS_SIZE_LENGTH,
      });
      const sizeMask = 2 ** LOSSLESS_SIZE_BITS - 1;
      return {
        width: (sizeField & sizeMask) + 1,
        height: (Math.floor(sizeField / 2 ** LOSSLESS_SIZE_BITS) & sizeMask) + 1,
      };
    }
    case EXTENDED_CHUNK_TYPE: {
      const readSize = (offset: number) =>
        readLittleEndian({ bytes, offset, length: EXTENDED_SIZE_LENGTH }) + 1;
      return { width: readSize(EXTENDED_WIDTH_OFFSET), height: readSize(EXTENDED_HEIGHT_OFFSET) };
    }
    default:
      return null;
  }
};

/**
 * Reads the width and height of a WebP image of `public/`, named by its absolute URL, such as
 * `/chess-480.webp`, as {@link readWebpSize} does.
 *
 * @param url - URL of the image, as written in the code or the data.
 * @returns `null` when the URL names no file of `public/` (see {@link isPublicFile}), or a file
 * that is not a WebP image.
 */
export const readPublicWebpSize = (url: unknown): ImageFileSize | null => {
  const isPublicUrl = typeof url === 'string' && isPublicFile(url);
  return isPublicUrl ? readWebpSize(readFileSync(join(PUBLIC_DIR, url))) : null;
};
