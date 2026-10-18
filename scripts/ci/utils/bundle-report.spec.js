import {
  renderBundleReport,
  renderLargeFilesSection,
  renderScriptsTable,
} from './bundle-report.mjs';

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

describe('renderLargeFilesSection', () => {
  it('lists the files under a heading with the limit', () => {
    const largeFiles = [
      { path: 'CV - Adam Issoufi.pdf', bytes: 3_851_658 },
      { path: 'chess.png', bytes: 928_988 },
    ];
    expect(renderLargeFilesSection({ largeFiles, largeFileBytes: 500_000 })).toBe(
      [
        '### Files over 500.0 kB',
        '',
        '| File | Size |',
        '| --- | ---: |',
        '| `CV - Adam Issoufi.pdf` | 3851.7 kB |',
        '| `chess.png` | 929.0 kB |',
      ].join('\n'),
    );
  });

  it.each([undefined, null, [], {}, [null, { bytes: 900_000 }, { path: '' }]])(
    'gives an empty string for the files %o',
    largeFiles => {
      expect(renderLargeFilesSection({ largeFiles, largeFileBytes: 500_000 })).toBe('');
    },
  );

  it('leaves out the entries that are not build files', () => {
    const section = renderLargeFilesSection({
      largeFiles: [null, { path: 'chess.png', bytes: 928_988 }, { bytes: 900_000 }],
      largeFileBytes: 500_000,
    });
    expect(section.endsWith('| --- | ---: |\n| `chess.png` | 929.0 kB |')).toBe(true);
  });

  it.each([0, -1, NaN, Infinity, undefined, null, '500000'])(
    'throws for the invalid limit %s, even without files',
    largeFileBytes => {
      expect(() => renderLargeFilesSection({ largeFileBytes })).toThrow(RangeError);
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
    largeFileBytes: 500_000,
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

  it('lists the large files', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      largeFiles: [{ path: 'chess.png', bytes: 928_988 }],
    });
    expect(report).toContain('### Files over 500.0 kB');
    expect(report).toContain('| `chess.png` | 929.0 kB |');
  });

  it('leaves out the file section when no file is too large', () => {
    const report = renderBundleReport({ scripts, initialPaths, ...limits });
    expect(report).not.toContain('Files over');
  });

  it('leaves out the entries that are not build files, from the sizes too', () => {
    const report = renderBundleReport({
      scripts: [null, main.path, { bytes: 9_000, gzipBytes: 5_000 }, { path: '' }, ...scripts],
      initialPaths: [null, '', 42, ...initialPaths],
      ...limits,
      largeFiles: [null, { bytes: 900_000 }, { path: '', bytes: 900_000 }],
    });
    expect(report).toBe(renderBundleReport({ scripts, initialPaths, ...limits }));
  });

  it('lists the valid large files next to malformed ones', () => {
    const report = renderBundleReport({
      scripts,
      initialPaths,
      ...limits,
      largeFiles: [null, { path: 'chess.png', bytes: 928_988 }, { bytes: 900_000 }],
    });
    expect(report).toContain(
      ['| File | Size |', '| --- | ---: |', '| `chess.png` | 929.0 kB |', ''].join('\n'),
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
    'throws for the invalid file size limit %s',
    largeFileBytes => {
      expect(() =>
        renderBundleReport({ scripts, initialPaths, ...limits, largeFileBytes }),
      ).toThrow(RangeError);
    },
  );

  it.each([undefined, null, {}, 'assets/index.js'])(
    'reports sizes of 0, no initial load and no file for the lists %o',
    list => {
      const report = renderBundleReport({
        scripts: list,
        initialPaths: list,
        largeFiles: list,
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
