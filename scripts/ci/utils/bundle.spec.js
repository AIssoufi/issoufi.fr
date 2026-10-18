import {
  checkBundleBudgets,
  checkScriptBudget,
  findLargeImages,
  findUncountedPaths,
  isBudgetedScript,
  isBuildFile,
  splitInitialLoad,
} from './bundle.mjs';

describe('isBuildFile', () => {
  it.each([
    { path: 'chess.png', bytes: 928_988 },
    { path: 'assets/index.js', bytes: 788_320, gzipBytes: 224_940 },
    { path: 'a.png' },
  ])('accepts %o', value => {
    expect(isBuildFile(value)).toBe(true);
  });

  it.each([
    undefined,
    null,
    'chess.png',
    42,
    [],
    {},
    { bytes: 900 },
    { path: '' },
    { path: 42 },
    { path: null },
  ])('rejects %o', value => {
    expect(isBuildFile(value)).toBe(false);
  });
});

describe('isBudgetedScript', () => {
  it.each(['assets/x.js', 'assets/x.css', 'assets/nested/x.js'])('counts %s', path => {
    expect(isBudgetedScript(path)).toBe(true);
  });

  it.each([
    'x.js',
    'x.css',
    'assets/x.js.map',
    'assets/x.png',
    'assets/x.json',
    'assets/',
    'myassets/x.js',
    'public/assets/x.js',
  ])('leaves out %s', path => {
    expect(isBudgetedScript(path)).toBe(false);
  });

  it.each([undefined, null, '', 42, {}, ['assets/x.js']])(
    'leaves out the invalid path %s',
    path => {
      expect(isBudgetedScript(path)).toBe(false);
    },
  );
});

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

describe('checkScriptBudget', () => {
  it('adds up the gzip sizes', () => {
    const scripts = [{ gzipBytes: 100 }, { gzipBytes: 50 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 })).toEqual({
      totalGzipBytes: 150,
      isOverBudget: false,
    });
  });

  it('accepts a total equal to the budget', () => {
    const scripts = [{ gzipBytes: 200 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).isOverBudget).toBe(false);
  });

  it('rejects a total one byte over the budget', () => {
    const scripts = [{ gzipBytes: 201 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).isOverBudget).toBe(true);
  });

  it.each([undefined, null, 'assets/index.js', {}])('gives 0 for the scripts %o', scripts => {
    expect(checkScriptBudget({ scripts, budgetBytes: 200 })).toEqual({
      totalGzipBytes: 0,
      isOverBudget: false,
    });
  });

  it('counts invalid gzip sizes as 0', () => {
    const scripts = [{ gzipBytes: NaN }, { gzipBytes: -10 }, {}, null, { gzipBytes: 30 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).totalGzipBytes).toBe(30);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '200'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => checkScriptBudget({ scripts: [], budgetBytes })).toThrow(RangeError);
    },
  );
});

describe('checkBundleBudgets', () => {
  const main = { path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 };
  const page = { path: 'assets/Projects-abc.js', bytes: 14_140, gzipBytes: 4_520 };
  const budgets = { budgetBytes: 210_000, initialLoadBudgetBytes: 150_000 };

  it('checks the initial load and all the scripts against their budgets', () => {
    expect(
      checkBundleBudgets({ scripts: [page, main], initialPaths: [main.path], ...budgets }),
    ).toEqual({
      initialScripts: [main],
      otherScripts: [page],
      hasInitialLoad: true,
      initialLoad: { totalGzipBytes: 131_860, isOverBudget: false },
      total: { totalGzipBytes: 136_380, isOverBudget: false },
    });
  });

  it('fails the initial load over its budget, even with the total within its own', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 210_000,
      initialLoadBudgetBytes: 131_859,
    });
    expect(initialLoad.isOverBudget).toBe(true);
    expect(total.isOverBudget).toBe(false);
  });

  it('fails the total over its budget, even with the initial load within its own', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 136_379,
      initialLoadBudgetBytes: 150_000,
    });
    expect(initialLoad.isOverBudget).toBe(false);
    expect(total.isOverBudget).toBe(true);
  });

  it('accepts sizes equal to the budgets', () => {
    const { initialLoad, total } = checkBundleBudgets({
      scripts: [page, main],
      initialPaths: [main.path],
      budgetBytes: 136_380,
      initialLoadBudgetBytes: 131_860,
    });
    expect(initialLoad.isOverBudget).toBe(false);
    expect(total.isOverBudget).toBe(false);
  });

  it.each([undefined, null, {}, [], main.path, ['register-sw.js']])(
    'has no initial load for the initial paths %o',
    initialPaths => {
      expect(checkBundleBudgets({ scripts: [page, main], initialPaths, ...budgets })).toEqual({
        initialScripts: [],
        otherScripts: [page, main],
        hasInitialLoad: false,
        initialLoad: { totalGzipBytes: 0, isOverBudget: false },
        total: { totalGzipBytes: 136_380, isOverBudget: false },
      });
    },
  );

  it.each([undefined, null, {}, [], [null, { gzipBytes: 9_000 }, { path: '' }]])(
    'has no initial load and sizes of 0 for the scripts %o',
    scripts => {
      expect(checkBundleBudgets({ scripts, initialPaths: [main.path], ...budgets })).toEqual({
        initialScripts: [],
        otherScripts: [],
        hasInitialLoad: false,
        initialLoad: { totalGzipBytes: 0, isOverBudget: false },
        total: { totalGzipBytes: 0, isOverBudget: false },
      });
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '210000'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => checkBundleBudgets({ ...budgets, budgetBytes })).toThrow(RangeError);
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '150000'])(
    'throws for the invalid initial load budget %s',
    initialLoadBudgetBytes => {
      expect(() => checkBundleBudgets({ ...budgets, initialLoadBudgetBytes })).toThrow(RangeError);
    },
  );
});

describe('findLargeImages', () => {
  it('lists the images over the limit, the biggest first', () => {
    const files = [
      { path: 'small.png', bytes: 100 },
      { path: 'chess.png', bytes: 900 },
      { path: 'photos/study.jpeg', bytes: 600 },
      { path: 'assets/index.js', bytes: 5000 },
    ];
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual([
      { path: 'chess.png', bytes: 900 },
      { path: 'photos/study.jpeg', bytes: 600 },
    ]);
  });

  it('keeps an image exactly at the limit out of the list', () => {
    const files = [
      { path: 'at-limit.webp', bytes: 500 },
      { path: 'over.webp', bytes: 501 },
    ];
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual([
      { path: 'over.webp', bytes: 501 },
    ]);
  });

  it('recognizes extensions in any case', () => {
    const files = [{ path: 'PHOTO.JPG', bytes: 900 }];
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual(files);
  });

  it.each([undefined, null, 'chess.png', {}])('gives an empty list for the files %o', files => {
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual([]);
  });

  it('ignores entries without a path or with an invalid size', () => {
    const files = [null, { bytes: 900 }, { path: 'a.png', bytes: NaN }, { path: 'b.png' }];
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual([]);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '500'])(
    'throws for the invalid limit %s',
    limitBytes => {
      const files = [{ path: 'chess.png', bytes: 900 }];
      expect(() => findLargeImages({ files, limitBytes })).toThrow(RangeError);
    },
  );
});
