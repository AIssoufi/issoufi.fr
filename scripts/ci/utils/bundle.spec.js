import {
  checkScriptBudget,
  findLargeImages,
  isBudgetedScript,
  isBuildFile,
  renderBundleReport,
  renderLargeImagesSection,
  renderScriptsTable,
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
  const scripts = [
    { path: 'assets/index-abc.js', bytes: 788_320, gzipBytes: 224_940 },
    { path: 'assets/index-abc.css', bytes: 2_100, gzipBytes: 900 },
  ];

  it('lists each script with its sizes, then the total', () => {
    expect(renderScriptsTable({ scripts, totalGzipBytes: 225_840 })).toBe(
      [
        '| File | Size | Gzip |',
        '| --- | ---: | ---: |',
        '| `assets/index-abc.js` | 788.3 kB | 224.9 kB |',
        '| `assets/index-abc.css` | 2.1 kB | 0.9 kB |',
        '| **Total** | | **225.8 kB** |',
      ].join('\n'),
    );
  });

  it.each([undefined, null, [], {}])(
    'shows only the header and a total of 0 for the scripts %o',
    list => {
      expect(renderScriptsTable({ scripts: list })).toBe(
        ['| File | Size | Gzip |', '| --- | ---: | ---: |', '| **Total** | | **0.0 kB** |'].join(
          '\n',
        ),
      );
    },
  );

  it('leaves out the entries that are not build files', () => {
    const table = renderScriptsTable({
      scripts: [null, 'assets/x.js', { bytes: 9_000 }, { path: '' }, scripts[0]],
      totalGzipBytes: 224_940,
    });
    expect(table.split('\n')).toHaveLength(4);
    expect(table).toContain('| `assets/index-abc.js` | 788.3 kB | 224.9 kB |');
  });

  it('shows invalid sizes and totals as 0', () => {
    const table = renderScriptsTable({
      scripts: [{ path: 'assets/x.js', bytes: NaN, gzipBytes: -1 }],
      totalGzipBytes: Infinity,
    });
    expect(table).toContain('| `assets/x.js` | 0.0 kB | 0.0 kB |');
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

  it.each([0, -1, NaN, Infinity, undefined, null, '250000'])(
    'throws for the invalid budget %s',
    budgetBytes => {
      expect(() => renderBundleReport({ scripts, budgetBytes, largeImageBytes: 500_000 })).toThrow(
        RangeError,
      );
    },
  );

  it.each([0, -1, NaN, Infinity, undefined, null, '500000'])(
    'throws for the invalid image size limit %s',
    largeImageBytes => {
      expect(() => renderBundleReport({ scripts, budgetBytes: 250_000, largeImageBytes })).toThrow(
        RangeError,
      );
    },
  );

  it.each([undefined, null, {}, 'assets/index.js'])(
    'reports a total of 0 and no image for the lists %o',
    list => {
      const report = renderBundleReport({
        scripts: list,
        budgetBytes: 250_000,
        largeImages: list,
        largeImageBytes: 500_000,
      });
      expect(report).toBe(
        [
          '## Bundle size',
          '',
          '| File | Size | Gzip |',
          '| --- | ---: | ---: |',
          '| **Total** | | **0.0 kB** |',
          '',
          '✅ Within budget: 0.0 kB gzip for a budget of 250.0 kB.',
          '',
        ].join('\n'),
      );
    },
  );
});
