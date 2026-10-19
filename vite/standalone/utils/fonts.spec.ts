// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  type EmbeddedFont,
  findMissingFontUrls,
  readFontDataUrl,
  removeFontPreloads,
  toFontDataUrls,
} from './fonts.ts';

describe('readFontDataUrl', () => {
  let projectDir = '';
  let publicDir = '';

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'standalone-fonts-'));
    publicDir = join(projectDir, 'public');
    mkdirSync(join(publicDir, 'fonts'), { recursive: true });
    writeFileSync(join(publicDir, 'fonts', 'montserrat-latin.woff2'), 'wOF2font');
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('reads a font file of public/ as a data URL', () => {
    expect(readFontDataUrl({ publicDir, url: '/fonts/montserrat-latin.woff2' })).toBe(
      'data:font/woff2;base64,d09GMmZvbnQ=',
    );
  });

  it('reads an empty file as an empty data URL', () => {
    writeFileSync(join(publicDir, 'fonts', 'empty.woff2'), '');

    expect(readFontDataUrl({ publicDir, url: '/fonts/empty.woff2' })).toBe(
      'data:font/woff2;base64,',
    );
  });

  describe('edge cases', () => {
    it('reads nothing for a file that does not exist', () => {
      expect(readFontDataUrl({ publicDir, url: '/fonts/missing.woff2' })).toBe('');
    });

    it('reads nothing for a folder', () => {
      expect(readFontDataUrl({ publicDir, url: '/fonts' })).toBe('');
    });

    it('reads nothing for public/ itself', () => {
      expect(readFontDataUrl({ publicDir, url: '/' })).toBe('');
    });

    it('reads nothing out of public/', () => {
      writeFileSync(join(projectDir, 'outside.woff2'), 'secret');

      expect(readFontDataUrl({ publicDir, url: '/../outside.woff2' })).toBe('');
    });

    it.each([undefined, null, '', '  ', 42, {}])('reads nothing for the URL %j', url => {
      expect(readFontDataUrl({ publicDir, url })).toBe('');
    });

    it.each([undefined, null, '', '  ', 42, {}])('reads nothing for public/ at %j', dir => {
      expect(readFontDataUrl({ publicDir: dir, url: '/fonts/montserrat-latin.woff2' })).toBe('');
    });

    it('reads nothing without parameters', () => {
      expect(readFontDataUrl()).toBe('');
    });
  });
});

describe('findMissingFontUrls', () => {
  const montserrat = {
    url: '/fonts/montserrat-latin.woff2',
    dataUrl: 'data:font/woff2;base64,bW9u',
  };

  it('finds no missing font when each one has its data URL', () => {
    expect(findMissingFontUrls([montserrat])).toEqual([]);
  });

  it('lists the fonts whose file could not be read, in order', () => {
    const fonts = [
      { url: '/fonts/b.woff2', dataUrl: '' },
      montserrat,
      { url: '/fonts/a.woff2', dataUrl: '' },
    ];

    expect(findMissingFontUrls(fonts)).toEqual(['/fonts/b.woff2', '/fonts/a.woff2']);
  });

  describe('edge cases', () => {
    it.each([
      ['no data URL', { url: '/fonts/a.woff2' }],
      ['a data URL without its scheme', { url: '/fonts/a.woff2', dataUrl: 'abc' }],
      ['a data URL that is not a string', { url: '/fonts/a.woff2', dataUrl: 42 }],
    ])('lists a font with %s', (_, font) => {
      expect(findMissingFontUrls([font as Partial<EmbeddedFont>])).toEqual(['/fonts/a.woff2']);
    });

    it.each([
      ['no URL', { dataUrl: '' }],
      ['a blank URL', { url: ' ', dataUrl: '' }],
      ['a null entry', null],
      ['a string', '/fonts/a.woff2'],
    ])('skips an entry with %s', (_, font) => {
      expect(findMissingFontUrls([font as Partial<EmbeddedFont>])).toEqual([]);
    });

    it.each([undefined, null, 'fonts', 42, {}])('finds none in %j', fonts => {
      expect(findMissingFontUrls(fonts as unknown as EmbeddedFont[])).toEqual([]);
    });
  });
});

describe('toFontDataUrls', () => {
  const fonts: EmbeddedFont[] = [
    { url: '/fonts/montserrat-latin.woff2', dataUrl: 'data:font/woff2;base64,bW9udA==' },
    { url: '/fonts/saira-stencil-one-latin.woff2', dataUrl: 'data:font/woff2;base64,c2Fp+/$&' },
  ];

  it.each([
    [
      "src: url('/fonts/montserrat-latin.woff2') format('woff2');",
      "src: url('data:font/woff2;base64,bW9udA==') format('woff2');",
    ],
    ["url: '/fonts/montserrat-latin.woff2',", "url: 'data:font/woff2;base64,bW9udA==',"],
    ['url: "/fonts/montserrat-latin.woff2",', 'url: "data:font/woff2;base64,bW9udA==",'],
    ['url: `/fonts/montserrat-latin.woff2`,', 'url: `data:font/woff2;base64,bW9udA==`,'],
    [
      '"{\\"url\\":\\"/fonts/montserrat-latin.woff2\\"}"',
      '"{\\"url\\":\\"data:font/woff2;base64,bW9udA==\\"}"',
    ],
  ])('embeds the font named in %s', (source, expected) => {
    expect(toFontDataUrls({ source, fonts })).toBe(expected);
  });

  it('embeds every font, each time it is named, keeping the $ of a data URL', () => {
    const source =
      'a="/fonts/montserrat-latin.woff2";b="/fonts/saira-stencil-one-latin.woff2";' +
      'c="/fonts/montserrat-latin.woff2"';

    expect(toFontDataUrls({ source, fonts })).toBe(
      'a="data:font/woff2;base64,bW9udA==";b="data:font/woff2;base64,c2Fp+/$&";' +
        'c="data:font/woff2;base64,bW9udA=="',
    );
  });

  it.each([
    'url: "/fonts/montserrat-latin.woff2.bak"',
    'url: "/assets/fonts/montserrat-latin.woff2"',
    'url: "./fonts/montserrat-latin.woff2"',
    'url: "fonts/montserrat-latin.woff2"',
    'const font = /fonts/montserrat-latin.woff2;',
    'url("/fonts/montserrat-latin.woff2?v=2")',
  ])('leaves %s as it is, since it is not the whole URL of a font', source => {
    expect(toFontDataUrls({ source, fonts })).toBe(source);
  });

  describe('edge cases', () => {
    const code = "src: url('/fonts/montserrat-latin.woff2');";

    it.each([undefined, null, 42, {}])('gives an empty text for the source %j', value => {
      expect(toFontDataUrls({ source: value as unknown as string, fonts })).toBe('');
    });

    it.each([undefined, null, [], 'fonts', 42])(
      'leaves the code as it is for the fonts %j',
      value => {
        expect(toFontDataUrls({ source: code, fonts: value as unknown as EmbeddedFont[] })).toBe(
          code,
        );
      },
    );

    it.each([
      ['no URL', { dataUrl: 'data:font/woff2;base64,bW9udA==' }],
      ['a blank URL', { url: ' ', dataUrl: 'data:font/woff2;base64,bW9udA==' }],
      ['no data URL', { url: '/fonts/montserrat-latin.woff2' }],
      ['an empty data URL', { url: '/fonts/montserrat-latin.woff2', dataUrl: '' }],
      ['a data URL without its scheme', { url: '/fonts/montserrat-latin.woff2', dataUrl: 'abc' }],
      ['a null entry', null],
    ])('ignores a font with %s', (_, font) => {
      expect(toFontDataUrls({ source: code, fonts: [font as unknown as EmbeddedFont] })).toBe(code);
    });

    it('matches a URL with special characters literally', () => {
      const special = [{ url: '/fonts/a+b.woff2', dataUrl: 'data:font/woff2;base64,QQ==' }];

      expect(toFontDataUrls({ source: '"/fonts/aab.woff2"', fonts: special })).toBe(
        '"/fonts/aab.woff2"',
      );
      expect(toFontDataUrls({ source: '"/fonts/a+b.woff2"', fonts: special })).toBe(
        '"data:font/woff2;base64,QQ=="',
      );
    });

    it('gives an empty text without parameters', () => {
      expect(toFontDataUrls()).toBe('');
    });
  });
});

describe('removeFontPreloads', () => {
  const fontPreload = [
    '    <link',
    '      rel="preload"',
    '      href="/fonts/montserrat-latin.woff2"',
    '      as="font"',
    '      type="font/woff2"',
    '      crossorigin',
    '    />',
  ].join('\n');

  it('removes the links that preload a font, with their line', () => {
    const html = `<head>\n    <title>A</title>\n${fontPreload}\n${fontPreload}\n  </head>`;

    expect(removeFontPreloads(html)).toBe('<head>\n    <title>A</title>\n  </head>');
  });

  it.each([
    ['an icon', '<link rel="icon" href="./favicon.ico" />'],
    ['a module preload', '<link rel="modulepreload" crossorigin href="/assets/a.js">'],
    ['the preload of an image', '<link rel="preload" href="/home.webp" as="image" />'],
    ['a style sheet', '<link rel="stylesheet" href="/a.css" />'],
  ])('keeps %s', (_, link) => {
    const html = `<head>\n  ${link}\n</head>`;

    expect(removeFontPreloads(html)).toBe(html);
  });

  it('removes a font preload written on one line, whatever the order of its attributes', () => {
    expect(
      removeFontPreloads('<head><link as="font" href="/a.woff2" rel="preload" crossorigin></head>'),
    ).toBe('<head></head>');
  });

  describe('edge cases', () => {
    it.each([undefined, null, 42, {}])('gives an empty page for %j', html => {
      expect(removeFontPreloads(html)).toBe('');
    });

    it('leaves a page without links as it is', () => {
      expect(removeFontPreloads('<html><head></head></html>')).toBe('<html><head></head></html>');
    });
  });
});
