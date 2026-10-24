import { FALLBACK_CHUNK_NAME } from '../constants.ts';
import { getChunkName, getPageChunkFile, getPageChunkFiles } from './chunks.ts';

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

describe('getPageChunkFiles', () => {
  /** Parameters of `chunk`. */
  interface ChunkParams {
    /** Path of the chunk in the build. */
    fileName: string;
    /** Path of its main module, `null` for a chunk of shared modules. */
    facadeModuleId?: string | null;
    /** Whether the chunk is an entry of the build. */
    isEntry?: boolean;
    /** File names of the chunks that it imports statically. */
    imports?: string[];
  }

  /** Chunk of the build, with the fields that link it to the others. */
  const chunk = ({
    fileName,
    facadeModuleId = null,
    isEntry = false,
    imports = [],
  }: ChunkParams) => ({
    [fileName]: { type: 'chunk', fileName, facadeModuleId, isEntry, imports },
  });

  // Two lazy pages share a module, which becomes a chunk of its own that imports another one
  const bundle = {
    ...chunk({
      fileName: 'assets/index-1a2b3c.js',
      facadeModuleId: '/app/src/index.tsx',
      isEntry: true,
    }),
    ...chunk({
      fileName: 'assets/Projects-4d5e6f.js',
      facadeModuleId: '/app/src/pages/Projects/index.ts',
      imports: ['assets/index-1a2b3c.js', 'assets/technologies-7a8b9c.js'],
    }),
    ...chunk({
      fileName: 'assets/Experiences-0d1e2f.js',
      facadeModuleId: '/app/src/pages/Experiences/index.ts',
      imports: ['assets/technologies-7a8b9c.js', 'assets/index-1a2b3c.js'],
    }),
    ...chunk({
      fileName: 'assets/NotFound-3a4b5c.js',
      facadeModuleId: '/app/src/pages/NotFound/index.ts',
      imports: ['assets/index-1a2b3c.js'],
    }),
    ...chunk({
      fileName: 'assets/technologies-7a8b9c.js',
      imports: ['assets/index-1a2b3c.js', 'assets/icons-6d7e8f.js'],
    }),
    ...chunk({ fileName: 'assets/icons-6d7e8f.js', imports: ['assets/technologies-7a8b9c.js'] }),
    'projects.html': { type: 'asset', fileName: 'projects.html' },
  };

  it.each([
    ['Projects', 'assets/Projects-4d5e6f.js'],
    ['Experiences', 'assets/Experiences-0d1e2f.js'],
  ])('lists the chunk of %s, then the chunks it shares with another page', (folder, pageChunk) => {
    expect(getPageChunkFiles({ bundle, folder })).toEqual([
      pageChunk,
      'assets/technologies-7a8b9c.js',
      'assets/icons-6d7e8f.js',
    ]);
  });

  it('lists only the chunk of a page that imports nothing but the main chunk', () => {
    expect(getPageChunkFiles({ bundle, folder: 'NotFound' })).toEqual([
      'assets/NotFound-3a4b5c.js',
    ]);
  });

  it('leaves out an entry chunk and what it imports, which the template already loads', () => {
    const entryBundle = {
      ...bundle,
      ...chunk({
        fileName: 'assets/index-1a2b3c.js',
        isEntry: true,
        imports: ['assets/vendor-9a8b7c.js'],
      }),
      ...chunk({ fileName: 'assets/vendor-9a8b7c.js' }),
    };

    expect(getPageChunkFiles({ bundle: entryBundle, folder: 'NotFound' })).toEqual([
      'assets/NotFound-3a4b5c.js',
    ]);
  });

  it('leaves out a chunk that an entry chunk imports too, and the chunks it imports', () => {
    const entryBundle = {
      ...bundle,
      ...chunk({
        fileName: 'assets/index-1a2b3c.js',
        isEntry: true,
        imports: ['assets/vendor-9a8b7c.js'],
      }),
      ...chunk({ fileName: 'assets/vendor-9a8b7c.js', imports: ['assets/react-5f6e7d.js'] }),
      ...chunk({ fileName: 'assets/react-5f6e7d.js' }),
      ...chunk({
        fileName: 'assets/NotFound-3a4b5c.js',
        facadeModuleId: '/app/src/pages/NotFound/index.ts',
        imports: ['assets/vendor-9a8b7c.js', 'assets/react-5f6e7d.js'],
      }),
    };

    expect(getPageChunkFiles({ bundle: entryBundle, folder: 'NotFound' })).toEqual([
      'assets/NotFound-3a4b5c.js',
    ]);
  });

  it('returns none for the home page, which is in the main chunk', () => {
    expect(getPageChunkFiles({ bundle, folder: 'Home' })).toEqual([]);
  });

  it.each([
    ['an entry chunk imports it', { entryImports: ['assets/NotFound-3a4b5c.js'], isEntry: false }],
    ['it is an entry chunk', { entryImports: [], isEntry: true }],
  ])('returns none for a page chunk when %s, which the template loads', (_, page) => {
    const entryBundle = {
      ...bundle,
      ...chunk({ fileName: 'assets/index-1a2b3c.js', isEntry: true, imports: page.entryImports }),
      ...chunk({
        fileName: 'assets/NotFound-3a4b5c.js',
        facadeModuleId: '/app/src/pages/NotFound/index.ts',
        isEntry: page.isEntry,
      }),
    };

    expect(getPageChunkFiles({ bundle: entryBundle, folder: 'NotFound' })).toEqual([]);
  });

  describe('edge cases', () => {
    it.each([
      ['no parameters', undefined],
      ['no bundle', { folder: 'Projects' }],
      ['a null bundle', { bundle: null as never, folder: 'Projects' }],
      ['an empty bundle', { bundle: {}, folder: 'Projects' }],
      ['no folder', { bundle }],
      ['a blank folder', { bundle, folder: '  ' }],
    ])('returns none for %s', (_, params) => {
      expect(getPageChunkFiles(params)).toEqual([]);
    });

    it.each([
      ['a file missing from the bundle', 'assets/missing-1a2b3c.js'],
      ['an asset', 'projects.html'],
      ['an empty file name', ''],
      ['a file name that is not a string', 42],
      ['a null file name', null],
      ['a file of the bundle that is null', 'assets/null-1a2b3c.js'],
    ])('skips an import of %s', (_, fileName) => {
      const malformedBundle = {
        ...bundle,
        'assets/null-1a2b3c.js': null,
        ...chunk({
          fileName: 'assets/NotFound-3a4b5c.js',
          facadeModuleId: '/app/src/pages/NotFound/index.ts',
          imports: [fileName as string, 'assets/icons-6d7e8f.js'],
        }),
      };

      expect(getPageChunkFiles({ bundle: malformedBundle, folder: 'NotFound' })).toEqual([
        'assets/NotFound-3a4b5c.js',
        'assets/icons-6d7e8f.js',
        'assets/technologies-7a8b9c.js',
      ]);
    });

    it.each([
      ['no imports', undefined],
      ['imports that are not a list', 'assets/icons-6d7e8f.js'],
    ])('lists only the chunk of a page with %s', (_, imports) => {
      const malformedBundle = {
        'assets/NotFound-3a4b5c.js': {
          type: 'chunk',
          fileName: 'assets/NotFound-3a4b5c.js',
          facadeModuleId: '/app/src/pages/NotFound/index.ts',
          imports: imports as never,
        },
        ...chunk({ fileName: 'assets/icons-6d7e8f.js' }),
      };

      expect(getPageChunkFiles({ bundle: malformedBundle, folder: 'NotFound' })).toEqual([
        'assets/NotFound-3a4b5c.js',
      ]);
    });
  });
});
