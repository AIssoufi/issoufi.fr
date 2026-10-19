import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import Page from '../components/Page';
import {
  getReadText,
  INTERACTIVE_SELECTOR,
  isPublicFile,
  readBackgroundImages,
  readPublicWebpSize,
  readWebpSize,
} from './testUtils';

/** Bytes of a text of single-byte characters, such as a RIFF signature. */
const textBytes = text => [...text].map(character => character.charCodeAt(0));

/**
 * First 30 bytes of a WebP file whose first chunk is `chunkType`: the RIFF header, the chunk
 * header, then `payload` from byte 20, followed by zeros.
 */
const webpHeader = ({ chunkType, payload = [], riff = 'RIFF', format = 'WEBP' }) => {
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

describe('INTERACTIVE_SELECTOR', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('matches the interactive content of HTML, and the focusable or editable elements', () => {
    document.body.innerHTML = `
      <a href="/projects">link</a><audio controls></audio><button>button</button>
      <details>details</details><embed /><iframe></iframe><img alt="" usemap="#map" />
      <input /><label>label</label><select></select><textarea></textarea>
      <video controls></video><div tabindex="-1">focusable</div>
      <div contenteditable="true">editable</div>`;

    const matches = [...document.querySelectorAll(INTERACTIVE_SELECTOR)].map(
      element => element.textContent || element.tagName,
    );
    expect(matches).toEqual([
      'link',
      'AUDIO',
      'button',
      'details',
      'EMBED',
      'IFRAME',
      'IMG',
      'INPUT',
      'label',
      'SELECT',
      'TEXTAREA',
      'VIDEO',
      'focusable',
      'editable',
    ]);
  });

  it('matches none of the elements that take no click nor focus', () => {
    document.body.innerHTML = `
      <a>anchor without href</a><span>text</span><img alt="" /><input type="hidden" />
      <audio></audio><video></video><div contenteditable="false">read only</div>`;

    expect(document.querySelectorAll(INTERACTIVE_SELECTOR)).toHaveLength(0);
  });
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

describe('readBackgroundImages', () => {
  it('reads the whole photo and the portrait version that a page shows', () => {
    const backgroundPhoto = { url: '/home.webp', portraitUrl: '/home-portrait.webp' };
    render(createElement(Page, { backgroundPhoto }));

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: 'url("/home.webp")',
      portraitImage: 'url("/home-portrait.webp")',
    });
  });

  it('reads no image for a page without a photo', () => {
    render(createElement(Page));

    expect(readBackgroundImages(screen.getByRole('main'))).toEqual({
      image: 'none',
      portraitImage: 'none',
    });
  });

  it.each([
    ['an element without styles', () => document.createElement('main')],
    ['no element', () => undefined],
  ])('reads empty values for %s', (_, getElement) => {
    expect(readBackgroundImages(getElement())).toEqual({ image: '', portraitImage: '' });
  });
});

describe('getReadText', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  /** Writes some HTML in the page and returns its first element. */
  const renderHtml = html => {
    document.body.innerHTML = html;
    return document.body.firstElementChild;
  };

  it('reads the text without the parts hidden from screen readers, and keeps the element', () => {
    const period = renderHtml(
      '<p><span>août 2021</span> <span aria-hidden="true">↓</span><span>à</span> <span>Aujourd’hui</span></p>',
    );

    expect(getReadText(period)).toBe('août 2021 à Aujourd’hui');
    expect(period.textContent).toBe('août 2021 ↓à Aujourd’hui');
  });

  it('collapses the runs of white space, line breaks included, and trims them', () => {
    const element = renderHtml('<p>\n  sept. 2019 \n\t juin 2021  </p>');

    expect(getReadText(element)).toBe('sept. 2019 juin 2021');
  });

  it('reads the parts whose aria-hidden is not true', () => {
    const element = renderHtml(
      '<p><span aria-hidden="false">mai 2017</span> <span aria-hidden="">août 2017</span></p>',
    );

    expect(getReadText(element)).toBe('mai 2017 août 2017');
  });

  it('reads nothing in an element hidden from screen readers, or inside one', () => {
    const element = renderHtml('<p aria-hidden="true"><span>›</span></p>');

    expect(getReadText(element)).toBe('');
    expect(getReadText(element.firstElementChild)).toBe('');
  });

  it('reads nothing in an empty element', () => {
    expect(getReadText(renderHtml('<p></p>'))).toBe('');
  });

  it.each([undefined, null, '', 'août 2021', 42, {}, document.createTextNode('août 2021')])(
    'reads nothing in %j, which is not an element',
    value => {
      expect(getReadText(value)).toBe('');
    },
  );
});
