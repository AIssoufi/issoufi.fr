import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { UNCOLORED_ENV } from '../testUtils.js';

// Runs check-action-pins.mjs on the workflows of the repository, then on files written for a test

const SCRIPT = join(process.cwd(), 'scripts', 'ci', 'check-action-pins.mjs');
const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const DIGEST = 'f2a5f9e1c3d4b5a6978877665544332211009988aabbccddeeff001122334455';

const runFile = promisify(execFile);

/** Runs the script from a folder, as the workflows job of ci.yml does from the project root. */
const runScript = async ({ cwd = process.cwd() } = {}) => {
  try {
    const options = { cwd, env: UNCOLORED_ENV, encoding: 'utf8' };
    const { stdout } = await runFile(process.execPath, [SCRIPT], options);
    return { exitCode: 0, log: stdout };
  } catch (error) {
    return { exitCode: error.code, log: error.stdout, errorLog: error.stderr };
  }
};

describe('check-action-pins.mjs', () => {
  let directory;

  /** Writes a file of the .github folder of the test project. */
  const writeGitHubFile = ({ file, lines }) => {
    const filePath = join(directory, '.github', file);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${lines.join('\n')}\n`);
  };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'check-action-pins-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('passes on the workflows and the actions of the repository', async () => {
    const { exitCode, log } = await runScript();

    expect(exitCode).toBe(0);
    expect(log).toMatch(
      /^The \d+ uses: keys and the [1-9]\d* images of the jobs of the \d+ YAML files of \.github\/ pin what they run\.$/m,
    );
  });

  it('fails with an error annotation on each action of a third party referenced by a tag', async () => {
    writeGitHubFile({
      file: 'workflows/ci.yml',
      lines: [
        'jobs:',
        '  deploy:',
        '    steps:',
        '      - uses: actions/checkout@v7',
        '      - uses: ./.github/actions/setup',
        '      - uses: cloudflare/wrangler-action@v4',
      ],
    });
    writeGitHubFile({
      file: 'actions/setup/action.yml',
      lines: [
        'runs:',
        '  using: composite',
        '  steps:',
        `    - uses: pnpm/action-setup@${SHA} # v6.1.0`,
        '    - uses: owner/other-action@main',
      ],
    });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(log.trim().split('\n')).toEqual([
      expect.stringMatching(
        /^::error file=\.github\/actions\/setup\/action\.yml,line=5,col=7,title=Unpinned action::owner\/other-action@main is not pinned: /,
      ),
      expect.stringMatching(
        /^::error file=\.github\/workflows\/ci\.yml,line=6,col=9,title=Unpinned action::cloudflare\/wrangler-action@v4 is not pinned: /,
      ),
    ]);
  });

  it('passes when every action of a third party is pinned by the SHA of a commit', async () => {
    writeGitHubFile({
      file: 'workflows/release.yml',
      lines: [
        'jobs:',
        '  release:',
        '    steps:',
        `      - uses: googleapis/release-please-action@${SHA} # v5.0.0`,
      ],
    });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(0);
    expect(log).toBe(
      'The 1 uses: keys and the 0 images of the jobs of the 1 YAML files of .github/ pin what they run.\n',
    );
  });

  it('fails with an error annotation on each image of a job pinned by a tag alone', async () => {
    writeGitHubFile({
      file: 'workflows/ci.yml',
      lines: [
        'jobs:',
        '  build:',
        '    container: node:24',
        '  webkit:',
        '    container:',
        `      image: mcr.microsoft.com/playwright:v1.64.0-noble@sha256:${DIGEST}`,
        '    services:',
        '      db:',
        '        image: postgres:17',
        `      redis: redis:8@sha256:${DIGEST}`,
      ],
    });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(log.trim().split('\n')).toEqual([
      expect.stringMatching(
        /^::error file=\.github\/workflows\/ci\.yml,line=3,col=5,title=Unpinned image::node:24, the image of the container of the job build, is not pinned: /,
      ),
      expect.stringMatching(
        /^::error file=\.github\/workflows\/ci\.yml,line=9,col=9,title=Unpinned image::postgres:17, the image of the service db of the job webkit, is not pinned: /,
      ),
    ]);
  });

  it('passes when every image of a job is pinned by its digest', async () => {
    writeGitHubFile({
      file: 'workflows/ci.yml',
      lines: [
        'jobs:',
        '  test:',
        `    container: node:24@sha256:${DIGEST}`,
        '    services:',
        '      db:',
        `        image: postgres:17@sha256:${DIGEST}`,
      ],
    });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(0);
    expect(log).toBe(
      'The 0 uses: keys and the 2 images of the jobs of the 1 YAML files of .github/ pin what they run.\n',
    );
  });

  it('fails when the project has no .github folder', async () => {
    const { exitCode, errorLog } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(errorLog).toContain('ENOENT');
  });
});
