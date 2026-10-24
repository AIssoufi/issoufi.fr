import { getAssetFileName } from './assets.ts';

describe('getAssetFileName', () => {
  const fontFile = '/app/public/fonts/montserrat-latin.woff2';
  const fontAsset = {
    type: 'asset',
    fileName: 'assets/montserrat-latin-1a2b3c4d.woff2',
    originalFileNames: [fontFile],
  };
  const bundle = {
    'index.js': { type: 'chunk', fileName: 'index.js', facadeModuleId: '/app/src/index.tsx' },
    'assets/home-5e6f7a8b.css': { type: 'asset', fileName: 'assets/home-5e6f7a8b.css' },
    [fontAsset.fileName]: fontAsset,
  };

  it('finds the path in the build of the asset emitted from a file', () => {
    expect(getAssetFileName({ bundle, originalFileName: fontFile })).toBe(fontAsset.fileName);
  });

  it('finds an asset emitted from several files, such as two copies of the same content', () => {
    const sharedAsset = { ...fontAsset, originalFileNames: ['/app/public/other.woff2', fontFile] };

    expect(getAssetFileName({ bundle: { a: sharedAsset }, originalFileName: fontFile })).toBe(
      fontAsset.fileName,
    );
  });

  describe('edge cases', () => {
    it('finds nothing when no asset was emitted from the file', () => {
      expect(getAssetFileName({ bundle, originalFileName: '/app/public/fonts/saira.woff2' })).toBe(
        undefined,
      );
    });

    it.each([
      ['a chunk', { ...fontAsset, type: 'chunk' }],
      ['an asset without its sources', { ...fontAsset, originalFileNames: undefined }],
      ['sources that are not a list', { ...fontAsset, originalFileNames: fontFile }],
      ['an asset without a path', { ...fontAsset, fileName: undefined }],
      ['an asset with an empty path', { ...fontAsset, fileName: '' }],
      ['a null file', null],
    ])('finds nothing in %s', (_, file) => {
      const fileBundle = { a: file } as never;

      expect(getAssetFileName({ bundle: fileBundle, originalFileName: fontFile })).toBe(undefined);
    });

    it.each([[''], [' '], [undefined], [42]])('finds nothing for the file %j', originalFileName => {
      expect(getAssetFileName({ bundle, originalFileName: originalFileName as string })).toBe(
        undefined,
      );
    });

    it.each([[undefined], [null], ['bundle'], [42]])('finds nothing in the bundle %j', value => {
      expect(getAssetFileName({ bundle: value as never, originalFileName: fontFile })).toBe(
        undefined,
      );
    });

    it('finds nothing without parameters', () => {
      expect(getAssetFileName()).toBe(undefined);
    });
  });
});
