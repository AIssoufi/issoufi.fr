import { FONT_FACES, LATIN_UNICODE_RANGE } from './constants';
import type { FontFaceDeclaration } from './types';
import { isDeclarableFontFace, renderFontFaces } from './utils';

const montserrat: FontFaceDeclaration = {
  family: 'Montserrat',
  url: '/fonts/montserrat-latin.woff2',
  weight: '100 900',
  style: 'normal',
  unicodeRange: 'U+0000-00FF',
};

/** Splits rendered `@font-face` rules into the text of each rule. */
const splitRules = (css: string) => css.match(/@font-face \{[^}]*\}/g) ?? [];

describe('isDeclarableFontFace', () => {
  it.each(FONT_FACES)('can declare $family', face => {
    expect(isDeclarableFontFace(face)).toBe(true);
  });

  it('can declare a font with a family and a URL only', () => {
    expect(isDeclarableFontFace({ family: 'Montserrat', url: '/fonts/a.woff2' })).toBe(true);
  });

  it.each([
    ['no family', { ...montserrat, family: undefined }],
    ['a blank family', { ...montserrat, family: ' ' }],
    ['a family that is not a string', { ...montserrat, family: 42 }],
    ['no URL', { ...montserrat, url: undefined }],
    ['an empty URL', { ...montserrat, url: '' }],
  ])('cannot declare a font with %s', (_, face) => {
    expect(isDeclarableFontFace(face)).toBe(false);
  });

  it.each([undefined, null, 'Montserrat', 42, [], {}])('cannot declare %j', value => {
    expect(isDeclarableFontFace(value)).toBe(false);
  });
});

describe('renderFontFaces', () => {
  it('renders the rule of a font, with every descriptor', () => {
    expect(renderFontFaces({ fontFaces: [montserrat] })).toBe(
      [
        '@font-face {',
        "  font-family: 'Montserrat';",
        '  font-style: normal;',
        '  font-weight: 100 900;',
        '  font-display: swap;',
        "  src: url('/fonts/montserrat-latin.woff2') format('woff2');",
        '  unicode-range: U+0000-00FF;',
        '}',
      ].join('\n'),
    );
  });

  it('declares the web fonts of the site by default', () => {
    const rules = splitRules(renderFontFaces());

    expect(rules).toHaveLength(FONT_FACES.length);
    FONT_FACES.forEach(({ family, url }, index) => {
      expect(rules[index]).toContain(`font-family: '${family}';`);
      expect(rules[index]).toContain(`src: url('${url}') format('woff2');`);
      expect(rules[index]).toContain(`unicode-range: ${LATIN_UNICODE_RANGE};`);
    });
  });

  it('renders one rule per font, in order', () => {
    const saira = { ...montserrat, family: 'Saira Stencil One', url: '/fonts/saira.woff2' };
    const rules = splitRules(renderFontFaces({ fontFaces: [montserrat, saira] }));

    expect(rules).toHaveLength(2);
    expect(rules[0]).toContain("font-family: 'Montserrat';");
    expect(rules[1]).toContain("font-family: 'Saira Stencil One';");
  });

  it('writes the URL that getUrl gives for each file', () => {
    const getUrl = vi.fn((url: string) => `data:font/woff2;base64,${url.length}`);
    const css = renderFontFaces({ fontFaces: [montserrat], getUrl });

    expect(getUrl).toHaveBeenCalledWith('/fonts/montserrat-latin.woff2');
    expect(css).toContain("src: url('data:font/woff2;base64,29') format('woff2');");
  });

  describe('edge cases', () => {
    it.each([[[]], [null], ['/fonts/a.woff2'], [42], [{}]])(
      'renders nothing for the fonts %j',
      fontFaces => {
        expect(renderFontFaces({ fontFaces: fontFaces as unknown as FontFaceDeclaration[] })).toBe(
          '',
        );
      },
    );

    it('declares the web fonts of the site when called without parameters', () => {
      expect(renderFontFaces()).toBe(renderFontFaces({ fontFaces: FONT_FACES }));
      expect(renderFontFaces(undefined)).toBe(renderFontFaces({ fontFaces: FONT_FACES }));
    });

    it.each([
      ['no family', { ...montserrat, family: undefined }],
      ['a blank family', { ...montserrat, family: '  ' }],
      ['no URL', { ...montserrat, url: undefined }],
      ['an empty URL', { ...montserrat, url: '' }],
      ['a URL that is not a string', { ...montserrat, url: 42 }],
    ])('leaves out a font with %s', (_, face) => {
      const fontFaces = [face, montserrat] as unknown as FontFaceDeclaration[];

      expect(splitRules(renderFontFaces({ fontFaces }))).toHaveLength(1);
    });

    it.each([null, undefined, 'Montserrat', 42])('skips the entry %j', entry => {
      const fontFaces = [entry, montserrat] as unknown as FontFaceDeclaration[];

      expect(renderFontFaces({ fontFaces })).toBe(renderFontFaces({ fontFaces: [montserrat] }));
    });

    it.each([
      ['font-style', { style: undefined }],
      ['font-weight', { weight: '' }],
      ['unicode-range', { unicodeRange: undefined }],
    ])('leaves out the %s descriptor when its value is missing', (descriptor, overrides) => {
      const fontFaces = [{ ...montserrat, ...overrides }] as unknown as FontFaceDeclaration[];
      const css = renderFontFaces({ fontFaces });

      expect(css).not.toContain(`${descriptor}:`);
      expect(css).toContain("src: url('/fonts/montserrat-latin.woff2')");
    });

    it.each([
      ['an empty string', ''],
      ['a blank string', ' '],
      ['undefined', undefined],
      ['a number', 42],
    ])('leaves out a font whose URL getUrl turns into %s', (_, url) => {
      const getUrl = (() => url) as unknown as (url: string) => string;

      expect(renderFontFaces({ fontFaces: [montserrat], getUrl })).toBe('');
    });

    it.each([null, 'url', 42])('keeps the URLs when getUrl is %j, not a function', getUrl => {
      const css = renderFontFaces({
        fontFaces: [montserrat],
        getUrl: getUrl as unknown as (url: string) => string,
      });

      expect(css).toContain("src: url('/fonts/montserrat-latin.woff2')");
    });

    it('escapes the quotes and backslashes of a family and a URL', () => {
      const css = renderFontFaces({
        fontFaces: [{ ...montserrat, family: "O'Font", url: "/fonts/a'b\\c.woff2" }],
      });

      expect(css).toContain("font-family: 'O\\'Font';");
      expect(css).toContain("src: url('/fonts/a\\'b\\\\c.woff2')");
    });

    it('keeps the accents and spaces of a family', () => {
      const css = renderFontFaces({ fontFaces: [{ ...montserrat, family: 'Sœur Élégante' }] });

      expect(css).toContain("font-family: 'Sœur Élégante';");
    });
  });
});
