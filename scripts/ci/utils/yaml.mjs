// @ts-check
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  GITHUB_DIR,
  NON_BLANK_CHARACTER_PATTERN,
  TEXT_LINE_BREAK_PATTERN,
  YAML_BLOCK_SCALAR_PATTERN,
  YAML_COMMENT_PATTERN,
  YAML_FILE_PATTERN,
  YAML_KEY_LINE_PATTERN,
  YAML_QUOTED_SCALAR_PATTERN,
} from '../constants.mjs';
import {
  YAML_COMMENT_MARK_PATTERN,
  YAML_EMPTY_ITEM_LINE_PATTERN,
  YAML_SEQUENCE_ITEM_INDICATOR,
} from './constants.mjs';

/**
 * Key of a YAML block mapping, read from its line by {@link findKeyLines}.
 * @typedef {object} YamlKeyLine
 * @property {number} line - Line of the key, counted from 1.
 * @property {number} column - Column of the key, counted from 1. The keys of one mapping share it.
 * @property {string} key - Name of the key, e.g. `uses`.
 * @property {string} value - Value of the key without its quotes and its comment, e.g.
 * `actions/checkout@v7`. Empty when the value does not stand on the line of the key, as in a
 * block scalar (`run: |`), a nested mapping (`with:`) or on the next line.
 * @property {boolean} startsItem - True when the key opens an item of a sequence, as the first key
 * of a step does (`- uses: …`), also below a line that holds only the `-` of the item.
 * @property {string} comment - Text of the comment lines right above the key, then of the comment
 * at the end of its line, without their `#`, joined by spaces. Empty when the key has none.
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
 * Reads the text of a comment, without its `#` and the spaces around it.
 * @param {string} comment - Comment as the file writes it, e.g. ` # v5.0.0`.
 * @returns {string} The text, e.g. `v5.0.0`, empty for a `#` alone.
 */
const readCommentText = comment => comment.replace(YAML_COMMENT_MARK_PATTERN, '').trim();

/**
 * Reads the keys of the block mappings of a workflow or of an action, line by line. It reads a key
 * in block style, one per line, as the examples of GitHub, Dependabot and Prettier write them, and
 * skips the lines of a block scalar, such as the script of a `run: |` step. A key in quotes or in a
 * flow mapping (`- { uses: … }`) is not read.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {YamlKeyLine[]} The keys, in the order of the file.
 * @example
 * findKeyLines('steps:\n  # Gets the code\n  - uses: actions/checkout@v7 # v7\n');
 * // [{ line: 1, column: 1, key: 'steps', value: '', startsItem: false, comment: '' },
 * //  { line: 3, column: 5, key: 'uses', value: 'actions/checkout@v7', startsItem: true,
 * //    comment: 'Gets the code v7' }]
 */
export const findKeyLines = source => {
  const text = typeof source === 'string' ? source : '';
  /** @type {YamlKeyLine[]} */
  const keyLines = [];
  /**
   * Column of the key whose block scalar goes on in the lines indented further, if any.
   * @type {number | undefined}
   */
  let blockScalarKeyColumn;
  /**
   * Texts of the comment lines read since the last other line.
   * @type {string[]}
   */
  let commentsAbove = [];
  /**
   * Whether the last line that was neither blank nor a comment held only the indicator of a
   * sequence item, whose mapping then starts with the next key.
   * @type {boolean}
   */
  let isEmptyItemAbove = false;

  text.split(TEXT_LINE_BREAK_PATTERN).forEach((line, index) => {
    const indentation = line.search(NON_BLANK_CHARACTER_PATTERN);
    const isBlank = indentation === -1;
    const isInBlockScalar =
      blockScalarKeyColumn !== undefined && (isBlank || indentation > blockScalarKeyColumn);
    if (isInBlockScalar) return;

    blockScalarKeyColumn = undefined;
    if (YAML_COMMENT_MARK_PATTERN.test(line)) {
      commentsAbove.push(readCommentText(line));
      return;
    }

    const comments = commentsAbove;
    commentsAbove = [];
    if (isBlank) return;

    const followsEmptyItem = isEmptyItemAbove;
    isEmptyItemAbove = YAML_EMPTY_ITEM_LINE_PATTERN.test(line);
    const groups = YAML_KEY_LINE_PATTERN.exec(line)?.groups;
    if (!groups) return;

    const { prefix, key, value = '' } = groups;
    const [endComment] = value.match(YAML_COMMENT_PATTERN) ?? [];
    if (endComment) comments.push(readCommentText(endComment));
    const scalar = value.replace(YAML_COMMENT_PATTERN, '').trim();
    const startsBlockScalar = YAML_BLOCK_SCALAR_PATTERN.test(scalar);
    if (startsBlockScalar) blockScalarKeyColumn = prefix.length;

    keyLines.push({
      line: index + 1,
      column: prefix.length + 1,
      key,
      value: startsBlockScalar ? '' : unquote(scalar),
      startsItem: followsEmptyItem || prefix.includes(YAML_SEQUENCE_ITEM_INDICATOR),
      comment: comments.filter(Boolean).join(' '),
    });
  });

  return keyLines;
};
