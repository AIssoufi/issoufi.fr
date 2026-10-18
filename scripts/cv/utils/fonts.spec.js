import { hasOnlyStaticFonts, listFontFormats } from './fonts.mjs';

/** `@font-face` rule of a font file in a format. */
const fontFace = format => `@font-face {
  font-family: 'Montserrat';
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/montserrat/v31/a.${format}) format('${format}');
}`;

describe('listFontFormats', () => {
  it('lists the format of each file, in order', () => {
    expect(listFontFormats(`${fontFace('truetype')}\n${fontFace('woff2')}`)).toEqual([
      'truetype',
      'woff2',
    ]);
  });

  it.each([
    ['double quotes', `src: url(a.ttf) format("truetype");`],
    ['no quotes', 'src: url(a.ttf) format(truetype);'],
  ])('reads a format between %s', (_case, css) => {
    expect(listFontFormats(css)).toEqual(['truetype']);
  });

  it.each(['', '@font-face { src: url(a.ttf); }', undefined, null, 42, {}])(
    'lists none for %j',
    css => {
      expect(listFontFormats(css)).toEqual([]);
    },
  );
});

describe('hasOnlyStaticFonts', () => {
  it('accepts a style sheet of TrueType files, as Google Fonts sends to Node.js', () => {
    expect(hasOnlyStaticFonts(`${fontFace('truetype')}\n${fontFace('truetype')}`)).toBe(true);
  });

  it('refuses a style sheet with a WOFF2 file, as Google Fonts sends to browsers', () => {
    expect(hasOnlyStaticFonts(`${fontFace('truetype')}\n${fontFace('woff2')}`)).toBe(false);
  });

  it.each(['', 'body { color: red; }', undefined, null])(
    'refuses %j, which declares no font file',
    css => {
      expect(hasOnlyStaticFonts(css)).toBe(false);
    },
  );
});
