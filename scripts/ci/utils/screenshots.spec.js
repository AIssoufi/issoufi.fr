import { getScreenOutcome, listScreenResults, renderScreenshotSummary } from './screenshots.mjs';

/** Attachments that `toHaveScreenshot` adds to a test whose screen differs from the base. */
const DIFF_ATTACHMENTS = [
  { name: 'laptop-1280-px-1-expected.png' },
  { name: 'laptop-1280-px-1-actual.png' },
  { name: 'laptop-1280-px-1-diff.png' },
  { name: 'error-context' },
];

/** A test of the JSON report of Playwright whose last run failed with the given attachments. */
const failedTest = (attachments, error = { message: 'Error: failed' }) => ({
  status: 'unexpected',
  results: [{ status: 'failed', errors: [error], attachments }],
});

/** Sentence of the summary that tells where to see the screenshots. */
const REPORT_SENTENCE =
  'The HTML report, in `visual-report/` (the `visual-report` artifact of the run on GitHub Actions), shows each changed screen before (Expected) and after the change (Actual), with their Diff and a Slider: open it with `pnpm exec playwright show-report visual-report`.';

describe('getScreenOutcome', () => {
  it('tells that a test that passed drew the screen as the base did', () => {
    expect(getScreenOutcome({ status: 'expected', results: [{ status: 'passed' }] })).toBe(
      'unchanged',
    );
  });

  it('tells that a test that failed with both screenshots and their diff changed the screen', () => {
    expect(getScreenOutcome(failedTest(DIFF_ATTACHMENTS))).toBe('changed');
  });

  it('tells that a page that never stood still failed, though it has a diff', () => {
    const attachments = [...DIFF_ATTACHMENTS, { name: 'laptop-1280-px-1-previous.png' }];

    expect(getScreenOutcome(failedTest(attachments))).toBe('failed');
  });

  it('tells that a screen missing from the base failed', () => {
    expect(getScreenOutcome(failedTest([{ name: 'laptop-1280-px-1-actual.png' }]))).toBe('failed');
  });

  it('tells that a test that failed before its screenshot failed', () => {
    expect(getScreenOutcome(failedTest([{ name: 'error-context' }]))).toBe('failed');
  });

  it('reads the last run of the test only', () => {
    const test = {
      status: 'unexpected',
      results: [{ attachments: DIFF_ATTACHMENTS }, { attachments: [] }],
    };

    expect(getScreenOutcome(test)).toBe('failed');
  });

  it.each(['flaky', 'skipped', 'unexpected', undefined])(
    'tells that a test of status %s without a diff failed',
    status => {
      expect(getScreenOutcome({ status, results: [{ attachments: [] }] })).toBe('failed');
    },
  );

  it.each([
    undefined,
    null,
    'test',
    {},
    { results: null },
    { results: [null] },
    { results: [{ attachments: 'diff.png' }] },
    { results: [{ attachments: [null, { name: 42 }, {}] }] },
  ])('tells that the malformed test %j failed', test => {
    expect(getScreenOutcome(test)).toBe('failed');
  });
});

describe('listScreenResults', () => {
  it('titles each screen by its groups then its test, the test file left out', () => {
    const report = {
      suites: [
        {
          title: 'pages.visual.ts',
          suites: [
            {
              title: 'laptop, 1280 px',
              specs: [
                { title: '/', tests: [{ status: 'expected' }] },
                { title: '/en/projects', tests: [failedTest(DIFF_ATTACHMENTS)] },
              ],
            },
            { title: 'phone, 375 px', specs: [{ title: '/', tests: [{ status: 'expected' }] }] },
          ],
        },
      ],
    };

    expect(listScreenResults(report)).toEqual([
      { title: 'laptop, 1280 px › /', outcome: 'unchanged' },
      { title: 'laptop, 1280 px › /en/projects', outcome: 'changed' },
      { title: 'phone, 375 px › /', outcome: 'unchanged' },
    ]);
  });

  it('lists the tests of a group before those of the groups it holds', () => {
    const report = {
      suites: [
        {
          title: 'pages.visual.ts',
          specs: [{ title: '/', tests: [{ status: 'expected' }] }],
          suites: [{ title: 'tablet', specs: [{ title: '/', tests: [{ status: 'expected' }] }] }],
        },
      ],
    };

    expect(listScreenResults(report).map(({ title }) => title)).toEqual(['/', 'tablet › /']);
  });

  it('gives a failed screen the first line of its error, without the colors of the terminal', () => {
    const error = {
      message:
        '\u001b[31mError: page.goto: Timeout 30000ms exceeded.\u001b[39m\nCall log:\n  - navigating',
    };
    const report = {
      suites: [{ specs: [{ title: '/', tests: [failedTest([], error)] }] }],
    };

    expect(listScreenResults(report)).toEqual([
      { title: '/', outcome: 'failed', error: 'Error: page.goto: Timeout 30000ms exceeded.' },
    ]);
  });

  it('reads the error of the run when it lists none', () => {
    const test = { status: 'unexpected', results: [{ error: { message: 'Error: crashed' } }] };
    const report = { suites: [{ specs: [{ title: '/', tests: [test] }] }] };

    expect(listScreenResults(report)[0].error).toBe('Error: crashed');
  });

  it.each([
    { status: 'unexpected' },
    { status: 'unexpected', results: [{ errors: [{ message: 42 }] }] },
    { status: 'unexpected', results: [{ errors: [null], error: null }] },
  ])('gives an empty error to a failed screen whose run holds no message: %j', test => {
    const report = { suites: [{ specs: [{ title: '/', tests: [test] }] }] };

    expect(listScreenResults(report)).toEqual([{ title: '/', outcome: 'failed', error: '' }]);
  });

  it('gives an empty title to a test or a group without one', () => {
    const report = {
      suites: [{ suites: [{ specs: [{ tests: [{ status: 'expected' }] }] }] }],
    };

    expect(listScreenResults(report)).toEqual([{ title: ' › ', outcome: 'unchanged' }]);
  });

  it.each([
    undefined,
    null,
    'report',
    {},
    { suites: null },
    { suites: [null, { specs: 'spec' }, { suites: 'suite' }] },
    { suites: [{ specs: [null, { tests: null }] }] },
  ])('lists no screen for the malformed report %j', report => {
    expect(listScreenResults(report)).toEqual([]);
  });
});

describe('renderScreenshotSummary', () => {
  it('lists the changed and the failed screens, and where to see them', () => {
    const screens = [
      { title: 'phone, 375 px › /', outcome: 'unchanged' },
      { title: 'laptop, 1280 px › /experiences', outcome: 'changed' },
      { title: 'desktop, 1920 px › /', outcome: 'failed', error: 'Error: page.goto: Timeout' },
    ];

    expect(renderScreenshotSummary({ screens, base: '81c31c1' })).toBe(
      [
        '## Screenshots',
        '',
        '❌ 1 of the 3 screens changed and 1 failed, compared with the base of the change, `81c31c1`.',
        '',
        '| Screen | Result |',
        '| --- | --- |',
        '| laptop, 1280 px › /experiences | changed |',
        '| desktop, 1920 px › / | failed: Error: page.goto: Timeout |',
        '',
        REPORT_SENTENCE,
        '',
      ].join('\n'),
    );
  });

  it('marks the summary of changed screens alone with a picture, not as a failure', () => {
    const screens = [{ title: 'laptop, 1280 px › /', outcome: 'changed' }];

    expect(renderScreenshotSummary({ screens, base: '81c31c1' })).toContain(
      '🖼️ 1 of the 1 screens changed and 0 failed, compared with the base of the change, `81c31c1`.',
    );
  });

  it('writes a failed screen without an error as failed alone', () => {
    const screens = [{ title: 'laptop, 1280 px › /', outcome: 'failed', error: '' }];

    expect(renderScreenshotSummary({ screens })).toContain('| laptop, 1280 px › / | failed |');
  });

  it('escapes the pipes of a cell, which would end it', () => {
    const screens = [{ title: 'a | b', outcome: 'failed', error: 'Error: x | y' }];

    expect(renderScreenshotSummary({ screens })).toContain('| a \\| b | failed: Error: x \\| y |');
  });

  it('says that no screen changed when every screen is unchanged', () => {
    const screens = [
      { title: 'phone, 375 px › /', outcome: 'unchanged' },
      { title: 'laptop, 1280 px › /', outcome: 'unchanged' },
    ];

    expect(renderScreenshotSummary({ screens, base: '81c31c1' })).toBe(
      '## Screenshots\n\n✅ None of the 2 screens changed, compared with the base of the change, `81c31c1`.\n',
    );
  });

  it('leaves the base empty when none is given', () => {
    const screens = [{ title: '/', outcome: 'unchanged' }];

    expect(renderScreenshotSummary({ screens })).toContain('base of the change, ``.');
  });

  it.each([undefined, null, [], 'screens'])(
    'reports a failure when no screen was compared: %j',
    screens => {
      expect(renderScreenshotSummary({ screens })).toBe(
        '## Screenshots\n\n❌ No screen was compared: see the log of the job.\n',
      );
    },
  );
});
