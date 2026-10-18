import { theme } from '../../src/theme/theme';
import { findMissingFonts, getFirstFontFamily, listFontsInUse } from './fonts.mjs';

/** Fonts of a page: the body font in three weights, and the display font of the logo. */
const FONTS_IN_USE = [
  { font: 'body', weights: ['regular', 'medium', 'bold'] },
  { font: 'display', weights: ['regular'] },
];

describe('getFirstFontFamily', () => {
  it.each([
    ["'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif", 'Montserrat'],
    ["'Saira Stencil One', cursive", 'Saira Stencil One'],
    ['"Saira Stencil One", cursive', 'Saira Stencil One'],
    ['  Montserrat , sans-serif', 'Montserrat'],
    ['source-code-pro, Menlo, monospace', 'source-code-pro'],
    ['Montserrat', 'Montserrat'],
  ])('reads the first family of %j', (stack, expected) => {
    expect(getFirstFontFamily(stack)).toBe(expected);
  });

  it.each([undefined, null, 42, {}, ['Montserrat']])('gives an empty name for %j', stack => {
    expect(getFirstFontFamily(stack)).toBe('');
  });

  it('gives an empty name for an empty stack', () => {
    expect(getFirstFontFamily('')).toBe('');
  });
});

describe('listFontsInUse', () => {
  it('lists the body font in each weight of the texts, and the display font of the logo', () => {
    expect(listFontsInUse({ theme, fontsInUse: FONTS_IN_USE })).toEqual([
      '400 16px "Montserrat"',
      '500 16px "Montserrat"',
      '700 16px "Montserrat"',
      '400 16px "Saira Stencil One"',
    ]);
  });

  it('leaves out a font whose stack is missing from the theme', () => {
    const fonts = { ...theme.fonts, display: undefined };

    expect(listFontsInUse({ theme: { ...theme, fonts }, fontsInUse: FONTS_IN_USE })).toEqual([
      '400 16px "Montserrat"',
      '500 16px "Montserrat"',
      '700 16px "Montserrat"',
    ]);
  });

  it.each([undefined, NaN, '700'])('leaves out the bold weight %j, which is not a number', bold => {
    const fontWeights = { ...theme.fontWeights, bold };

    expect(
      listFontsInUse({ theme: { ...theme, fontWeights }, fontsInUse: FONTS_IN_USE }),
    ).not.toContain('700 16px "Montserrat"');
  });

  it('lists nothing for a page that uses no font', () => {
    expect(listFontsInUse({ theme, fontsInUse: [] })).toEqual([]);
  });

  it('leaves out a weight whose name the theme does not have', () => {
    const fontsInUse = [{ font: 'body', weights: ['regular', 'heavy'] }];

    expect(listFontsInUse({ theme, fontsInUse })).toEqual(['400 16px "Montserrat"']);
  });

  it('lists nothing for a theme without fonts', () => {
    expect(listFontsInUse({ theme: { ...theme, fonts: {} }, fontsInUse: FONTS_IN_USE })).toEqual(
      [],
    );
  });
});

describe('findMissingFonts', () => {
  it('finds none when each font has a loaded face', () => {
    const checks = [
      { font: '400 16px "Montserrat"', loadedFaceCount: 1 },
      { font: '700 16px "Montserrat"', loadedFaceCount: 2 },
    ];

    expect(findMissingFonts(checks)).toEqual([]);
  });

  it('reports a font without a loaded face, such as a bold whose file failed', () => {
    const checks = [
      { font: '400 16px "Montserrat"', loadedFaceCount: 1 },
      { font: '700 16px "Montserrat"', loadedFaceCount: 0 },
      { font: '400 16px "Saira Stencil One"', loadedFaceCount: 0 },
    ];

    expect(findMissingFonts(checks)).toEqual([
      '700 16px "Montserrat"',
      '400 16px "Saira Stencil One"',
    ]);
  });

  it.each([-1, NaN, '1', undefined, null])(
    'reports a font whose count of loaded faces is %j',
    loadedFaceCount => {
      expect(findMissingFonts([{ font: '400 16px "Montserrat"', loadedFaceCount }])).toEqual([
        '400 16px "Montserrat"',
      ]);
    },
  );

  it.each([null, 'font', 42, { loadedFaceCount: 0 }, { font: 7, loadedFaceCount: 0 }])(
    'reports the entry %j, which is not a font check, as an unknown font',
    check => {
      expect(findMissingFonts([check])).toEqual(['unknown font']);
    },
  );

  it.each([[[]], [undefined], [null], ['checks'], [{}]])('finds none in %j', checks => {
    expect(findMissingFonts(checks)).toEqual([]);
  });
});
