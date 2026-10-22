import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { UNCOLORED_ENV } from '../testUtils.js';

// Runs commitlint with the configurations of the repository, and the prepare-commit-msg hook in a
// repository of its own, as git runs them

const ROOT = resolve(import.meta.dirname, '../..');
const COMMITLINT = join(ROOT, 'node_modules/.bin/commitlint');
const COMMITS_CONFIG = join(ROOT, 'commitlint.config.mjs');
const TITLE_CONFIG = join(ROOT, 'scripts/commits/title.config.mjs');
const HOOK = join(ROOT, '.husky/prepare-commit-msg');

/** Time commitlint may take for one message, in milliseconds: it loads its config each time. */
const COMMITLINT_TIMEOUT_MS = 20_000;

/** Runs commitlint on a message and gives its exit code and its output. */
const lint = ({ message, config = COMMITS_CONFIG }) => {
  const { status, stdout } = spawnSync(COMMITLINT, ['--config', config], {
    cwd: ROOT,
    input: message,
    encoding: 'utf8',
    env: UNCOLORED_ENV,
  });
  return { status, output: stdout };
};

describe('commitlint.config.mjs', () => {
  it.each([
    ['a commit with its ticket', 'fix: keep the menu open\n\nRefs: ISF-322'],
    [
      'a commit with its ticket in the body',
      'fix: keep the menu open\n\nRefs: ISF-322\n\nCo-Authored-By: A <a@example.com>',
    ],
    [
      'a commit with its ticket and a co-author',
      'fix: keep the menu open\n\nWhy.\n\nRefs: ISF-322\nCo-Authored-By: A <a@example.com>',
    ],
    ['a release commit of release-please', 'chore: release 1.4.0'],
    [
      'a commit of Dependabot',
      'build(deps-dev): bump vitest from 4.0.1 to 4.1.0\n\n' +
        'Signed-off-by: dependabot[bot] <support@github.com>',
    ],
    ['a merge commit', 'Merge pull request #319 from AIssoufi/ISF-318\n\nDocs split'],
    ['a merge of a branch', "Merge branch 'develop' into ISF-322"],
  ])('accepts %s', { timeout: COMMITLINT_TIMEOUT_MS }, (_, message) => {
    expect(lint({ message }).status).toBe(0);
  });

  it('rejects a commit without its ticket', { timeout: COMMITLINT_TIMEOUT_MS }, () => {
    const { status, output } = lint({ message: 'fix: keep the menu open\n\nWhy.' });
    expect(status).toBe(1);
    expect(output).toContain('Refs: ISF-<n> [footer-ticket-reference]');
  });

  it('still rejects a bad subject', { timeout: COMMITLINT_TIMEOUT_MS }, () => {
    const { status, output } = lint({ message: 'Keep the menu open\n\nRefs: ISF-322' });
    expect(status).toBe(1);
    expect(output).toContain('[type-empty]');
  });
});

describe('scripts/commits/title.config.mjs', () => {
  it('accepts a conventional title without a footer', { timeout: COMMITLINT_TIMEOUT_MS }, () => {
    expect(
      lint({ message: 'build(deps-dev): update commitlint to 21', config: TITLE_CONFIG }),
    ).toEqual(expect.objectContaining({ status: 0 }));
  });

  it.each(['Update commitlint', 'feat: Update commitlint.', 'wip: update commitlint'])(
    'rejects the title %j',
    { timeout: COMMITLINT_TIMEOUT_MS },
    message => {
      expect(lint({ message, config: TITLE_CONFIG }).status).toBe(1);
    },
  );
});

describe('.husky/prepare-commit-msg', () => {
  let repository;
  let messageFile;

  /** Runs git in the repository of the test. */
  const git = (...args) => spawnSync('git', args, { cwd: repository, encoding: 'utf8' });

  /** Runs the hook on a message, as git does before it opens the editor. */
  const prepare = ({ message, source = 'message' }) => {
    writeFileSync(messageFile, message);
    const { status } = spawnSync('sh', [HOOK, messageFile, source], { cwd: repository });
    return { status, message: readFileSync(messageFile, 'utf8') };
  };

  beforeEach(() => {
    repository = mkdtempSync(join(tmpdir(), 'prepare-commit-msg-'));
    messageFile = join(repository, 'COMMIT_EDITMSG');
    git('init', '--quiet', '--initial-branch', 'ISF-322');
  });

  afterEach(() => {
    rmSync(repository, { recursive: true, force: true });
  });

  it('adds the footer of the ticket branch', () => {
    expect(prepare({ message: 'fix: keep the menu open\n' })).toEqual({
      status: 0,
      message: 'fix: keep the menu open\n\nRefs: ISF-322\n',
    });
  });

  it('adds it to the trailers, before the comments of the editor', () => {
    const message = 'fix: x\n\nWhy.\n\nCo-Authored-By: A <a@example.com>\n# Please enter…\n';
    expect(prepare({ message, source: '' }).message).toBe(
      'fix: x\n\nWhy.\n\nCo-Authored-By: A <a@example.com>\nRefs: ISF-322\n# Please enter…\n',
    );
  });

  it.each([
    'fix: keep the menu open\n\nRefs: ISF-322\n',
    'fix: keep the menu open\n\nRefs: ISF-100\n',
    'fix: keep the menu open\n\nRefs: ISF-322\nCo-Authored-By: A <a@example.com>\n',
    // A footer of the body, which git does not read as a trailer, is not added twice
    'fix: keep the menu open\n\nRefs: ISF-322\n\nCo-Authored-By: A <a@example.com>\n',
  ])('leaves the footer of %j alone', message => {
    expect(prepare({ message })).toEqual({ status: 0, message });
  });

  it('adds it once to an amended message', () => {
    const { message } = prepare({ message: 'fix: x\n', source: 'commit' });
    expect(prepare({ message, source: 'commit' }).message).toBe('fix: x\n\nRefs: ISF-322\n');
  });

  it.each(['merge', 'squash'])('leaves a %s message alone', source => {
    const message = "Merge branch 'develop' into ISF-322\n";
    expect(prepare({ message, source })).toEqual({ status: 0, message });
  });

  it.each(['develop', 'main', 'ISF-', 'ISF-322-menu', 'feature/ISF-322', 'isf-322'])(
    'adds nothing on the branch %s',
    branch => {
      git('checkout', '--quiet', '-b', branch);
      const message = 'fix: keep the menu open\n';
      expect(prepare({ message })).toEqual({ status: 0, message });
    },
  );

  it('adds nothing on a detached HEAD, as in a rebase', () => {
    git(
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '--quiet',
      '--allow-empty',
      '--no-verify',
      '-m',
      'init',
    );
    git('checkout', '--quiet', '--detach');
    const message = 'fix: keep the menu open\n';
    expect(prepare({ message })).toEqual({ status: 0, message });
  });
});
