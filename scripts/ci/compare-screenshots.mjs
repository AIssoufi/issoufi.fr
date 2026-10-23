// @ts-check
// Compares the screenshots of every page of the working tree with those of the base of the change
// (pnpm test:visual [--base <git ref>]): builds both, screenshots the base with the tests of
// e2e/*.visual.ts as the expected screens, then the working tree against them, and lists the
// changed screens in the job summary, or in the terminal. A changed screen does not fail it, since
// a change may mean it; a screen that could not be compared does. The base is the merge base of
// HEAD and --base (origin/develop by default), exported to a temporary folder outside the project.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import {
  DEFAULT_VISUAL_BASE_REF,
  VISUAL_CONFIG_FILE,
  VISUAL_REPORT_DIR,
  VISUAL_SITE_DIR_VARIABLE,
} from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { getErrorMessage } from './utils/errors.mjs';
import { appendJobSummary } from './utils/job-summary.mjs';
import { listScreenResults, renderScreenshotSummary } from './utils/screenshots.mjs';

/**
 * Parameters of {@link run}.
 * @typedef {object} RunParams
 * @property {string[]} args - Command, then its arguments.
 * @property {string} [cwd] - Folder to run it in. Defaults to the project root.
 * @property {Record<string, string>} [env] - Variables added to the environment of the script.
 */

/**
 * Runs a command, its output shown with the one of the script.
 * @param {RunParams} params
 * @returns {boolean} Whether it ended with no error.
 */
const run = ({ args: [command, ...args], cwd, env }) =>
  spawnSync(command, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' }).status === 0;

/**
 * Stops the comparison with an error, which the script writes as an annotation on GitHub Actions
 * once it has removed its temporary folder.
 * @param {string} message - What failed.
 * @returns {never}
 * @throws {Error} Always, with the message.
 */
const fail = message => {
  throw new Error(message);
};

/**
 * Finds the base of the change: the commit where the working tree branched from a reference.
 * @param {string} ref - Git reference of the target branch, e.g. `origin/develop`.
 * @returns {string} The full hash of the commit.
 */
const findBaseCommit = ref => {
  const { status, stdout } = spawnSync('git', ['merge-base', 'HEAD', ref], { encoding: 'utf8' });
  if (status !== 0) fail(`No merge base of HEAD and ${ref}: fetch it first (git fetch origin)`);
  return stdout.trim();
};

/**
 * Parameters of {@link takeScreenshots}.
 * @typedef {object} TakeScreenshotsParams
 * @property {string} siteDir - Checkout whose build the screenshots show.
 * @property {string[]} args - Options of `playwright test`.
 * @property {Record<string, string>} [env] - Variables of the reporters.
 */

/**
 * Runs the screenshot tests of {@link VISUAL_CONFIG_FILE} on the build of a checkout.
 * @param {TakeScreenshotsParams} params
 * @returns {boolean} Whether every test passed.
 */
const takeScreenshots = ({ siteDir, args, env }) =>
  run({
    args: ['pnpm', 'exec', 'playwright', 'test', '--config', VISUAL_CONFIG_FILE, ...args],
    env: { ...env, [VISUAL_SITE_DIR_VARIABLE]: siteDir },
  });

/**
 * Reads the JSON report of the comparison.
 * @param {string} file - Path of the report.
 * @returns {unknown} The parsed report, or `undefined` when it is missing or invalid.
 */
const readReport = file => {
  if (!existsSync(file)) return undefined;

  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};

const { values } = parseArgs({
  options: { base: { type: 'string', default: DEFAULT_VISUAL_BASE_REF } },
});
const workDir = mkdtempSync(join(tmpdir(), 'visual-'));
const baseDir = join(workDir, 'base');
const archive = join(workDir, 'base.tar');
const resultsFile = join(workDir, 'results.json');

try {
  const baseCommit = findBaseCommit(values.base);
  const shortBase = baseCommit.slice(0, 7);
  console.log(`Building the working tree, then the base of the change, ${shortBase}`);
  if (!run({ args: ['pnpm', 'build'] })) fail('The build of the working tree failed');

  // The files of the commit alone, outside the project: Node.js strips no types of a file under
  // node_modules, and the tools of the project would read the copy if it stood inside
  mkdirSync(baseDir);
  const isExported =
    run({ args: ['git', 'archive', '--format=tar', `--output=${archive}`, baseCommit] }) &&
    run({ args: ['tar', '-xf', archive, '-C', baseDir] });
  if (!isExported) fail(`The export of ${shortBase} failed`);
  // HUSKY=0: the copy has no git repository to install the hooks in
  const isBaseBuilt =
    run({ args: ['pnpm', 'install', '--frozen-lockfile'], cwd: baseDir, env: { HUSKY: '0' } }) &&
    run({ args: ['pnpm', 'build'], cwd: baseDir });
  if (!isBaseBuilt) fail(`The build of the base of the change, ${shortBase}, failed`);

  console.log(`Screenshotting the base of the change, ${shortBase}`);
  const isBaseShot = takeScreenshots({
    siteDir: baseDir,
    args: ['--update-snapshots=all', '--reporter=dot'],
  });
  if (!isBaseShot) fail(`A screen of the base of the change, ${shortBase}, failed`);

  console.log('Comparing the screenshots of the working tree with those of the base');
  takeScreenshots({
    siteDir: process.cwd(),
    args: ['--update-snapshots=none', '--reporter=list,json,html'],
    env: {
      PLAYWRIGHT_JSON_OUTPUT_FILE: resultsFile,
      PLAYWRIGHT_HTML_OUTPUT_DIR: VISUAL_REPORT_DIR,
      PLAYWRIGHT_HTML_OPEN: 'never',
    },
  });
  const screens = listScreenResults(readReport(resultsFile));
  appendJobSummary({ markdown: renderScreenshotSummary({ screens, base: shortBase }) });

  const hasScreens = screens.length > 0;
  const hasFailedScreens = screens.some(({ outcome }) => outcome === 'failed');
  if (!hasScreens || hasFailedScreens) fail('A screen could not be compared: see the summary');
} catch (error) {
  writeAnnotation({ level: 'error', message: getErrorMessage(error) });
  process.exitCode = 1;
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
