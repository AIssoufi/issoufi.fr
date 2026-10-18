import {
  checkBundleBudgets,
  checkScriptBudget,
  findLargeImages,
  findUncountedPaths,
  isBudgetedScript,
  isBuildFile,
  renderBundleReport,
  renderLargeImagesSection,
  renderScriptsTable,
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

describe('renderScriptsTable', () => {
  const initialScripts = [
    { path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 },
    { path: 'assets/index-abc.css', bytes: 2_100, gzipBytes: 900 },
  ];
  const otherScripts = [{ path: 'assets/Projects-abc.js', bytes: 14_140, gzipBytes: 4_520 }];

  it('lists the initial load and its size, then the other scripts and the total', () => {
    const table = renderScriptsTable({
      initialScripts,
      otherScripts,
      initialLoadGzipBytes: 132_760,
      totalGzipBytes: 137_280,
    });
    expect(table).toBe(
      [
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| `assets/index-abc.js` | 403.2 kB | 131.9 kB |',
        '| `assets/index-abc.css` | 2.1 kB | 0.9 kB |',
        '| **Initial load** (`index.html`) | | **132.8 kB** |',
        '| `assets/Projects-abc.js` | 14.1 kB | 4.5 kB |',
        '| **Total** | | **137.3 kB** |',
      ].join('\n'),
    );
  });

  it('keeps the initial load row without scripts in the initial load', () => {
    const table = renderScriptsTable({ otherScripts, totalGzipBytes: 4_520 });
    expect(table).toBe(
      [
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| **Initial load** (`index.html`) | | **0.0 kB** |',
        '| `assets/Projects-abc.js` | 14.1 kB | 4.5 kB |',
        '| **Total** | | **4.5 kB** |',
      ].join('\n'),
    );
  });

  it.each([undefined, null, [], {}])(
    'shows only the header and sizes of 0 for the lists %o',
    list => {
      expect(renderScriptsTable({ initialScripts: list, otherScripts: list })).toBe(
        [
          '| File | Size | Gzip |',
          '| --- | ---: | ---: |',
          '| **Initial load** (`index.html`) | | **0.0 kB** |',
          '| **Total** | | **0.0 kB** |',
        ].join('\n'),
      );
    },
  );

  it('leaves out the entries that are not build files', () => {
    const table = renderScriptsTable({
      initialScripts: [null, 'assets/x.js', { bytes: 9_000 }, initialScripts[0]],
      otherScripts: [{ path: '' }, 42, otherScripts[0]],
      initialLoadGzipBytes: 131_860,
      totalGzipBytes: 136_380,
    });
    expect(table.split('\n')).toHaveLength(6);
    expect(table).toContain('| `assets/index-abc.js` | 403.2 kB | 131.9 kB |');
    expect(table).toContain('| `assets/Projects-abc.js` | 14.1 kB | 4.5 kB |');
  });

  it('shows invalid sizes as 0', () => {
    const table = renderScriptsTable({
      initialScripts: [{ path: 'assets/x.js', bytes: NaN, gzipBytes: -1 }],
      otherScripts: [{ path: 'assets/y.js', bytes: Infinity, gzipBytes: '4520' }],
      initialLoadGzipBytes: NaN,
      totalGzipBytes: Infinity,
    });
    expect(table).toContain('| `assets/x.js` | 0.0 kB | 0.0 kB |');
    expect(table).toContain('| `assets/y.js` | 0.0 kB | 0.0 kB |');
    expect(table).toContain('| **Initial load** (`index.html`) | | **0.0 kB** |');
    expect(table).toContain('| **Total** | | **0.0 kB** |');
    expect(table).not.toMatch(/NaN|undefined|Infinity/);
  });
});

describe('renderLargeImagesSection', () => {
  it('lists the images under a heading with the limit', () => {
    const largeImages = [
      { path: 'chess.png', bytes: 928_988 },
      { path: 'study-sarl.png', bytes: 840_000 },
    ];
    expect(renderLargeImagesSection({ largeImages, largeImageBytes: 500_000 })).toBe(
      [
        '### Images over 500.0 kB',
        '',
        '| Image | Size |',
        '| --- | ---: |',
        '| `chess.png` | 929.0 kB |',
        '| `study-sarl.png` | 840.0 kB |',
      ].join('\n'),
    );
  });

  it.each([undefined, null, [], {}, [null, { bytes: 900_000 }, { path: '' }]])(
    'gives an empty string for the images %o',
    largeImages => {
      expect(renderLargeImagesSection({ largeImages, largeImageBytes: 500_000 })).toBe('');
    },
  );

  it('leaves out the entries that are not build files', () => {
    const section = renderLargeImagesSection({
      largeImages: [null, { path: 'chess.png', bytes: 928_988 }, { bytes: 900_000 }],
      largeImageBytes: 500_000,
    });
    expect(section.endsWith('| --- | ---: |\n| `chess.png` | 929.0 kB |')).toBe(true);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '500000'])(
    'throws for the invalid limit %s, even without images',
    largeImageBytes => {
      expect(() => renderLargeImagesSection({ largeImageBytes })).toThrow(RangeError);
    },
  );
});

describe('renderBundleReport', () => {
  const main = { path: 'assets/index-abc.js', bytes: 403_180, gzipBytes: 131_860 };
  const page = { path: 'assets/Projects-abc.js', bytes: 14_140, gzipBytes: 4_520 };
  const scripts = [page, main];
  const initialPaths = [main.path];
  const limits = {
    budgetBytes: 210_000,
    initialLoadBudgetBytes: 150_000,
    largeImageBytes: 500_000,
  };

  it('lists the scripts, the initial load and the total, with their verdicts', () => {
    expect(renderBundleReport({ scripts, initialPaths, ...limits })).toBe(
      [
        '## Bundle size',
        '',
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| `assets/index-abc.js` | 403.2 kB | 131.9 kB |',
        '| **Initial load** (`index.html`) | | **131.9 kB** |',
        '| `assets/Projects-abc.js` | 14.1 kB | 4.5 kB |',
        '| **Total** | | **136.4 kB** |',
        '',
        '✅ Initial load within budget: 131.9 kB gzip for a budget of 150.0 kB.',
        '',
        '✅ Total within budget: 136.4 kB gzip for a budget of 210.0 kB.',
        '',
      ].join('\n'),
    );
  });

  it('says when the initial load is over budget, even with the total within its own', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      initialLoadBudgetBytes: 130_000,
    });
    expect(report).toContain(
      '❌ Initial load over budget: 131.9 kB gzip for a budget of 130.0 kB.',
    );
    expect(report).toContain('✅ Total within budget: 136.4 kB gzip for a budget of 210.0 kB.');
  });

  it('says when the total is over budget, even with the initial load within its own', () => {
    const report = renderBundleReport({ scripts, initialPaths, ...limits, budgetBytes: 135_000 });
    expect(report).toContain(
      '✅ Initial load within budget: 131.9 kB gzip for a budget of 150.0 kB.',
    );
    expect(report).toContain('❌ Total over budget: 136.4 kB gzip for a budget of 135.0 kB.');
  });

  it('accepts an initial load and a total equal to their budgets', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      initialLoadBudgetBytes: 131_860,
      budgetBytes: 136_380,
    });
    expect(report).toContain('✅ Initial load within budget');
    expect(report).toContain('✅ Total within budget');
  });

  it('counts the scripts of the initial load in the total too', () => {
    const report = renderBundleReport({ scripts, initialPaths: [main.path, page.path], ...limits });
    expect(report).toContain('| **Initial load** (`index.html`) | | **136.4 kB** |');
    expect(report).toContain('| **Total** | | **136.4 kB** |');
  });

  it('ignores the initial paths that no script matches', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths: ['register-sw.js', main.path, 'assets/missing.css'],
      ...limits,
    });
    expect(report).toBe(renderBundleReport({ scripts, initialPaths, ...limits }));
  });

  it.each([undefined, null, {}, [], main.path, ['register-sw.js']])(
    'reports the initial load as not found for the initial paths %o',
    paths => {
      const report = renderBundleReport({ scripts, initialPaths: paths, ...limits });
      expect(report).toContain('| **Initial load** (`index.html`) | | **0.0 kB** |');
      expect(report).toContain(
        '❌ Initial load not found: `index.html` references no script or style sheet of the build.',
      );
      expect(report).not.toContain('Initial load within budget');
      expect(report).toContain('✅ Total within budget: 136.4 kB gzip for a budget of 210.0 kB.');
    },
  );

  it('lists the large images', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      largeImages: [{ path: 'chess.png', bytes: 928_988 }],
    });
    expect(report).toContain('### Images over 500.0 kB');
    expect(report).toContain('| `chess.png` | 929.0 kB |');
  });

  it('leaves out the image section when no image is too large', () => {
    const report = renderBundleReport({ scripts, initialPaths, ...limits });
    expect(report).not.toContain('Images over');
  });

  it('leaves out the entries that are not build files, from the sizes too', () => {
    const report = renderBundleReport({
      scripts: [null, main.path, { bytes: 9_000, gzipBytes: 5_000 }, { path: '' }, ...scripts],
      initialPaths: [null, '', 42, ...initialPaths],
      ...limits,
      largeImages: [null, { bytes: 900_000 }, { path: '', bytes: 900_000 }],
    });
    expect(report).toBe(renderBundleReport({ scripts, initialPaths, ...limits }));
  });

  it('lists the valid large images next to malformed ones', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      largeImages: [null, { path: 'chess.png', bytes: 928_988 }, { bytes: 900_000 }],
    });
    expect(report).toContain(
      ['| Image | Size |', '| --- | ---: |', '| `chess.png` | 929.0 kB |', ''].join('\n'),
    );
    expect(report).not.toContain('undefined');
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '210000'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => renderBundleReport({ scripts, initialPaths, ...limits, budgetBytes })).toThrow(
        RangeError,
      );
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '150000'])(
    'throws for the invalid initial load budget %s',
    initialLoadBudgetBytes => {
      expect(() =>
        renderBundleReport({ scripts, initialPaths, ...limits, initialLoadBudgetBytes }),
      ).toThrow(RangeError);
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '500000'])(
    'throws for the invalid image size limit %s',
    largeImageBytes => {
      expect(() =>
        renderBundleReport({ scripts, initialPaths, ...limits, largeImageBytes }),
      ).toThrow(RangeError);
    },
  );

  it.each([undefined, null, {}, 'assets/index.js'])(
    'reports sizes of 0, no initial load and no image for the lists %o',
    list => {
      const report = renderBundleReport({
        scripts: list,
        initialPaths: list,
        largeImages: list,
        ...limits,
      });
      expect(report).toBe(
        [
          '## Bundle size',
          '',
          '| File | Size | Gzip |',
          '| --- | ---: | ---: |',
          '| **Initial load** (`index.html`) | | **0.0 kB** |',
          '| **Total** | | **0.0 kB** |',
          '',
          '❌ Initial load not found: `index.html` references no script or style sheet of the build.',
          '',
          '✅ Total within budget: 0.0 kB gzip for a budget of 210.0 kB.',
          '',
        ].join('\n'),
      );
    },
  );
});
