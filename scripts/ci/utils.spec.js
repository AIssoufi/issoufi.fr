import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { appendJobSummary, renderCoverageSummary } from './utils.mjs';

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
