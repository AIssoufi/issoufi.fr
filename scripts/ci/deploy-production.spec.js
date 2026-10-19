import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Runs the trees step of deploy-production.yml against a local bare repository standing for GitHub

const WORKFLOW = readFileSync('.github/workflows/deploy-production.yml', 'utf8');

/** The shell that GitHub Actions runs a `run` step with on Linux. */
const STEP_SHELL = ['--noprofile', '--norc', '-eo', 'pipefail', '-c'];

/**
 * The script of the step whose `id` is given, as the `run: |` block that follows it writes it,
 * without the indentation of the block.
 */
const getStepScript = id => {
  const lines = WORKFLOW.split('\n');
  const stepIndex = lines.findIndex(line => line.trim() === `- id: ${id}`);
  if (stepIndex === -1) throw new Error(`No step with the id "${id}" in deploy-production.yml`);
  const runIndex = lines.findIndex((line, index) => index > stepIndex && line.trim() === 'run: |');
  const blockLines = [];
  for (const line of lines.slice(runIndex + 1)) {
    const isInBlock = line.trim() === '' || line.search(/\S/) > lines[runIndex].search(/\S/);
    if (!isInBlock) break;
    blockLines.push(line);
  }
  const indent = Math.min(...blockLines.filter(line => line.trim()).map(line => line.search(/\S/)));
  return blockLines.map(line => line.slice(indent)).join('\n');
};

/**
 * The environment of the git commands: the variables of a git hook that runs the tests, such as
 * GIT_DIR, and the configuration of the machine (commit signing) would reach the test repositories.
 */
const GIT_ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

const git = ({ cwd, args }) =>
  execFileSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8' }).trim();

describe('the trees step of deploy-production.yml', () => {
  let directory;
  let work;
  let runner;
  let outputFile;

  /** Commits a change in the working repository and returns its SHA. */
  const commit = message => {
    writeFileSync(join(work, 'file.txt'), message);
    git({ cwd: work, args: ['add', '--all'] });
    git({ cwd: work, args: ['commit', '--message', message] });
    return git({ cwd: work, args: ['rev-parse', 'HEAD'] });
  };

  /**
   * Fetches the branches into the runner as actions/checkout does, then sets origin/develop to
   * the commit that started the run, as its forced fetch of github.sha does.
   */
  const checkOut = triggerSha => {
    git({
      cwd: runner,
      args: ['fetch', '--quiet', '--no-tags', 'origin', '+refs/heads/*:refs/remotes/origin/*'],
    });
    git({ cwd: runner, args: ['update-ref', 'refs/remotes/origin/develop', triggerSha] });
  };

  /** Merges develop into main as the promote job does, so that both hold the same tree. */
  const deployDevelop = () => {
    git({ cwd: work, args: ['checkout', '--quiet', '-b', 'main', 'origin/main'] });
    git({ cwd: work, args: ['merge', '--quiet', '--no-ff', '--no-edit', 'develop'] });
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:main'] });
  };

  /** Runs the step in the runner and returns what it printed. */
  const runStep = () =>
    execFileSync('bash', [...STEP_SHELL, getStepScript('trees')], {
      cwd: runner,
      env: { ...GIT_ENV, GITHUB_OUTPUT: outputFile },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'deploy-production-'));
    const origin = join(directory, 'origin.git');
    work = join(directory, 'work');
    runner = join(directory, 'runner');
    outputFile = join(directory, 'output');
    writeFileSync(outputFile, '');
    git({
      cwd: directory,
      args: ['init', '--quiet', '--bare', '--initial-branch=develop', origin],
    });
    for (const repository of [work, runner]) {
      git({ cwd: directory, args: ['init', '--quiet', '--initial-branch=develop', repository] });
      git({ cwd: repository, args: ['remote', 'add', 'origin', origin] });
    }
    commit('feat: first change');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop', 'HEAD:main'] });
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('deploys the release that the release job merged after the run started', () => {
    const triggerSha = commit('feat: second change');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });
    checkOut(triggerSha);
    const releaseSha = commit('chore: release 1.3.0');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });

    runStep();

    expect(readFileSync(outputFile, 'utf8')).toBe(`sha=${releaseSha}\n`);
  });

  it('deploys the tip of develop when no release was merged', () => {
    const triggerSha = commit('feat: second change');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });
    checkOut(triggerSha);

    runStep();

    expect(readFileSync(outputFile, 'utf8')).toBe(`sha=${triggerSha}\n`);
  });

  it('deploys the release merged after the run started, when main held develop until then', () => {
    const triggerSha = commit('feat: second change');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });
    deployDevelop();
    checkOut(triggerSha);
    git({ cwd: work, args: ['checkout', '--quiet', 'develop'] });
    const releaseSha = commit('chore: release 1.3.0');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });

    runStep();

    expect(readFileSync(outputFile, 'utf8')).toBe(`sha=${releaseSha}\n`);
  });

  it('deploys nothing when main already holds the content of develop', () => {
    const triggerSha = commit('feat: second change');
    git({ cwd: work, args: ['push', '--quiet', 'origin', 'HEAD:develop'] });
    deployDevelop();
    checkOut(triggerSha);

    const log = runStep();

    expect(readFileSync(outputFile, 'utf8')).toBe('');
    expect(log).toContain(
      '::notice::Nothing to deploy: main already holds the content of develop.',
    );
  });
});
