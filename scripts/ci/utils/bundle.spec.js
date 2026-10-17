import {
  checkScriptBudget,
  findLargeImages,
  isBudgetedScript,
  isBuildFile,
  renderBundleReport,
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

  it('gives 0 without scripts', () => {
    expect(checkScriptBudget({ budgetBytes: 200 })).toEqual({
      totalGzipBytes: 0,
      isOverBudget: false,
    });
  });

  it('counts invalid gzip sizes as 0', () => {
    const scripts = [{ gzipBytes: NaN }, { gzipBytes: -10 }, {}, null, { gzipBytes: 30 }];
    expect(checkScriptBudget({ scripts, budgetBytes: 200 }).totalGzipBytes).toBe(30);
  });

  it.each([0, -1, NaN, undefined, '200'])('throws for the invalid budget %s', budgetBytes => {
    expect(() => checkScriptBudget({ scripts: [], budgetBytes })).toThrow(RangeError);
  });
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

  it('gives an empty list without files', () => {
    expect(findLargeImages({ limitBytes: 500 })).toEqual([]);
  });

  it('ignores entries without a path or with an invalid size', () => {
    const files = [null, { bytes: 900 }, { path: 'a.png', bytes: NaN }, { path: 'b.png' }];
    expect(findLargeImages({ files, limitBytes: 500 })).toEqual([]);
  });
});

describe('renderBundleReport', () => {
  const scripts = [{ path: 'assets/index-abc.js', bytes: 788_320, gzipBytes: 224_940 }];

  it('lists the scripts, the total and the verdict', () => {
    expect(renderBundleReport({ scripts, budgetBytes: 250_000, largeImageBytes: 500_000 })).toBe(
      [
        '## Bundle size',
        '',
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| `assets/index-abc.js` | 788.3 kB | 224.9 kB |',
        '| **Total** | | **224.9 kB** |',
        '',
        '✅ Within budget: 224.9 kB gzip for a budget of 250.0 kB.',
        '',
      ].join('\n'),
    );
  });

  it('says when the scripts are over budget', () => {
    const report = renderBundleReport({ scripts, budgetBytes: 200_000, largeImageBytes: 500_000 });
    expect(report).toContain('❌ Over budget: 224.9 kB gzip for a budget of 200.0 kB.');
  });

  it('lists the large images', () => {
    const report = renderBundleReport({
      scripts,
      budgetBytes: 250_000,
      largeImages: [{ path: 'chess.png', bytes: 928_988 }],
      largeImageBytes: 500_000,
    });
    expect(report).toContain('### Images over 500.0 kB');
    expect(report).toContain('| `chess.png` | 929.0 kB |');
  });

  it('leaves out the image section when no image is too large', () => {
    const report = renderBundleReport({ scripts, budgetBytes: 250_000, largeImageBytes: 500_000 });
    expect(report).not.toContain('Images over');
  });

  it('leaves out the entries that are not build files, from the total too', () => {
    const report = renderBundleReport({
      scripts: [null, 'assets/x.js', { bytes: 9_000, gzipBytes: 5_000 }, ...scripts],
      budgetBytes: 250_000,
      largeImages: [null, { bytes: 900_000 }, { path: '', bytes: 900_000 }],
      largeImageBytes: 500_000,
    });
    expect(report).toBe(
      [
        '## Bundle size',
        '',
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| `assets/index-abc.js` | 788.3 kB | 224.9 kB |',
        '| **Total** | | **224.9 kB** |',
        '',
        '✅ Within budget: 224.9 kB gzip for a budget of 250.0 kB.',
        '',
      ].join('\n'),
    );
  });

  it('lists the valid large images next to malformed ones', () => {
    const report = renderBundleReport({
      scripts,
      budgetBytes: 250_000,
      largeImages: [null, { path: 'chess.png', bytes: 928_988 }, { bytes: 900_000 }],
      largeImageBytes: 500_000,
    });
    expect(report).toContain(
      ['| Image | Size |', '| --- | ---: |', '| `chess.png` | 929.0 kB |', ''].join('\n'),
    );
    expect(report).not.toContain('undefined');
  });

  it.each([0, -1, NaN, undefined])('throws for the invalid budget %s', budgetBytes => {
    expect(() => renderBundleReport({ scripts, budgetBytes, largeImageBytes: 500_000 })).toThrow(
      RangeError,
    );
  });

  it('reports a total of 0 without scripts', () => {
    const report = renderBundleReport({ budgetBytes: 250_000, largeImageBytes: 500_000 });
    expect(report).toContain('| **Total** | | **0.0 kB** |');
    expect(report).toContain('✅ Within budget');
  });
});
