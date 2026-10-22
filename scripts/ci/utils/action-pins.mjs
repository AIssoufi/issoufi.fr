// @ts-check
import {
  ACTION_VERSION_SEPARATOR,
  DOCKER_ACTION_PREFIX,
  DOCKER_DIGEST_PATTERN,
  GITHUB_ACTION_PREFIX,
  LOCAL_ACTION_PREFIX,
  USES_KEY,
} from '../constants.mjs';
import { isCommitSha } from './workflow-runs.mjs';
import { findKeyLines } from './yaml.mjs';

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
 * Reads the references of the `uses:` keys of a workflow or of an action, line by line, as
 * {@link findKeyLines} reads the keys: one per line, in block style, outside the block scalars,
 * such as the script of a `run: |` step. A key in quotes or in a flow mapping (`- { uses: … }`) is
 * not read.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {UsesReference[]} The references, in the order of the file.
 * @example
 * findUsesReferences('steps:\n  - uses: actions/checkout@v7 # v7\n');
 * // [{ line: 2, column: 5, reference: 'actions/checkout@v7' }]
 */
export const findUsesReferences = source =>
  findKeyLines(source)
    .filter(({ key }) => key === USES_KEY)
    .map(({ line, column, value }) => ({ line, column, reference: value }));

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
