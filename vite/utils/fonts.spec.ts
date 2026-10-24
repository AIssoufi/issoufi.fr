import { FONT_FACES } from '../../src/theme/constants.ts';
import type { FontFaceDeclaration } from '../../src/theme/types.ts';
import { renderFontFaces } from '../../src/theme/utils.ts';
import { getFontFaceTags } from './fonts.ts';

describe('getFontFaceTags', () => {
  const montserrat: FontFaceDeclaration = {
    family: 'Montserrat',
    url: '/fonts/montserrat-latin.woff2',
    weight: '100 900',
    style: 'normal',
    unicodeRange: 'U+0000-00FF',
  };

  it('preloads each font file, then declares the fonts in a style of the head', () => {
    const saira = { ...montserrat, family: 'Saira Stencil One', url: '/fonts/saira.woff2' };

    expect(getFontFaceTags({ fontFaces: [montserrat, saira] })).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'preload',
          href: '/fonts/montserrat-latin.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: true,
        },
        injectTo: 'head',
      },
      {
        tag: 'link',
        attrs: {
          rel: 'preload',
          href: '/fonts/saira.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: true,
        },
        injectTo: 'head',
      },
      {
        tag: 'style',
        children: renderFontFaces({ fontFaces: [montserrat, saira] }),
        injectTo: 'head',
      },
    ]);
  });

  it('preloads and declares the web fonts of the site by default', () => {
    const tags = getFontFaceTags();

    expect(tags.filter(({ tag }) => tag === 'link').map(({ attrs }) => attrs?.href)).toEqual(
      FONT_FACES.map(({ url }) => url),
    );
    expect(tags.at(-1)).toEqual({ tag: 'style', children: renderFontFaces(), injectTo: 'head' });
  });

  describe('edge cases', () => {
    it.each([[[]], [null], ['/fonts/a.woff2'], [42], [{}]])(
      'adds no tag for the fonts %j',
      fontFaces => {
        expect(
          getFontFaceTags({ fontFaces: fontFaces as unknown as FontFaceDeclaration[] }),
        ).toEqual([]);
      },
    );

    it.each([
      ['no family', { ...montserrat, family: undefined }],
      ['no URL', { ...montserrat, url: '' }],
      ['a null entry', null],
    ])('neither preloads nor declares a font with %s', (_, face) => {
      const fontFaces = [face, montserrat] as unknown as FontFaceDeclaration[];

      expect(getFontFaceTags({ fontFaces })).toEqual(getFontFaceTags({ fontFaces: [montserrat] }));
    });

    it('adds no tag when no font can be declared', () => {
      const fontFaces = [{ ...montserrat, url: ' ' }] as unknown as FontFaceDeclaration[];

      expect(getFontFaceTags({ fontFaces })).toEqual([]);
    });

    it.each([[null], ['/fonts/a.woff2'], [42]])(
      'keeps the URLs of the fonts for the URL function %j',
      getUrl => {
        expect(
          getFontFaceTags({
            fontFaces: [montserrat],
            getUrl: getUrl as unknown as (url: string) => string,
          }),
        ).toEqual(getFontFaceTags({ fontFaces: [montserrat] }));
      },
    );

    it.each([[''], [' '], [undefined], [42]])(
      'neither preloads nor declares a font whose URL becomes %j',
      pageUrl => {
        const saira = { ...montserrat, family: 'Saira Stencil One', url: '/fonts/saira.woff2' };
        const getUrl = (url: string) => (url === saira.url ? pageUrl : url) as string;

        expect(getFontFaceTags({ fontFaces: [montserrat, saira], getUrl })).toEqual(
          getFontFaceTags({ fontFaces: [montserrat] }),
        );
      },
    );
  });

  it('preloads and declares each font from the URL that the function gives', () => {
    const hashedUrl = '/assets/montserrat-latin-1a2b3c4d.woff2';
    const tags = getFontFaceTags({ fontFaces: [montserrat], getUrl: () => hashedUrl });

    expect(tags).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'preload',
          href: hashedUrl,
          as: 'font',
          type: 'font/woff2',
          crossorigin: true,
        },
        injectTo: 'head',
      },
      {
        tag: 'style',
        children: renderFontFaces({ fontFaces: [{ ...montserrat, url: hashedUrl }] }),
        injectTo: 'head',
      },
    ]);
  });
});
