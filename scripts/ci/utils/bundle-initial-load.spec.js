import { findUncountedPaths, splitInitialLoad } from './bundle-initial-load.mjs';

describe('splitInitialLoad', () => {
  const main = { path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 };
  const style = { path: 'assets/index-abc.css', bytes: 2_100, gzipBytes: 900 };
  const page = { path: 'assets/Projects-abc.js', bytes: 14_140, gzipBytes: 4_520 };

  it('splits the scripts of the initial load from the others, in the order of the list', () => {
    const scripts = [page, main, style];
    expect(splitInitialLoad({ scripts, initialPaths: [style.path, main.path] })).toEqual({
      initialScripts: [main, style],
      otherScripts: [page],
    });
  });

  it('matches the paths exactly', () => {
    const initialPaths = ['assets/index-abc', 'ASSETS/INDEX-ABC.JS', `/${main.path}`];
    expect(splitInitialLoad({ scripts: [main], initialPaths })).toEqual({
      initialScripts: [],
      otherScripts: [main],
    });
  });

  it.each([undefined, null, {}, 'assets/index-abc.js', []])(
    'puts every script among the others for the paths %o',
    initialPaths => {
      expect(splitInitialLoad({ scripts: [main, page], initialPaths })).toEqual({
        initialScripts: [],
        otherScripts: [main, page],
      });
    },
  );

  it.each([undefined, null, {}, []])('gives two empty lists for the scripts %o', scripts => {
    expect(splitInitialLoad({ scripts, initialPaths: [main.path] })).toEqual({
      initialScripts: [],
      otherScripts: [],
    });
  });

  it('leaves out the entries that are not build files', () => {
    const scripts = [null, main.path, { gzipBytes: 9_000 }, { path: '' }, main, page];
    expect(splitInitialLoad({ scripts, initialPaths: [main.path, ''] })).toEqual({
      initialScripts: [main],
      otherScripts: [page],
    });
  });
});

describe('findUncountedPaths', () => {
  const scripts = [{ path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 }];

  it('lists the paths that no script of the build matches, in their order', () => {
    const initialPaths = ['register-sw.js', 'assets/index-abc.js', 'assets/missing.css'];
    expect(findUncountedPaths({ scripts, initialPaths })).toEqual([
      'register-sw.js',
      'assets/missing.css',
    ]);
  });

  it('gives an empty list when every path is counted', () => {
    expect(findUncountedPaths({ scripts, initialPaths: ['assets/index-abc.js'] })).toEqual([]);
  });

  it.each([undefined, null, {}, 'register-sw.js', []])(
    'gives an empty list for the paths %o',
    initialPaths => {
      expect(findUncountedPaths({ scripts, initialPaths })).toEqual([]);
    },
  );

  it.each([undefined, null, {}, [], [null, { gzipBytes: 900 }, { path: '' }]])(
    'lists every path for the scripts %o',
    list => {
      expect(findUncountedPaths({ scripts: list, initialPaths: ['assets/index-abc.js'] })).toEqual([
        'assets/index-abc.js',
      ]);
    },
  );

  it('ignores the entries that are not paths', () => {
    const initialPaths = [null, undefined, '', 42, {}, ['register-sw.js'], 'register-sw.js'];
    expect(findUncountedPaths({ scripts, initialPaths })).toEqual(['register-sw.js']);
  });
});
