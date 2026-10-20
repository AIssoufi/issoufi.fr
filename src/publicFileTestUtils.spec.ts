import { isPublicFile, readPublicWebpSize, readWebpSize } from './publicFileTestUtils.ts';

/** Bytes of a text of single-byte characters, such as a RIFF signature. */
const textBytes = (text: string) => [...text].map(character => character.charCodeAt(0));

/** Parameters of {@link webpHeader}. */
interface WebpHeaderParams {
  /** Type of the first chunk, such as `VP8 `. */
  chunkType: string;
  /** Bytes written from byte 20, after the chunk header. @default [] */
  payload?: number[];
  /** Signature of the container. @default 'RIFF' */
  riff?: string;
  /** Format of the container. @default 'WEBP' */
  format?: string;
}

/**
 * First 30 bytes of a WebP file whose first chunk is `chunkType`: the RIFF header, the chunk
 * header, then `payload` from byte 20, followed by zeros.
 */
const webpHeader = ({
  chunkType,
  payload = [],
  riff = 'RIFF',
  format = 'WEBP',
}: WebpHeaderParams) => {
  const bytes = new Uint8Array(30);
  bytes.set(textBytes(riff), 0);
  bytes.set(textBytes(format), 8);
  bytes.set(textBytes(chunkType), 12);
  bytes.set(payload, 20);
  return bytes;
};

/** Header of a lossy WebP file of 1234 × 823 pixels: a frame tag, a start code, then the size. */
const LOSSY_HEADER = webpHeader({
  chunkType: 'VP8 ',
  payload: [0, 0, 0, 0x9d, 0x01, 0x2a, 0xd2, 0x04, 0x37, 0x03],
});

/** Header of a lossless WebP file of 301 × 207 pixels, the sizes less one packed on 14 bits. */
const LOSSLESS_HEADER = webpHeader({
  chunkType: 'VP8L',
  payload: [0x2f, 0x2c, 0x81, 0x33, 0x00],
});

/** Header of an extended WebP file of 108 × 70000 pixels, the canvas sizes less one on 3 bytes. */
const EXTENDED_HEADER = webpHeader({
  chunkType: 'VP8X',
  payload: [0x10, 0, 0, 0, 0x6b, 0, 0, 0x6f, 0x11, 0x01],
});

describe('isPublicFile', () => {
  it('takes an absolute URL naming a file of public/', () => {
    expect(isPublicFile('/robots.txt')).toBe(true);
  });

  it('does not take a missing file or a folder', () => {
    expect(isPublicFile('/missing-screenshot.webp')).toBe(false);
    expect(isPublicFile('')).toBe(false);
    expect(isPublicFile('/')).toBe(false);
  });

  it('only takes absolute URLs that stay inside public/', () => {
    expect(isPublicFile('robots.txt')).toBe(false);
    expect(isPublicFile('/../package.json')).toBe(false);
    expect(isPublicFile(undefined)).toBe(false);
    expect(isPublicFile(null)).toBe(false);
    expect(isPublicFile(42)).toBe(false);
  });
});

describe('readWebpSize', () => {
  it.each([
    ['lossy', LOSSY_HEADER, { width: 1234, height: 823 }],
    ['lossless', LOSSLESS_HEADER, { width: 301, height: 207 }],
    ['extended', EXTENDED_HEADER, { width: 108, height: 70000 }],
  ])('reads the width and height of a %s file', (_kind, bytes, size) => {
    expect(readWebpSize(bytes)).toEqual(size);
  });

  it('reads a Buffer, as readFileSync returns it', () => {
    expect(readWebpSize(Buffer.from(LOSSY_HEADER))).toEqual({ width: 1234, height: 823 });
  });

  it('reads only the 14 bits of a lossy size, without its scale', () => {
    const header = LOSSY_HEADER.slice();
    header[27] |= 0xc0;
    header[29] |= 0x40;
    expect(readWebpSize(header)).toEqual({ width: 1234, height: 823 });
  });

  it('reads no size from a file shorter than a WebP header', () => {
    expect(readWebpSize(LOSSY_HEADER.subarray(0, 29))).toBeNull();
    expect(readWebpSize(new Uint8Array())).toBeNull();
  });

  it('reads no size from a file of another format', () => {
    expect(readWebpSize(webpHeader({ chunkType: 'VP8 ', riff: 'RIFX' }))).toBeNull();
    expect(readWebpSize(webpHeader({ chunkType: 'VP8 ', format: 'WAVE' }))).toBeNull();
    expect(readWebpSize(webpHeader({ chunkType: 'ALPH' }))).toBeNull();
  });

  it.each([
    undefined,
    null,
    '',
    'RIFF',
    42,
    {},
    [...LOSSY_HEADER],
    new DataView(new ArrayBuffer(30)),
  ])('reads no size from %j, which are not bytes', value => {
    expect(readWebpSize(value)).toBeNull();
  });
});

describe('readPublicWebpSize', () => {
  it('reads the size of a WebP image of public/', () => {
    expect(readPublicWebpSize('/home.webp')).toEqual({ width: 1650, height: 1100 });
  });

  it('reads no size from a file of public/ that is not a WebP image', () => {
    expect(readPublicWebpSize('/robots.txt')).toBeNull();
  });

  it.each(['/missing-screenshot.webp', 'home.webp', '/../package.json', '', undefined, 42])(
    'reads no size from %j, which names no file of public/',
    url => {
      expect(readPublicWebpSize(url)).toBeNull();
    },
  );
});
