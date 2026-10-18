import { escapeHtml, hasUnresolvedValue, toDataUrl } from './html.mjs';

describe('escapeHtml', () => {
  it.each([
    ['R&D', 'R&amp;D'],
    ['<script>', '&lt;script&gt;'],
    ['say "hi"', 'say &quot;hi&quot;'],
    ["l'UX", 'l&#39;UX'],
    ['&amp;', '&amp;amp;'],
  ])('escapes %j', (value, expected) => {
    expect(escapeHtml(value)).toBe(expected);
  });

  it.each(['Développeur full-stack', 'passionné par l’', 'Expériences — 2026 🚀', ''])(
    'keeps %j as is',
    value => {
      expect(escapeHtml(value)).toBe(value);
    },
  );

  it.each([undefined, null, 42, {}, ['a']])('gives an empty text for %j', value => {
    expect(escapeHtml(value)).toBe('');
  });
});

describe('hasUnresolvedValue', () => {
  it.each([
    'box-shadow: undefined;',
    'stroke="rgba(139, 49, 104, NaN)"',
    'font-weight: null;',
    '<svg>undefined</svg>',
  ])('finds an unresolved value in %j', markup => {
    expect(hasUnresolvedValue(markup)).toBe(true);
  });

  it.each([
    'color: #ffffff; box-shadow: 0 0 28px rgba(139, 49, 104, 0.65);',
    '.nullable { color: red; }',
    'font-family: Undefined Sans;',
    '',
  ])('finds none in %j', markup => {
    expect(hasUnresolvedValue(markup)).toBe(false);
  });

  it.each([undefined, null, 42, {}])('counts %j, which is not markup, as unresolved', markup => {
    expect(hasUnresolvedValue(markup)).toBe(true);
  });
});

describe('toDataUrl', () => {
  const content = Buffer.from('image');

  it.each([
    ['public/home.webp', 'image/webp'],
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.PNG', 'image/png'],
    ['photo.avif', 'image/avif'],
    ['/fonts/montserrat-latin.woff2', 'font/woff2'],
  ])('builds the data URL of %s', (fileName, mediaType) => {
    expect(toDataUrl({ content, fileName })).toBe(`data:${mediaType};base64,aW1hZ2U=`);
  });

  it('builds the data URL of an empty file', () => {
    expect(toDataUrl({ content: Buffer.alloc(0), fileName: 'empty.webp' })).toBe(
      'data:image/webp;base64,',
    );
  });

  it.each(['photo.gif', 'photo.svg', 'font.woff', 'font.ttf', 'photo', 'webp', ''])(
    'refuses the unknown file type of %j',
    fileName => {
      expect(() => toDataUrl({ content, fileName })).toThrow(`Unknown file type: ${fileName}`);
    },
  );
});
