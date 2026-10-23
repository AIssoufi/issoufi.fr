import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { UNCOLORED_ENV } from '../testUtils.js';

// Runs check-playwright-image.mjs on the workflows and the lockfile of the repository, then on
// files written for a test

const SCRIPT = join(process.cwd(), 'scripts', 'ci', 'check-playwright-image.mjs');

const DIGEST = `sha256:${'0a'.repeat(32)}`;

const runFile = promisify(execFile);

/** Lines of a workflow whose WebKit job runs in the image of Playwright at a tag. */
const workflowWithImage = tag => [
  'jobs:',
  '  browser-test-webkit:',
  '    container:',
  `      image: mcr.microsoft.com/playwright:${tag}@${DIGEST}`,
];

/** Lines of a lockfile whose root project installs @playwright/test at a version. */
const lockfileWithVersion = version => [
  "lockfileVersion: '9.0'",
  '',
  'importers:',
  '',
  '  .:',
  '    devDependencies:',
  "      '@playwright/test':",
  `        specifier: ^${version}`,
  `        version: ${version}`,
];

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

describe('check-playwright-image.mjs', () => {
  let directory;

  /** Writes a file of the test project. */
  const writeProjectFile = ({ file, lines }) => {
    const filePath = join(directory, file);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${lines.join('\n')}\n`);
  };

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'check-playwright-image-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('passes on the workflows and the lockfile of the repository', async () => {
    const { exitCode, log } = await runScript();

    expect(exitCode).toBe(0);
    expect(log).toMatch(
      /^The [1-9]\d* images of Playwright of the \d+ YAML files of \.github\/ run @playwright\/test \d+\.\d+\.\d+, the version of pnpm-lock\.yaml\.\n$/,
    );
  });

  it('passes when the tag of the image names the version of the lockfile', async () => {
    writeProjectFile({
      file: '.github/workflows/ci.yml',
      lines: workflowWithImage('v1.64.0-noble'),
    });
    writeProjectFile({ file: '.github/dependabot.yml', lines: ['version: 2'] });
    writeProjectFile({ file: 'pnpm-lock.yaml', lines: lockfileWithVersion('1.64.0') });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(0);
    expect(log).toBe(
      'The 1 images of Playwright of the 2 YAML files of .github/ run @playwright/test 1.64.0,' +
        ' the version of pnpm-lock.yaml.\n',
    );
  });

  it('annotates the line of an image whose tag names another version', async () => {
    writeProjectFile({
      file: '.github/workflows/ci.yml',
      lines: workflowWithImage('v1.63.0-noble'),
    });
    writeProjectFile({ file: 'pnpm-lock.yaml', lines: lockfileWithVersion('1.64.0') });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(log.trim().split('\n')).toEqual([
      expect.stringMatching(
        /^::error file=\.github\/workflows\/ci\.yml,line=4,col=7,title=Playwright image::The tag v1\.63\.0-noble of this image runs Playwright 1\.63\.0, but pnpm-lock\.yaml installs @playwright\/test 1\.64\.0, .+ curl .+\/manifests\/v1\.64\.0-noble /,
      ),
    ]);
  });

  it('annotates the lockfile when it lists no version of @playwright/test', async () => {
    writeProjectFile({
      file: '.github/workflows/ci.yml',
      lines: workflowWithImage('v1.64.0-noble'),
    });
    writeProjectFile({ file: 'pnpm-lock.yaml', lines: ["lockfileVersion: '9.0'", 'importers:'] });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(log).toBe(
      '::error file=pnpm-lock.yaml,title=Playwright image::pnpm-lock.yaml lists no version of' +
        ' @playwright/test under importers:, so the check cannot compare the image of Playwright' +
        ' with it.\n',
    );
  });

  it('fails when no workflow names an image of Playwright', async () => {
    writeProjectFile({
      file: '.github/workflows/ci.yml',
      lines: workflowWithImage('v1.64.0-noble').slice(0, 2),
    });
    writeProjectFile({ file: 'pnpm-lock.yaml', lines: lockfileWithVersion('1.64.0') });

    const { exitCode, log } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(log).toMatch(
      /^::error title=Playwright image::No image: key of \.github\/ names an image of Playwright /,
    );
  });

  it('fails when the project has no lockfile', async () => {
    writeProjectFile({
      file: '.github/workflows/ci.yml',
      lines: workflowWithImage('v1.64.0-noble'),
    });

    const { exitCode, errorLog } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(errorLog).toContain('ENOENT');
    expect(errorLog).toContain('pnpm-lock.yaml');
  });

  it('fails when the project has no .github folder', async () => {
    writeProjectFile({ file: 'pnpm-lock.yaml', lines: lockfileWithVersion('1.64.0') });

    const { exitCode, errorLog } = await runScript({ cwd: directory });

    expect(exitCode).toBe(1);
    expect(errorLog).toContain('ENOENT');
  });
});
