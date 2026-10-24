import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runNodeScript, UNCOLORED_ENV, withoutColors } from './testUtils.js';

describe('withoutColors', () => {
  it('drops FORCE_COLOR, sets NO_COLOR and keeps the other variables', () => {
    expect(withoutColors({ FORCE_COLOR: '1', PATH: '/bin', CI: 'true' })).toEqual({
      PATH: '/bin',
      CI: 'true',
      NO_COLOR: '1',
    });
  });

  it.each([
    ['FORCE_COLOR set to 0', { FORCE_COLOR: '0' }],
    ['an empty FORCE_COLOR', { FORCE_COLOR: '' }],
    ['NO_COLOR set to 0', { NO_COLOR: '0' }],
    ['an empty NO_COLOR', { NO_COLOR: '' }],
    ['an empty environment', {}],
  ])('turns the colors off with %s', (_, env) => {
    expect(withoutColors(env)).toEqual({ NO_COLOR: '1' });
  });

  it('leaves the given environment as it is', () => {
    const env = { FORCE_COLOR: '3', PATH: '/bin' };

    withoutColors(env);

    expect(env).toEqual({ FORCE_COLOR: '3', PATH: '/bin' });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a text', 'FORCE_COLOR=1'],
    ['a number', 1],
    ['a boolean', true],
    ['an array', ['FORCE_COLOR=1']],
  ])('counts %s as an empty environment', (_, env) => {
    expect(withoutColors(env)).toEqual({ NO_COLOR: '1' });
  });
});

describe('UNCOLORED_ENV', () => {
  it('is the environment of the tests without colors', () => {
    expect(UNCOLORED_ENV).not.toHaveProperty('FORCE_COLOR');
    expect(UNCOLORED_ENV).toHaveProperty('NO_COLOR', '1');
    expect(UNCOLORED_ENV).toHaveProperty('PATH', process.env.PATH);
  });
});

/** Length of an output, in bytes, over the buffer of 1 MiB that `execFile` holds. */
const TOO_LONG_LOG_BYTES = 2 * 1024 * 1024;

describe('runNodeScript', () => {
  let directory;

  /** Writes a script of the test folder and returns its path. */
  const writeScript = ({ file = 'script.mjs', lines }) => {
    const filePath = join(directory, file);
    writeFileSync(filePath, `${lines.join('\n')}\n`);
    return filePath;
  };

  beforeEach(() => {
    directory = realpathSync(mkdtempSync(join(tmpdir(), 'run-node-script-')));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('returns the exit code 0 and both outputs of a script that succeeds', async () => {
    const script = writeScript({
      lines: ["process.stdout.write('done\\n');", "process.stderr.write('warning\\n');"],
    });

    await expect(runNodeScript({ script })).resolves.toEqual({
      exitCode: 0,
      log: 'done\n',
      errorLog: 'warning\n',
    });
  });

  it('returns the exit code and both outputs of a script that fails', async () => {
    const script = writeScript({
      lines: [
        "process.stdout.write('checked\\n');",
        "process.stderr.write('broken\\n');",
        'process.exit(3);',
      ],
    });

    await expect(runNodeScript({ script })).resolves.toEqual({
      exitCode: 3,
      log: 'checked\n',
      errorLog: 'broken\n',
    });
  });

  it('runs the script from the given folder, by a path from that folder', async () => {
    writeScript({ lines: ['console.log(process.cwd());'] });

    const { exitCode, log } = await runNodeScript({ script: 'script.mjs', cwd: directory });

    expect(exitCode).toBe(0);
    expect(log).toBe(`${directory}\n`);
  });

  it('runs the script from the project root by default', async () => {
    const script = writeScript({ lines: ['console.log(process.cwd());'] });

    const { log } = await runNodeScript({ script });

    expect(log).toBe(`${process.cwd()}\n`);
  });

  it('runs the script without the colors that the CI forces', async () => {
    const script = writeScript({
      lines: ['console.log(JSON.stringify([process.env.NO_COLOR, process.env.FORCE_COLOR]));'],
    });

    const { log } = await runNodeScript({ script });

    expect(JSON.parse(log)).toEqual(['1', null]);
  });

  it('fails with the error of Node.js for a script that does not exist', async () => {
    const { exitCode, log, errorLog } = await runNodeScript({
      script: join(directory, 'none.mjs'),
    });

    expect(exitCode).toBe(1);
    expect(log).toBe('');
    expect(errorLog).toContain('Cannot find module');
  });

  it('keeps an empty error output for a script that fails on its standard output', async () => {
    const script = writeScript({ lines: ["console.log('failed');", 'process.exit(2);'] });

    await expect(runNodeScript({ script })).resolves.toEqual({
      exitCode: 2,
      log: 'failed\n',
      errorLog: '',
    });
  });

  it('keeps the error output of a script killed by a signal', async () => {
    const script = writeScript({
      lines: ["process.stderr.write('before kill\\n');", "process.kill(process.pid, 'SIGKILL');"],
    });

    await expect(runNodeScript({ script })).resolves.toEqual({
      exitCode: 1,
      log: '',
      errorLog: 'before kill\n',
    });
  });

  it('fails with the error of execFile for a script that writes past its buffer', async () => {
    const script = writeScript({
      lines: [`process.stdout.write('x'.repeat(${TOO_LONG_LOG_BYTES}));`],
    });

    const { exitCode, errorLog } = await runNodeScript({ script });

    expect(exitCode).toBe(1);
    expect(errorLog).toContain('maxBuffer');
  });

  it('fails without throwing when the folder does not exist', async () => {
    const script = writeScript({ lines: ["console.log('never');"] });

    const { exitCode, log, errorLog } = await runNodeScript({
      script,
      cwd: join(directory, 'missing'),
    });

    expect(exitCode).toBe(1);
    expect(log).toBe('');
    expect(errorLog).toContain('ENOENT');
  });

  it.each([
    ['no options', undefined],
    ['no script', {}],
    ['an empty script', { script: '' }],
    ['a script that is not a text', { script: 1 }],
  ])('throws a TypeError with %s', async (_, options) => {
    await expect(runNodeScript(options)).rejects.toThrow(TypeError);
  });
});
