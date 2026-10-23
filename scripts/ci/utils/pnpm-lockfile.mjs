// @ts-check
import { TEXT_LINE_BREAK_PATTERN, YAML_KEY_LINE_PATTERN } from '../constants.mjs';
import {
  LOCKFILE_IMPORTERS_LINE,
  LOCKFILE_PEER_SUFFIX_PATTERN,
  LOCKFILE_VERSION_KEY,
} from './constants.mjs';
import { readIndentation, unquote } from './yaml.mjs';

/**
 * Parameters of {@link takeLinesWhile}.
 * @typedef {object} TakeLinesWhileParams
 * @property {string[]} lines - Lines to read.
 * @property {(line: string) => boolean} isKept - Test that each line, from the first, passes.
 */

/**
 * Parameters of {@link readLockedVersion}.
 * @typedef {object} ReadLockedVersionParams
 * @property {unknown} [source] - Text of `pnpm-lock.yaml`. Any value that is not a text counts as
 * an empty file.
 * @property {unknown} [packageName] - Name of the package, e.g. `@playwright/test`. An empty name
 * or any value that is not a text matches no entry.
 */

/**
 * Reads the key that a line opens, in or out of quotes, with no value on the line: a key under
 * which a mapping goes on, such as a dependency of the lockfile of pnpm (`'@playwright/test':`).
 * @param {string} line - Line of a YAML file.
 * @returns {string | undefined} The key without its quotes, or `undefined` for a line that holds
 * a value or no key.
 */
const readMappingKey = line => {
  const text = line.trim();
  if (!text.endsWith(':')) return undefined;
  return unquote(text.slice(0, -1));
};

/**
 * Keeps the first lines of a list for as long as they pass a test.
 * @param {TakeLinesWhileParams} params - The lines and the test.
 * @returns {string[]} The lines before the first one that fails the test.
 */
const takeLinesWhile = ({ lines, isKept }) => {
  const endIndex = lines.findIndex(line => !isKept(line));
  const isEveryLineKept = endIndex === -1;
  return isEveryLineKept ? lines : lines.slice(0, endIndex);
};

/**
 * Reads the version of a package that the lockfile of pnpm installs: the `version:` of its entry
 * in the first project of `importers:` that depends on it, without the peer dependencies that may
 * follow it. Reads the lines as pnpm writes them, not a YAML file of any shape.
 * @param {ReadLockedVersionParams} [params] - The lockfile and the name of the package.
 * @returns {string | undefined} The version, e.g. `1.64.0`, or `undefined` when the lockfile has
 * no such entry or the entry no version.
 * @example
 * readLockedVersion({
 *   source:
 *     "importers:\n  .:\n    devDependencies:\n      '@playwright/test':\n" +
 *     '        specifier: ^1.64.0\n        version: 1.64.0\n',
 *   packageName: '@playwright/test',
 * }); // '1.64.0'
 */
export const readLockedVersion = ({ source, packageName } = {}) => {
  const name = typeof packageName === 'string' ? packageName.trim() : '';
  if (!name) return undefined;

  const text = typeof source === 'string' ? source : '';
  const lines = text.split(TEXT_LINE_BREAK_PATTERN);
  const importersIndex = lines.indexOf(LOCKFILE_IMPORTERS_LINE);
  if (importersIndex === -1) return undefined;

  /**
   * Whether a line still belongs to `importers:`, which ends at the next key of the top level. A
   * blank line, whose indentation reads -1, stays in it.
   * @param {string} line - Line below `importers:`.
   * @returns {boolean} True for an indented or a blank line.
   */
  const isInsideSection = line => readIndentation(line) !== 0;
  const importerLines = takeLinesWhile({
    lines: lines.slice(importersIndex + 1),
    isKept: isInsideSection,
  });
  const packageIndex = importerLines.findIndex(line => readMappingKey(line) === name);
  if (packageIndex === -1) return undefined;

  const packageIndentation = readIndentation(importerLines[packageIndex]);
  /**
   * Whether a line belongs to the entry of the package, as its fields are indented deeper.
   * @param {string} line - Line below the key of the entry.
   * @returns {boolean} True for a line indented deeper than the key, false for a blank one.
   */
  const isNestedUnderEntry = line => readIndentation(line) > packageIndentation;
  const entryLines = takeLinesWhile({
    lines: importerLines.slice(packageIndex + 1),
    isKept: isNestedUnderEntry,
  });
  const versionGroups = entryLines
    .map(line => YAML_KEY_LINE_PATTERN.exec(line)?.groups)
    .find(groups => groups?.key === LOCKFILE_VERSION_KEY);
  const version = unquote(versionGroups?.value?.trim() ?? '')
    .replace(LOCKFILE_PEER_SUFFIX_PATTERN, '')
    .trim();
  return version || undefined;
};
