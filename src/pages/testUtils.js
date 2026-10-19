import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Folder whose files are served at the root of the site. */
const PUBLIC_DIR = 'public';

/**
 * CSS selector of the interactive content of the HTML specification, plus the elements made
 * focusable or editable by an attribute. Used by the page tests to check that no link holds one,
 * since interactive content inside a link is invalid HTML.
 */
export const INTERACTIVE_SELECTOR = [
  'a[href]',
  'audio[controls]',
  'button',
  'details',
  'embed',
  'iframe',
  'img[usemap]',
  'input:not([type="hidden"])',
  'label',
  'select',
  'textarea',
  'video[controls]',
  '[tabindex]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/** Hidden from screen readers, with its whole content. */
const ARIA_HIDDEN_SELECTOR = '[aria-hidden="true"]';

/** One or more white space characters, line breaks included. */
const WHITE_SPACE_PATTERN = /\s+/g;

/**
 * Text that screen readers read in an element: its text without the parts hidden from them with
 * `aria-hidden="true"`, each run of white space collapsed into one space, and trimmed. The text
 * hidden from the screen only, such as a `VisuallyHidden` word, is kept. jsdom computes no
 * accessibility tree, and ignores the media queries that hide a part on some screens.
 *
 * @param {unknown} element - Element to read.
 * @returns {string} `''` when it is not an element, or when it is hidden from screen readers.
 *
 * @example
 * // <span>août 2021</span> <span aria-hidden="true">↓</span><span>à</span> <span>Aujourd’hui</span>
 * getReadText(period); // 'août 2021 à Aujourd’hui'
 */
export const getReadText = element => {
  const isElement = element instanceof Element;
  if (!isElement) return '';

  const isHiddenFromScreenReaders = element.closest(ARIA_HIDDEN_SELECTOR) !== null;
  if (isHiddenFromScreenReaders) return '';

  const copy = element.cloneNode(true);
  copy.querySelectorAll(ARIA_HIDDEN_SELECTOR).forEach(hiddenPart => hiddenPart.remove());
  return copy.textContent.replace(WHITE_SPACE_PATTERN, ' ').trim();
};

/**
 * Whether an absolute URL such as `/chess.webp` names a file of `public/`, not a folder. Used by
 * the page tests to check that every image they reference is served.
 *
 * @param {unknown} url - URL of the image, as written in the code or the data.
 * @returns {boolean} `false` for a relative URL, a missing file, a folder, a path leaving
 * `public/` or a value that is not a string.
 */
export const isPublicFile = url => {
  const isAbsoluteUrl = typeof url === 'string' && url.startsWith('/');
  if (!isAbsoluteUrl) return false;

  const path = join(PUBLIC_DIR, url);
  // join() resolves `..`, which could leave public/
  const isInsidePublicDir = path.startsWith(`${PUBLIC_DIR}${sep}`);
  return isInsidePublicDir && existsSync(path) && statSync(path).isFile();
};

/** Text of the first bytes of every WebP file, a RIFF container. */
const RIFF_SIGNATURE = 'RIFF';
/** Text that names the format of a RIFF container holding a WebP image. */
const WEBP_SIGNATURE = 'WEBP';
/** Offset of the format of a RIFF container, after its signature and its size. */
const RIFF_FORMAT_OFFSET = 8;
/** Offset of the type of the first chunk of a WebP file, such as `VP8 `. */
const CHUNK_TYPE_OFFSET = 12;
/** Bytes of a signature, a format or a chunk type of a RIFF container. */
const FOUR_CC_LENGTH = 4;
/** Fewest bytes of a WebP file that hold its width and height, whatever its kind. */
const WEBP_HEADER_LENGTH = 30;
/** Offset of the width of a lossy WebP file (`VP8 `), then its height 2 bytes further. */
const LOSSY_WIDTH_OFFSET = 26;
/** Bits of the 16 of the width or height of a lossy WebP file that hold it, the others scale it. */
const LOSSY_SIZE_MASK = 0x3fff;
/** Offset of the 32 bits of a lossless WebP file (`VP8L`) that hold its width and height. */
const LOSSLESS_SIZE_OFFSET = 21;
/** Bits of the width, then of the height, in the size field of a lossless WebP file, less one. */
const LOSSLESS_SIZE_BITS = 14;
/** Offset of the width of the canvas of an extended WebP file (`VP8X`), less one, on 3 bytes. */
const EXTENDED_WIDTH_OFFSET = 24;
/** Offset of the height of the canvas of an extended WebP file, less one, on 3 bytes. */
const EXTENDED_HEIGHT_OFFSET = 27;

/** Reads 4 bytes as text, such as the signature or a chunk type of a RIFF container. */
const readFourCc = ({ bytes, offset }) =>
  String.fromCharCode(...bytes.subarray(offset, offset + FOUR_CC_LENGTH));

/** Reads a whole number of `length` bytes, the lowest first, as WebP writes it. */
const readLittleEndian = ({ bytes, offset, length }) =>
  bytes.subarray(offset, offset + length).reduceRight((value, byte) => value * 256 + byte, 0);

/**
 * Width and height of a WebP file, read in its header, lossy (`VP8 `), lossless (`VP8L`) or
 * extended (`VP8X`, as with transparency). Used by the page tests to check that an image of
 * `public/` has the size that the data gives it.
 *
 * @param {unknown} bytes - Content of the file, an array of bytes such as a `Uint8Array` or a
 * `Buffer`.
 * @returns {{ width: number, height: number } | null} `null` for a value that is not bytes, a file
 * shorter than a WebP header, or that is not a WebP file of these kinds.
 *
 * @example
 * readWebpSize(readFileSync('public/chess-480.webp')); // { width: 480, height: 300 }
 */
export const readWebpSize = bytes => {
  // A Buffer of Node.js is not an instance of the Uint8Array of jsdom, which the tests run in
  const isByteArray = ArrayBuffer.isView(bytes) && bytes.BYTES_PER_ELEMENT === 1;
  const isLongEnough = isByteArray && bytes.length >= WEBP_HEADER_LENGTH;
  if (!isLongEnough) return null;

  const isWebp =
    readFourCc({ bytes, offset: 0 }) === RIFF_SIGNATURE &&
    readFourCc({ bytes, offset: RIFF_FORMAT_OFFSET }) === WEBP_SIGNATURE;
  if (!isWebp) return null;

  switch (readFourCc({ bytes, offset: CHUNK_TYPE_OFFSET })) {
    case 'VP8 ':
      return {
        width: readLittleEndian({ bytes, offset: LOSSY_WIDTH_OFFSET, length: 2 }) & LOSSY_SIZE_MASK,
        height:
          readLittleEndian({ bytes, offset: LOSSY_WIDTH_OFFSET + 2, length: 2 }) & LOSSY_SIZE_MASK,
      };
    case 'VP8L': {
      const sizeField = readLittleEndian({ bytes, offset: LOSSLESS_SIZE_OFFSET, length: 4 });
      const sizeMask = 2 ** LOSSLESS_SIZE_BITS - 1;
      return {
        width: (sizeField & sizeMask) + 1,
        height: (Math.floor(sizeField / 2 ** LOSSLESS_SIZE_BITS) & sizeMask) + 1,
      };
    }
    case 'VP8X':
      return {
        width: readLittleEndian({ bytes, offset: EXTENDED_WIDTH_OFFSET, length: 3 }) + 1,
        height: readLittleEndian({ bytes, offset: EXTENDED_HEIGHT_OFFSET, length: 3 }) + 1,
      };
    default:
      return null;
  }
};

/**
 * Width and height of a WebP image of `public/`, named by its absolute URL, such as
 * `/chess-480.webp`, as {@link readWebpSize} reads them.
 *
 * @param {unknown} url - URL of the image, as written in the code or the data.
 * @returns {{ width: number, height: number } | null} `null` when the URL names no file of
 * `public/` (see {@link isPublicFile}), or a file that is not a WebP image.
 */
export const readPublicWebpSize = url =>
  isPublicFile(url) ? readWebpSize(readFileSync(join(PUBLIC_DIR, url))) : null;
