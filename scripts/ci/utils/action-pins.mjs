// @ts-check
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  ACTION_VERSION_SEPARATOR,
  DOCKER_ACTION_PREFIX,
  DOCKER_DIGEST_PATTERN,
  GITHUB_ACTION_PREFIX,
  GITHUB_DIR,
  LOCAL_ACTION_PREFIX,
  NON_BLANK_CHARACTER_PATTERN,
  TEXT_LINE_BREAK_PATTERN,
  USES_KEY,
  YAML_BLOCK_SCALAR_PATTERN,
  YAML_COMMENT_PATTERN,
  YAML_FILE_PATTERN,
  YAML_KEY_LINE_PATTERN,
  YAML_QUOTED_SCALAR_PATTERN,
} from '../constants.mjs';
import { isCommitSha } from './workflow-runs.mjs';

/**
 * Reference read from a `uses:` key of a workflow or of an action.
 * @typedef {object} UsesReference
 * @property {number} line - Line of the key, counted from 1.
 * @property {number} column - Column of the key, counted from 1.
 * @property {string} reference - Value of the key without its quotes and its comment, e.g.
 * `actions/checkout@v7`. Empty when the value does not stand on the line of the key, as in a block
 * scalar (`uses: >-`) or on the next line.
 */

/**
 * Tells whether an entry of a folder is a YAML file, and not a folder named like one.
 * @param {import('node:fs').Dirent} entry - Entry that `readdirSync` gives with `withFileTypes`.
 * @returns {boolean} True for a file whose name ends with `.yml` or `.yaml`.
 */
const isYamlFile = entry => entry.isFile() && YAML_FILE_PATTERN.test(entry.name);

/**
 * Lists the YAML files of a folder and of its subfolders, such as the workflows and the
 * `action.yml` of each action of the repository.
 * @param {string} [directory] - Folder to read, relative to the current folder. Defaults to
 * {@link GITHUB_DIR}.
 * @returns {string[]} The paths of the files, starting with the folder, in alphabetical order.
 * @throws {Error} When the folder cannot be read, e.g. `ENOENT` when it does not exist.
 * @example
 * listYamlFiles(); // ['.github/actions/setup/action.yml', '.github/workflows/ci.yml', …]
 */
export const listYamlFiles = (directory = GITHUB_DIR) =>
  readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(isYamlFile)
    .map(entry => join(entry.parentPath, entry.name))
    .sort();

/**
 * Removes the quotes around a YAML scalar.
 * @param {string} value - Scalar as the file writes it, e.g. `'owner/repo@v1'`.
 * @returns {string} The text between the quotes, or the value itself when it has none.
 */
const unquote = value => value.replace(YAML_QUOTED_SCALAR_PATTERN, '$2');

/**
 * Reads the references of the `uses:` keys of a workflow or of an action, line by line. It reads
 * a key in block style, one per line, as the examples of GitHub, Dependabot and Prettier write
 * them, and skips the lines of a block scalar, such as the script of a `run: |` step. A key in
 * quotes or in a flow mapping (`- { uses: … }`) is not read.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {UsesReference[]} The references, in the order of the file.
 * @example
 * findUsesReferences('steps:\n  - uses: actions/checkout@v7 # v7\n');
 * // [{ line: 2, column: 5, reference: 'actions/checkout@v7' }]
 */
export const findUsesReferences = source => {
  const text = typeof source === 'string' ? source : '';
  /** @type {UsesReference[]} */
  const references = [];
  /**
   * Column of the key whose block scalar goes on in the lines indented further, if any.
   * @type {number | undefined}
   */
  let blockScalarKeyColumn;

  text.split(TEXT_LINE_BREAK_PATTERN).forEach((line, index) => {
    const indentation = line.search(NON_BLANK_CHARACTER_PATTERN);
    const isBlank = indentation === -1;
    const isInBlockScalar =
      blockScalarKeyColumn !== undefined && (isBlank || indentation > blockScalarKeyColumn);
    if (isInBlockScalar) return;

    blockScalarKeyColumn = undefined;
    const groups = YAML_KEY_LINE_PATTERN.exec(line)?.groups;
    if (!groups) return;

    const { prefix, key, value = '' } = groups;
    const scalar = value.replace(YAML_COMMENT_PATTERN, '').trim();
    const startsBlockScalar = YAML_BLOCK_SCALAR_PATTERN.test(scalar);
    if (startsBlockScalar) blockScalarKeyColumn = prefix.length;
    if (key !== USES_KEY) return;

    references.push({
      line: index + 1,
      column: prefix.length + 1,
      reference: startsBlockScalar ? '' : unquote(scalar),
    });
  });

  return references;
};

/**
 * Tells whether a reference names an action or a reusable workflow at the SHA of a commit, after
 * its last `@`.
 * @param {string} reference - Reference of the `uses:` key, e.g. `owner/repo@<SHA>`.
 * @returns {boolean} False for a tag, a branch, a short or uppercase SHA, and no `@` at all.
 */
const isPinnedByCommitSha = reference => {
  const separatorIndex = reference.lastIndexOf(ACTION_VERSION_SEPARATOR);
  const hasVersion = separatorIndex !== -1;
  return hasVersion && isCommitSha(reference.slice(separatorIndex + 1));
};

/**
 * Tells why the reference of a `uses:` key lets a job run other code with no change in this
 * repository: an action of a third party or a reusable workflow referenced by a tag or a branch,
 * which their owner can move, rather than by the SHA of a commit, or a Docker image by a tag
 * rather than by its digest (ADR 0019).
 * @param {unknown} reference - Value of the `uses:` key, e.g. `cloudflare/wrangler-action@v4`.
 * An empty text, or any value that is not a text, gives the reason that the key holds none.
 * @returns {string | undefined} The reason, or `undefined` for an action of GitHub (`actions/*`,
 * which keeps its major tag), an action or a workflow of this repository (`./`), a reference
 * pinned by the SHA of a commit, and a Docker image pinned by its digest.
 * @example
 * describePinProblem('actions/checkout@v7'); // undefined
 * describePinProblem('cloudflare/wrangler-action@v4');
 * // 'cloudflare/wrangler-action@v4 is not pinned: …'
 */
export const describePinProblem = reference => {
  const value = typeof reference === 'string' ? reference.trim() : '';
  if (value === '') {
    return 'This uses: key holds no reference on its line: write the action there, pinned by the SHA of a commit, so that the check can read it.';
  }

  const isLocal = value.startsWith(LOCAL_ACTION_PREFIX);
  const isGitHubAction = value.toLowerCase().startsWith(GITHUB_ACTION_PREFIX);
  if (isLocal || isGitHubAction) return undefined;

  if (value.startsWith(DOCKER_ACTION_PREFIX)) {
    if (DOCKER_DIGEST_PATTERN.test(value)) return undefined;
    return `${value} is not pinned: reference the image by the SHA-256 digest of its content (docker://<image>@sha256:<digest>), since the owner of a tag can move it.`;
  }

  if (isPinnedByCommitSha(value)) return undefined;
  return `${value} is not pinned: reference an action of a third party by the 40-character SHA of a commit, its version in a comment (owner/repo@<SHA> # v1.2.3), since the owner of a tag can move it.`;
};
