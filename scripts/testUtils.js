import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/** Variable through which the CI forces the colors of the tools that it runs. */
const FORCE_COLOR_VARIABLE = 'FORCE_COLOR';

/** Variable that turns off the colors of a tool, whatever its value, once set. */
const NO_COLOR_VARIABLE = 'NO_COLOR';

/**
 * Copies an environment without colors: without `FORCE_COLOR`, which the CI sets, and with
 * `NO_COLOR`, so that a script that a spec runs in a child process writes its output without the
 * escape codes of colors.
 *
 * @param {unknown} env - Environment to copy, such as `process.env`. Any value that is not an
 * object, or an array, counts as an empty environment.
 * @returns {Record<string, unknown>} A new environment, which leaves the given one as it is.
 * @example
 * withoutColors({ FORCE_COLOR: '1', PATH: '/bin' }); // { PATH: '/bin', NO_COLOR: '1' }
 */
export const withoutColors = env => {
  const isEnvironment = typeof env === 'object' && env !== null && !Array.isArray(env);
  const variables = isEnvironment ? Object.entries(env) : [];
  return {
    ...Object.fromEntries(variables.filter(([name]) => name !== FORCE_COLOR_VARIABLE)),
    [NO_COLOR_VARIABLE]: '1',
  };
};

/**
 * Environment of a script or a tool that a spec runs in a child process, such as commitlint or a
 * script of `scripts/ci/`: that of the tests, without the colors that the CI forces, which would
 * break the text of its output with escape codes.
 */
export const UNCOLORED_ENV = withoutColors(process.env);

const runFile = promisify(execFile);

/**
 * Exit code that {@link runNodeScript} gives a script whose process has none: one that could not
 * start, was killed by a signal or wrote more than the buffer of `execFile` holds.
 */
const NO_EXIT_CODE_FALLBACK = 1;

/**
 * @typedef {object} RunNodeScriptParams
 * @property {string} script - Absolute path of the script, or path from `cwd`.
 * @property {string} [cwd] - Folder to run it from: the project root by default.
 */

/**
 * Runs a Node.js script in a child process, with {@link UNCOLORED_ENV}, as a job of the CI runs a
 * script of `scripts/ci/`, and returns what it did instead of throwing when it fails.
 *
 * @param {RunNodeScriptParams} [params] - What to run.
 * @returns {Promise<{ exitCode: number, log: string, errorLog: string }>} The exit code of the
 * script, and what it wrote on its standard output (`log`) and its error output (`errorLog`). A
 * process with no exit code gets the error of `execFile` when it wrote no error output.
 * @throws {TypeError} Rejects with it when `script` is not a non-empty text: Node.js would wait
 * for a script on its standard input instead.
 * @example
 * const { exitCode, log } = await runNodeScript({ script: SCRIPT, cwd: directory });
 */
export const runNodeScript = async ({ script, cwd = process.cwd() } = {}) => {
  const hasScript = typeof script === 'string' && script !== '';
  if (!hasScript) throw new TypeError('runNodeScript needs the path of a script');
  try {
    const options = { cwd, env: UNCOLORED_ENV, encoding: 'utf8' };
    const { stdout, stderr } = await runFile(process.execPath, [script], options);
    return { exitCode: 0, log: stdout, errorLog: stderr };
  } catch (error) {
    // See NO_EXIT_CODE_FALLBACK: a text code (`ENOENT`, a full buffer), or none after a signal
    const hasExitCode = typeof error.code === 'number';
    if (hasExitCode) return { exitCode: error.code, log: error.stdout, errorLog: error.stderr };
    return {
      exitCode: NO_EXIT_CODE_FALLBACK,
      log: error.stdout,
      errorLog: error.stderr || error.message,
    };
  }
};
