import { FONT_FACES } from '../src/theme/constants';
import type { FontFaceDeclaration } from '../src/theme/types';
import { renderFontFaces } from '../src/theme/utils';
import {
  DEFAULT_DEV_PORT,
  DEFAULT_PREVIEW_PORT,
  FALLBACK_CHUNK_NAME,
  MAX_PORT,
  MIN_PORT,
} from './constants';
import {
  getChunkName,
  getFontFaceTags,
  getPageChunkFile,
  getServerPorts,
  parsePort,
} from './utils';

describe('parsePort', () => {
  it.each([
    ['12345', 12345],
    ['3000', 3000],
    ['10000', 10000],
    ['19999', 19999],
  ])('reads the port %j', (value, expected) => {
    expect(parsePort(value)).toBe(expected);
  });

  it('accepts the lowest and the highest port', () => {
    expect(parsePort(String(MIN_PORT))).toBe(MIN_PORT);
    expect(parsePort(String(MAX_PORT))).toBe(MAX_PORT);
  });

  it('ignores surrounding spaces and leading zeros', () => {
    expect(parsePort(' 12345 ')).toBe(12345);
    expect(parsePort('\t3000\n')).toBe(3000);
    expect(parsePort('03000')).toBe(3000);
  });

  describe('edge cases', () => {
    it.each([undefined, null])('returns undefined for the missing value %s', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each(['', '   '])('returns undefined for the empty value %j', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each(['0', '65536', '99999999999999999999'])(
      'returns undefined for the out-of-range port %j',
      value => {
        expect(parsePort(value)).toBeUndefined();
      },
    );

    it.each([
      'abc',
      '3000abc',
      '30 00',
      '-1',
      '+3000',
      '3000.5',
      '3e3',
      '0x1F90',
      'NaN',
      'Infinity',
    ])('returns undefined for the invalid port %j', value => {
      expect(parsePort(value)).toBeUndefined();
    });

    it.each([3000, NaN, true, {}, ['3000']])(
      'returns undefined for the value %j, which is not a string',
      value => {
        expect(parsePort(value)).toBeUndefined();
      },
    );
  });
});

describe('getServerPorts', () => {
  it('uses PORT for both the dev and the preview server', () => {
    expect(getServerPorts({ PORT: '12345' })).toEqual({ dev: 12345, preview: 12345 });
  });

  it('ignores the other variables', () => {
    expect(getServerPorts({ PORT: '12345', BROWSER: 'none', VITE_PORT: '4000' })).toEqual({
      dev: 12345,
      preview: 12345,
    });
  });

  describe('without a valid PORT, as in the main checkout', () => {
    const defaultPorts = { dev: DEFAULT_DEV_PORT, preview: DEFAULT_PREVIEW_PORT };

    it('keeps the default ports without PORT', () => {
      expect(getServerPorts({})).toEqual(defaultPorts);
      expect(getServerPorts({ PORT: undefined })).toEqual(defaultPorts);
    });

    it('keeps the default ports without an environment', () => {
      expect(getServerPorts()).toEqual(defaultPorts);
      expect(getServerPorts(null as never)).toEqual(defaultPorts);
    });

    it.each(['', '  ', 'abc', '0', '65536', '3000.5'])(
      'keeps the default ports for the invalid PORT %j',
      PORT => {
        expect(getServerPorts({ PORT })).toEqual(defaultPorts);
      },
    );
  });
});

describe('getChunkName', () => {
  it.each([
    ['/app/src/pages/Projects/index.ts', 'Projects'],
    ['/app/src/pages/NotFound/index.tsx', 'NotFound'],
    ['C:\\app\\src\\pages\\Experiences\\index.ts', 'Experiences'],
  ])('names the chunk of %s after its folder', (facadeModuleId, expected) => {
    expect(getChunkName({ name: 'index', facadeModuleId })).toBe(expected);
  });

  it('keeps the name of a chunk whose module is not an index file', () => {
    const facadeModuleId = '/app/node_modules/library/dist/library.js';

    expect(getChunkName({ name: 'library', facadeModuleId })).toBe('library');
  });

  describe('edge cases', () => {
    it.each([
      ['a shared chunk without a main module', null],
      ['a chunk without a module path', undefined],
      ['an index file without a folder', 'index.ts'],
      ['an index file at the root of the disk', '/index.ts'],
    ])('keeps the index name for %s', (_, facadeModuleId) => {
      expect(getChunkName({ name: 'index', facadeModuleId })).toBe('index');
    });

    it.each([
      ['no chunk', undefined],
      ['no name', { facadeModuleId: '/app/src/pages/Projects/index.ts' }],
      ['an empty name', { name: '' }],
    ])('falls back to a generic name for %s', (_, chunk) => {
      expect(getChunkName(chunk)).toBe(FALLBACK_CHUNK_NAME);
    });
  });
});

describe('getPageChunkFile', () => {
  const bundle = {
    'assets/index-1a2b3c.js': {
      type: 'chunk',
      fileName: 'assets/index-1a2b3c.js',
      facadeModuleId: '/app/src/index.tsx',
    },
    'assets/Projects-4d5e6f.js': {
      type: 'chunk',
      fileName: 'assets/Projects-4d5e6f.js',
      facadeModuleId: '/app/src/pages/Projects/index.ts',
    },
    'assets/Experiences-7a8b9c.js': {
      type: 'chunk',
      fileName: 'assets/Experiences-7a8b9c.js',
      facadeModuleId: 'C:\\app\\src\\pages\\Experiences\\index.ts',
    },
    'assets/shared-0d1e2f.js': {
      type: 'chunk',
      fileName: 'assets/shared-0d1e2f.js',
      facadeModuleId: null,
    },
    'projects.html': { type: 'asset', fileName: 'projects.html' },
  };

  it('finds the chunk built from the index file of a page folder', () => {
    expect(getPageChunkFile({ bundle, folder: 'Projects' })).toBe('assets/Projects-4d5e6f.js');
  });

  it('finds the chunk of a module path with Windows separators', () => {
    expect(getPageChunkFile({ bundle, folder: 'Experiences' })).toBe(
      'assets/Experiences-7a8b9c.js',
    );
  });

  it('returns undefined for the home page, which is in the main chunk', () => {
    expect(getPageChunkFile({ bundle, folder: 'Home' })).toBeUndefined();
  });

  it.each([
    ['a folder of the same name elsewhere', '/app/src/components/Projects/index.ts'],
    ['a sub-component of the page', '/app/src/pages/Projects/Project/index.ts'],
    ['a page folder that ends with the same name', '/app/src/pages/OldProjects/index.ts'],
    ['another file of the page folder', '/app/src/pages/Projects/Projects.tsx'],
  ])('ignores the chunk of %s', (_, facadeModuleId) => {
    const otherBundle = {
      'assets/x.js': { type: 'chunk', fileName: 'assets/x.js', facadeModuleId },
    };

    expect(getPageChunkFile({ bundle: otherBundle, folder: 'Projects' })).toBeUndefined();
  });

  it('ignores an asset whose name looks like the page module', () => {
    const otherBundle = {
      'src/pages/Projects/index.ts': {
        type: 'asset',
        fileName: 'src/pages/Projects/index.ts',
        facadeModuleId: '/app/src/pages/Projects/index.ts',
      },
    };

    expect(getPageChunkFile({ bundle: otherBundle, folder: 'Projects' })).toBeUndefined();
  });

  describe('edge cases', () => {
    it.each([
      ['no parameters', undefined],
      ['no bundle', { folder: 'Projects' }],
      ['a null bundle', { bundle: null as never, folder: 'Projects' }],
      ['a bundle that is not an object', { bundle: 'assets' as never, folder: 'Projects' }],
      ['an empty bundle', { bundle: {}, folder: 'Projects' }],
      ['no folder', { bundle }],
      ['an empty folder', { bundle, folder: '' }],
      ['a blank folder', { bundle, folder: '  ' }],
      ['a folder that is not a string', { bundle, folder: 42 as never }],
    ])('returns undefined for %s', (_, params) => {
      expect(getPageChunkFile(params)).toBeUndefined();
    });

    it('skips the missing files of a malformed bundle', () => {
      const malformedBundle = { a: null, b: undefined, ...bundle };

      expect(getPageChunkFile({ bundle: malformedBundle, folder: 'Projects' })).toBe(
        'assets/Projects-4d5e6f.js',
      );
    });

    it.each([
      ['no file name', undefined],
      ['an empty file name', ''],
    ])('returns undefined for a page chunk with %s', (_, fileName) => {
      const facadeModuleId = '/app/src/pages/Projects/index.ts';
      const otherBundle = { 'assets/x.js': { type: 'chunk', fileName, facadeModuleId } };

      expect(getPageChunkFile({ bundle: otherBundle, folder: 'Projects' })).toBeUndefined();
    });
  });
});

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
  });
});
