import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findKeyLines, listYamlFiles, readIndentation, unquote } from './yaml.mjs';

describe('unquote', () => {
  it('removes the single or double quotes around a scalar', () => {
    expect(unquote("'@playwright/test'")).toBe('@playwright/test');
    expect(unquote('"owner/repo@v1"')).toBe('owner/repo@v1');
    expect(unquote("''")).toBe('');
  });

  it('keeps a scalar without quotes, or whose quotes do not match or do not surround it', () => {
    expect(unquote('owner/repo@v1')).toBe('owner/repo@v1');
    expect(unquote('\'1.64.0"')).toBe('\'1.64.0"');
    expect(unquote("it's")).toBe("it's");
    expect(unquote("'")).toBe("'");
    expect(unquote('')).toBe('');
  });
});

describe('readIndentation', () => {
  it('counts the spaces before the first character of a line', () => {
    expect(readIndentation('importers:')).toBe(0);
    expect(readIndentation('    version: 1.64.0')).toBe(4);
    expect(readIndentation("      '@playwright/test':")).toBe(6);
  });

  it('reads -1 for an empty line or one of spaces only', () => {
    expect(readIndentation('')).toBe(-1);
    expect(readIndentation('    ')).toBe(-1);
    expect(readIndentation('\r')).toBe(-1);
  });
});

describe('listYamlFiles', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'yaml-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('lists the YAML files of the folder and of its subfolders, in alphabetical order', () => {
    mkdirSync(join(directory, 'workflows'));
    mkdirSync(join(directory, 'actions', 'setup'), { recursive: true });
    writeFileSync(join(directory, 'workflows', 'release.yml'), '');
    writeFileSync(join(directory, 'workflows', 'ci.yaml'), '');
    writeFileSync(join(directory, 'actions', 'setup', 'action.yml'), '');
    writeFileSync(join(directory, 'dependabot.yml'), '');

    expect(listYamlFiles(directory)).toEqual([
      join(directory, 'actions', 'setup', 'action.yml'),
      join(directory, 'dependabot.yml'),
      join(directory, 'workflows', 'ci.yaml'),
      join(directory, 'workflows', 'release.yml'),
    ]);
  });

  it('leaves out the other files and a folder named like a YAML file', () => {
    mkdirSync(join(directory, 'old.yml'));
    writeFileSync(join(directory, 'actionlint-matcher.json'), '{}');
    writeFileSync(join(directory, 'ci.yml.bak'), '');
    writeFileSync(join(directory, 'yml'), '');

    expect(listYamlFiles(directory)).toEqual([]);
  });

  it('reads the .github folder of the current folder by default', () => {
    const files = listYamlFiles();

    expect(files).toContain(join('.github', 'workflows', 'ci.yml'));
    expect(files).toContain(join('.github', 'actions', 'setup', 'action.yml'));
  });

  it('throws when the folder does not exist', () => {
    expect(() => listYamlFiles(join(directory, 'missing'))).toThrow(/ENOENT/);
  });
});

describe('findKeyLines', () => {
  it('reads each key with its line, its column, its value and whether it opens an item', () => {
    const source = [
      'jobs:',
      '  build:',
      '    steps:',
      '      - uses: actions/checkout@v7',
      '        with:',
      '          fetch-depth: 0',
      '      - name: Install',
    ].join('\n');

    expect(findKeyLines(source)).toEqual([
      { line: 1, column: 1, key: 'jobs', value: '', startsItem: false, comment: '' },
      { line: 2, column: 3, key: 'build', value: '', startsItem: false, comment: '' },
      { line: 3, column: 5, key: 'steps', value: '', startsItem: false, comment: '' },
      {
        line: 4,
        column: 9,
        key: 'uses',
        value: 'actions/checkout@v7',
        startsItem: true,
        comment: '',
      },
      { line: 5, column: 9, key: 'with', value: '', startsItem: false, comment: '' },
      { line: 6, column: 11, key: 'fetch-depth', value: '0', startsItem: false, comment: '' },
      { line: 7, column: 9, key: 'name', value: 'Install', startsItem: true, comment: '' },
    ]);
  });

  it.each([
    ['- - uses: owner/repo@v1', true],
    ['-   uses: owner/repo@v1', true],
    ['  uses: owner/repo@v1', false],
    ['uses: owner/repo@v1', false],
  ])('tells whether %j opens an item of a sequence', (line, startsItem) => {
    expect(findKeyLines(line)).toEqual([expect.objectContaining({ key: 'uses', startsItem })]);
  });

  it('takes the first key below a line that holds only the - of an item for its start', () => {
    const source = [
      'steps:',
      '  -',
      '    uses: owner/repo@v1',
      '    with:',
      '  - # The checkout',
      '',
      '    # of the code',
      '    uses: actions/checkout@v7',
      '  - -   ',
      '      run: pnpm test',
    ].join('\n');

    expect(findKeyLines(source)).toEqual([
      expect.objectContaining({ key: 'steps', startsItem: false }),
      expect.objectContaining({ line: 3, column: 5, key: 'uses', startsItem: true }),
      expect.objectContaining({ line: 4, column: 5, key: 'with', startsItem: false }),
      expect.objectContaining({ line: 8, column: 5, key: 'uses', startsItem: true }),
      expect.objectContaining({ line: 10, column: 7, key: 'run', startsItem: true }),
    ]);
  });

  it.each([
    ['a document marker', ['---', 'uses: owner/repo@v1']],
    ['a scalar that starts with -', ['-#1', 'uses: owner/repo@v1']],
    ['a scalar item', ['- pnpm', 'uses: owner/repo@v1']],
    ['a scalar below the -', ['-', '  pnpm', 'uses: owner/repo@v1']],
  ])('does not take the key below %s for the start of an item', (_, lines) => {
    expect(findKeyLines(lines.join('\n'))).toEqual([
      expect.objectContaining({ key: 'uses', startsItem: false }),
    ]);
  });

  it.each([
    ["persist-credentials: 'false'", 'false'],
    ['persist-credentials: "true" # The push needs it', 'true'],
    ['persist-credentials: false#true', 'false#true'],
    ['run: |', ''],
    ['run: >- # The script', ''],
    ['with:', ''],
    ['with: # The inputs', ''],
  ])('reads the value of %j as %j', (line, value) => {
    expect(findKeyLines(line)).toEqual([expect.objectContaining({ value })]);
  });

  it('reads the comment at the end of the line of a key', () => {
    const source = 'uses: owner/repo@v1   #   v1.2.3  ';

    expect(findKeyLines(source)).toEqual([
      expect.objectContaining({ value: 'owner/repo@v1', comment: 'v1.2.3' }),
    ]);
  });

  it('joins the comment lines right above a key, then the comment at the end of its line', () => {
    const source = [
      '        with:',
      '          # The push to main',
      '      #needs the key',
      '          persist-credentials: true # of the job',
    ].join('\n');

    expect(findKeyLines(source)[1]).toEqual(
      expect.objectContaining({
        key: 'persist-credentials',
        comment: 'The push to main needs the key of the job',
      }),
    );
  });

  it.each([
    ['a blank line', ['# The push needs it', '', 'persist-credentials: true']],
    ['another key', ['# The push needs it', 'fetch-depth: 0', 'persist-credentials: true']],
    ['a line that is no key', ['# The push needs it', '- true', 'persist-credentials: true']],
  ])('does not give a key the comment lines above %s', (_, lines) => {
    expect(findKeyLines(lines.join('\n')).at(-1)).toEqual(
      expect.objectContaining({ key: 'persist-credentials', comment: '' }),
    );
  });

  it('leaves out an empty comment', () => {
    const source = ['#', '# The push needs it', '  #  ', 'persist-credentials: true #'].join('\n');

    expect(findKeyLines(source)).toEqual([
      expect.objectContaining({ comment: 'The push needs it' }),
    ]);
  });

  it('skips the lines of a block scalar, comments included, up to one indented as its key', () => {
    const source = [
      '      - run: |',
      '          # with:',
      '          echo "persist-credentials: true"',
      '',
      '        with:',
    ].join('\n');

    expect(findKeyLines(source)).toEqual([
      { line: 1, column: 9, key: 'run', value: '', startsItem: true, comment: '' },
      { line: 5, column: 9, key: 'with', value: '', startsItem: false, comment: '' },
    ]);
  });

  it('numbers the lines of a file with Windows line breaks', () => {
    const source = 'steps:\r\n  # Gets the code\r\n  - uses: owner/repo@v1\r\n';

    expect(findKeyLines(source)).toEqual([
      { line: 1, column: 1, key: 'steps', value: '', startsItem: false, comment: '' },
      {
        line: 3,
        column: 5,
        key: 'uses',
        value: 'owner/repo@v1',
        startsItem: true,
        comment: 'Gets the code',
      },
    ]);
  });

  it.each([undefined, null, '', '\n\n', '# with:', 42, NaN, {}, ['uses: owner/repo@v1']])(
    'reads no key in %o',
    source => {
      expect(findKeyLines(source)).toEqual([]);
    },
  );
});
