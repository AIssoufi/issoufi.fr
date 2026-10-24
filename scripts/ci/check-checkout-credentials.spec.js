import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { runNodeScript } from '../testUtils.js';

// Runs check-checkout-credentials.mjs on the workflows of the repository, then on files written
// for a test

const SCRIPT = join(process.cwd(), 'scripts', 'ci', 'check-checkout-credentials.mjs');

/** Start of the error annotation that the script writes on a line of a workflow. */
const annotationStart = ({ file, line, column }) =>
  `::error file=.github/workflows/${file},line=${line},col=${column},title=Checkout credentials::`;

describe('check-checkout-credentials.mjs', () => {
  let directory;

  /** Writes a file of the .github folder of the test project. */
  const writeGitHubFile = ({ file, lines }) => {
    const filePath = join(directory, '.github', file);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${lines.join('\n')}\n`);
  };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'check-checkout-credentials-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('passes on the workflows and the actions of the repository', async () => {
    const { exitCode, log } = await runNodeScript({ script: SCRIPT });

    expect(exitCode).toBe(0);
    expect(log).toMatch(/^The \d+ checkouts of the \d+ YAML files of \.github\/ drop their git /);
    expect(log).toMatch(/ credentials, or say which step uses them\.\n$/);
  });

  it('annotates each checkout that keeps its credentials without saying why', async () => {
    writeGitHubFile({
      file: 'workflows/ci.yml',
      lines: [
        'jobs:',
        '  test:',
        '    steps:',
        '      - uses: actions/checkout@v7',
        '      - uses: actions/checkout@v7',
        '        with:',
        '          persist-credentials: false',
      ],
    });
    writeGitHubFile({
      file: 'workflows/deploy.yml',
      lines: [
        'jobs:',
        '  deploy:',
        '    steps:',
        '      - uses: actions/checkout@v7',
        '        with:',
        '          persist-credentials: true',
        '      - uses: actions/checkout@v7',
        '        with:',
        '          persist-credentials: ${{ inputs.push }}',
      ],
    });

    const { exitCode, log } = await runNodeScript({ script: SCRIPT, cwd: directory });

    expect(exitCode).toBe(1);
    expect(log.trim().split('\n')).toEqual([
      expect.stringContaining(
        `${annotationStart({ file: 'ci.yml', line: 4, column: 9 })}This checkout keeps the token `,
      ),
      expect.stringContaining(
        `${annotationStart({ file: 'deploy.yml', line: 6, column: 11 })}persist-credentials: true `,
      ),
      expect.stringContaining(
        `${annotationStart({ file: 'deploy.yml', line: 9, column: 11 })}persist-credentials: ` +
          '${{ inputs.push }} is neither false nor true, ',
      ),
    ]);
  });

  it('passes when each checkout drops its credentials or says which step uses them', async () => {
    writeGitHubFile({
      file: 'workflows/release.yml',
      lines: [
        'jobs:',
        '  release:',
        '    steps:',
        '      - uses: actions/checkout@v7',
        '        with:',
        '          persist-credentials: false',
        '      - uses: actions/checkout@v7',
        '        with:',
        '          # The push to main connects with the deploy key',
        '          persist-credentials: true',
      ],
    });
    writeGitHubFile({ file: 'dependabot.yml', lines: ['version: 2'] });

    const { exitCode, log } = await runNodeScript({ script: SCRIPT, cwd: directory });

    expect(exitCode).toBe(0);
    expect(log).toBe(
      'The 2 checkouts of the 2 YAML files of .github/ drop their git credentials,' +
        ' or say which step uses them.\n',
    );
  });

  it('fails when the project has no .github folder', async () => {
    const { exitCode, errorLog } = await runNodeScript({ script: SCRIPT, cwd: directory });

    expect(exitCode).toBe(1);
    expect(errorLog).toContain('ENOENT');
  });
});
