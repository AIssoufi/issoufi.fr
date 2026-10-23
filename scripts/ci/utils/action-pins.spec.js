import { describePinProblem, findUsesReferences } from './action-pins.mjs';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const DIGEST = 'f2a5f9e1c3d4b5a6978877665544332211009988aabbccddeeff001122334455';

describe('findUsesReferences', () => {
  it('reads the reference of each step, with the line and the column of its key', () => {
    const source = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - uses: actions/checkout@v7',
      '      - name: Install',
      `        uses: pnpm/action-setup@${SHA}`,
    ].join('\n');

    expect(findUsesReferences(source)).toEqual([
      { line: 4, column: 9, reference: 'actions/checkout@v7' },
      { line: 6, column: 9, reference: `pnpm/action-setup@${SHA}` },
    ]);
  });

  it('reads the reusable workflow that a job calls', () => {
    const source = 'jobs:\n  release:\n    uses: owner/repo/.github/workflows/release.yml@v1\n';

    expect(findUsesReferences(source)).toEqual([
      { line: 3, column: 5, reference: 'owner/repo/.github/workflows/release.yml@v1' },
    ]);
  });

  it.each([
    [`- uses: owner/repo@${SHA} # v1.2.3`, `owner/repo@${SHA}`],
    ['- uses: owner/repo@v1   ', 'owner/repo@v1'],
    ["- uses: 'owner/repo@v1'", 'owner/repo@v1'],
    ['- uses: "owner/repo@v1" # v1', 'owner/repo@v1'],
    ['- uses : owner/repo@v1', 'owner/repo@v1'],
    ['- - uses: owner/repo@v1', 'owner/repo@v1'],
    ['uses: owner/repo@v1#v1', 'owner/repo@v1#v1'],
  ])('reads %j as %j', (line, reference) => {
    expect(findUsesReferences(line)).toEqual([expect.objectContaining({ reference })]);
  });

  it.each([
    ['- uses: >-\n    owner/repo@v1'],
    ['- uses: |\n    owner/repo@v1'],
    ['- uses:\n    owner/repo@v1'],
    ['- uses: # owner/repo@v1'],
  ])('gives an empty reference when the value is not on the line of the key: %j', source => {
    expect(findUsesReferences(source)).toEqual([{ line: 1, column: 3, reference: '' }]);
  });

  it.each([
    ['a comment', '# - uses: owner/repo@v1\n  # uses: owner/repo@v1'],
    ['a flow mapping', '- { uses: owner/repo@v1 }'],
    ['a quoted key', '- "uses": owner/repo@v1'],
    ['a value with no space after the colon', '- uses:owner/repo@v1'],
    ['another key', '- reuses: owner/repo@v1\n- uses-of: owner/repo@v1'],
  ])('does not read %s', (_, source) => {
    expect(findUsesReferences(source)).toEqual([]);
  });

  it.each(['|', '|-', '|+', '>', '>-', '|2', '|-2', '|2-', '| # The script'])(
    'skips the lines of a block scalar started by %j, until a line indented as its key',
    indicator => {
      const source = [
        '    steps:',
        `      - run: ${indicator}`,
        '          cat > action.yml <<EOF',
        '',
        '          uses: owner/repo@v1',
        '          - uses: owner/repo@v2',
        '          EOF',
        '        uses: owner/repo@v3',
      ].join('\n');

      expect(findUsesReferences(source)).toEqual([
        { line: 8, column: 9, reference: 'owner/repo@v3' },
      ]);
    },
  );

  it('reads the keys after a block scalar ends', () => {
    const source = [
      '      - run: |',
      '          echo "uses: owner/repo@v1"',
      '      - uses: owner/repo@v2',
    ].join('\n');

    expect(findUsesReferences(source)).toEqual([
      { line: 3, column: 9, reference: 'owner/repo@v2' },
    ]);
  });

  it('does not take a quoted | for a block scalar', () => {
    const source = ['- with:', "    separator: '|'", '  uses: owner/repo@v1'].join('\n');

    expect(findUsesReferences(source)).toEqual([
      { line: 3, column: 3, reference: 'owner/repo@v1' },
    ]);
  });

  it('numbers the lines of a file with Windows line breaks', () => {
    const source = 'steps:\r\n  - uses: owner/repo@v1\r\n  - uses: owner/repo@v2\r\n';

    expect(findUsesReferences(source)).toEqual([
      { line: 2, column: 5, reference: 'owner/repo@v1' },
      { line: 3, column: 5, reference: 'owner/repo@v2' },
    ]);
  });

  it.each([undefined, null, '', '\n\n', 42, NaN, {}, ['- uses: owner/repo@v1']])(
    'reads no reference in %o',
    source => {
      expect(findUsesReferences(source)).toEqual([]);
    },
  );
});

describe('describePinProblem', () => {
  it.each([
    'actions/checkout@v7',
    'actions/setup-node@v7.1.0',
    'actions/cache/restore@v6',
    'Actions/Checkout@v7',
    './.github/actions/setup',
    './.github/workflows/build.yml',
    `pnpm/action-setup@${SHA}`,
    `owner/repo/path/to/action@${SHA}`,
    `owner/repo/.github/workflows/release.yml@${SHA}`,
    `docker://alpine@sha256:${DIGEST}`,
    `docker://ghcr.io/owner/image:1.0@sha256:${DIGEST}`,
  ])('accepts %s', reference => {
    expect(describePinProblem(reference)).toBeUndefined();
  });

  it.each([
    'cloudflare/wrangler-action@v4',
    'pnpm/action-setup@v6.1.0',
    'owner/repo@main',
    'owner/repo/.github/workflows/release.yml@v1',
    'owner/repo',
    `owner/repo@${SHA.slice(0, 7)}`,
    `owner/repo@${SHA.slice(0, 39)}`,
    `owner/repo@${SHA}0`,
    `owner/repo@${SHA.toUpperCase()}`,
    `owner/repo@${SHA}@v1`,
    'github/codeql-action/init@v4',
    'actions-community/foo@v1',
    'actionsx/foo@v1',
    '../.github/actions/setup',
    '${{ matrix.action }}',
  ])('refuses %s, to be pinned by the SHA of a commit', reference => {
    const problem = describePinProblem(reference);

    expect(problem).toContain(`${reference} is not pinned`);
    expect(problem).toContain('40-character SHA of a commit');
  });

  it.each([
    'docker://alpine:3.20',
    'docker://alpine',
    `docker://alpine@sha256:${DIGEST.slice(1)}`,
    `docker://alpine@sha256:${DIGEST.toUpperCase()}`,
    `docker://alpine@${SHA}`,
  ])('refuses the Docker image %s, to be pinned by its digest', reference => {
    const problem = describePinProblem(reference);

    expect(problem).toContain(`${reference} is not pinned`);
    expect(problem).toContain('SHA-256 digest');
  });

  it('trims the reference before checking it', () => {
    expect(describePinProblem(`  owner/repo@${SHA}  `)).toBeUndefined();
  });

  it.each(['', '   ', undefined, null, 42, {}, ['actions/checkout@v7']])(
    'asks for a reference on the line of the key for %o',
    reference => {
      expect(describePinProblem(reference)).toContain('holds no reference on its line');
    },
  );
});
