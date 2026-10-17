import { renderCoverageSummary } from './coverage.mjs';

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
