import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  appendJobSummary,
  checkScriptBudget,
  comparePage,
  findLargeImages,
  formatKilobytes,
  getPageChecks,
  readPageHead,
  renderBundleReport,
  renderCoverageSummary,
} from './utils.mjs';

describe('formatKilobytes', () => {
  it.each([
    [224_940, '224.9 kB'],
    [1000, '1.0 kB'],
    [999, '1.0 kB'],
    [1, '0.0 kB'],
    [0, '0.0 kB'],
  ])('formats %s bytes as %s', (bytes, expected) => {
    expect(formatKilobytes(bytes)).toBe(expected);
  });

  it.each([-5, NaN, Infinity, undefined, null, '1000'])('shows the invalid size %s as 0', bytes => {
    expect(formatKilobytes(bytes)).toBe('0.0 kB');
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

  it('reports a total of 0 without scripts', () => {
    const report = renderBundleReport({ budgetBytes: 250_000, largeImageBytes: 500_000 });
    expect(report).toContain('| **Total** | | **0.0 kB** |');
    expect(report).toContain('✅ Within budget');
  });
});

describe('renderCoverageSummary', () => {
  it('renders the total of each metric', () => {
    const summary = {
      total: {
        lines: { total: 2532, covered: 2473, pct: 97.66 },
        statements: { total: 2532, covered: 2473, pct: 97.66 },
        branches: { total: 298, covered: 289, pct: 96.97 },
        functions: { total: 83, covered: 75, pct: 90.36 },
      },
    };
    expect(renderCoverageSummary(summary)).toBe(
      [
        '## Coverage',
        '',
        '| Metric | Covered | % |',
        '| --- | ---: | ---: |',
        '| lines | 2473 / 2532 | 97.7% |',
        '| statements | 2473 / 2532 | 97.7% |',
        '| branches | 289 / 298 | 97.0% |',
        '| functions | 75 / 83 | 90.4% |',
        '',
      ].join('\n'),
    );
  });

  it.each([undefined, null, {}, 'report', { total: null }])(
    'says there is no report for %s',
    summary => {
      expect(renderCoverageSummary(summary)).toBe('## Coverage\n\nNo coverage report found.\n');
    },
  );

  it('shows n/a and 0 for a missing or malformed metric', () => {
    const summary = { total: { lines: { total: 0, covered: 0, pct: 'Unknown' } } };
    const report = renderCoverageSummary(summary);
    expect(report).toContain('| lines | 0 / 0 | n/a |');
    expect(report).toContain('| functions | 0 / 0 | n/a |');
  });
});

describe('appendJobSummary', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'job-summary-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it('appends to the given summary file', () => {
    const summaryFile = join(directory, 'summary.md');
    appendJobSummary({ markdown: 'first\n', summaryFile });
    appendJobSummary({ markdown: 'second\n', summaryFile });
    expect(readFileSync(summaryFile, 'utf8')).toBe('first\nsecond\n');
  });

  it('defaults to the file named by GITHUB_STEP_SUMMARY', () => {
    const summaryFile = join(directory, 'summary.md');
    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryFile);
    appendJobSummary({ markdown: 'report\n' });
    expect(readFileSync(summaryFile, 'utf8')).toBe('report\n');
  });

  it('prints the summary outside GitHub Actions', () => {
    vi.stubEnv('GITHUB_STEP_SUMMARY', '');
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    appendJobSummary({ markdown: 'report\n' });
    expect(write).toHaveBeenCalledWith('report\n');
  });

  it('adds nothing when the markdown is missing', () => {
    const summaryFile = join(directory, 'summary.md');
    appendJobSummary({ summaryFile });
    expect(readFileSync(summaryFile, 'utf8')).toBe('');
  });
});

describe('getPageChecks', () => {
  it('maps each HTML file of the build to its route and status', () => {
    expect(getPageChecks(['index.html', 'projects.html', '404.html'])).toEqual([
      { file: 'index.html', route: '/', status: 200 },
      { file: 'projects.html', route: '/projects', status: 200 },
      { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
    ]);
  });

  it('ignores the files that are not HTML pages', () => {
    expect(getPageChecks(['assets', 'chess.png', 'robots.txt', 'index.html.map'])).toEqual([]);
  });

  it.each([undefined, []])('gives no check for %s', fileNames => {
    expect(getPageChecks(fileNames)).toEqual([]);
  });

  it('ignores entries that are not file names', () => {
    expect(getPageChecks([null, 42, { name: 'index.html' }, 'index.html'])).toEqual([
      { file: 'index.html', route: '/', status: 200 },
    ]);
  });
});

describe('readPageHead', () => {
  it('reads the title and the canonical URL across line breaks', () => {
    const html = `<head>
      <title> Projets - ADAM Issoufi </title>
      <link
        rel="canonical"
        href="https://issoufi.fr/projects"
      />
    </head>`;
    expect(readPageHead(html)).toEqual({
      title: 'Projets - ADAM Issoufi',
      canonical: 'https://issoufi.fr/projects',
    });
  });

  it('reads a canonical link whose href comes first', () => {
    const html = '<link href="https://issoufi.fr/" rel="canonical">';
    expect(readPageHead(html).canonical).toBe('https://issoufi.fr/');
  });

  it('ignores the other links', () => {
    const html = '<link rel="icon" href="/favicon.ico" /><title>Home</title>';
    expect(readPageHead(html)).toEqual({ title: 'Home', canonical: '' });
  });

  it.each([undefined, null, 42, '', '<html></html>'])('gives empty values for %s', html => {
    expect(readPageHead(html)).toEqual({ title: '', canonical: '' });
  });
});

describe('comparePage', () => {
  const page = { file: 'projects.html', route: '/projects', status: 200 };
  const builtHtml =
    '<title>Projets - ADAM Issoufi</title><link rel="canonical" href="https://issoufi.fr/projects" />';

  it('finds no problem when the page is served as built', () => {
    expect(comparePage({ page, status: 200, servedHtml: builtHtml, builtHtml })).toEqual([]);
  });

  it('reports an unexpected status', () => {
    expect(comparePage({ page, status: 404, servedHtml: builtHtml, builtHtml })).toEqual([
      '/projects: status 404 instead of 200',
    ]);
  });

  it('reports another title and another canonical URL', () => {
    const servedHtml =
      '<title>Page introuvable - ADAM Issoufi</title><link rel="canonical" href="https://issoufi.fr/" />';
    expect(comparePage({ page, status: 200, servedHtml, builtHtml })).toEqual([
      '/projects: title "Page introuvable - ADAM Issoufi" instead of "Projets - ADAM Issoufi"',
      '/projects: canonical "https://issoufi.fr/" instead of "https://issoufi.fr/projects"',
    ]);
  });

  it('reports a built page without a title, even when the served page has none either', () => {
    expect(comparePage({ page, status: 200, servedHtml: '', builtHtml: '' })).toEqual([
      '/projects: projects.html has no title in the build',
    ]);
  });

  it('reports a missing served page as an empty one', () => {
    expect(comparePage({ page, status: 200, builtHtml })).toEqual([
      '/projects: title "" instead of "Projets - ADAM Issoufi"',
      '/projects: canonical "" instead of "https://issoufi.fr/projects"',
    ]);
  });
});
