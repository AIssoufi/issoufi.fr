// @ts-check
import { USES_KEY } from '../constants.mjs';
import {
  CHECKOUT_ACTION_PATTERN,
  CREDENTIALS_DROPPED_VALUE,
  CREDENTIALS_KEPT_VALUE,
  PERSIST_CREDENTIALS_INPUT,
  STEP_INPUTS_KEY,
} from './constants.mjs';
import { findKeyLines } from './yaml.mjs';

/** @typedef {import('./yaml.mjs').YamlKeyLine} YamlKeyLine */

/**
 * Step of a workflow or of an action that runs `actions/checkout`, read by
 * {@link findCheckoutSteps}.
 * @typedef {object} CheckoutStep
 * @property {number} line - Line of its `uses:` key, counted from 1.
 * @property {number} column - Column of its `uses:` key, counted from 1.
 * @property {YamlKeyLine | undefined} persistCredentials - Its `persist-credentials` input, right
 * under its `with:` key, or `undefined` when it sets none.
 */

/**
 * Parameters of the helpers that place a key in a mapping, such as a step.
 * @typedef {object} MappingKeyLineParams
 * @property {YamlKeyLine} keyLine - Key to place.
 * @property {number} column - Column of the keys of the mapping.
 */

/**
 * Parameters of {@link findStepKeyLines}.
 * @typedef {object} FindStepKeyLinesParams
 * @property {YamlKeyLine[]} keyLines - Keys of the file, as {@link findKeyLines} reads them.
 * @property {number} index - Index in `keyLines` of a key of the step.
 */

/**
 * Parameters of {@link findPersistCredentialsInput}.
 * @typedef {object} FindPersistCredentialsInputParams
 * @property {YamlKeyLine[]} stepKeyLines - Keys of the step and the keys nested under them.
 * @property {number} column - Column of the keys of the step.
 */

/**
 * End of the messages of {@link describeCredentialsProblem}: the two settings that a checkout
 * step may write.
 */
const CREDENTIALS_FIX = [
  `write ${PERSIST_CREDENTIALS_INPUT}: ${CREDENTIALS_DROPPED_VALUE} under ${STEP_INPUTS_KEY}:,`,
  `or ${CREDENTIALS_KEPT_VALUE} with a comment, on its line or right above it,`,
  'that names the later step that uses git with the credentials.',
].join(' ');

/**
 * Tells whether a key opens the item of a sequence whose mapping holds its keys at a column, as the
 * first key of a step does (`- uses: …`).
 * @param {MappingKeyLineParams} params - The key and the column of the mapping.
 * @returns {boolean} True for the first key of the item.
 */
const opensItem = ({ keyLine, column }) => keyLine.startsItem && keyLine.column === column;

/**
 * Tells whether a key that follows the first one of a mapping still belongs to it: one of its
 * keys, or a key nested under them, but not the first key of the next item of the sequence.
 * @param {MappingKeyLineParams} params - The key and the column of the mapping.
 * @returns {boolean} True for a key of the mapping or nested under it.
 */
const continuesMapping = ({ keyLine, column }) => {
  const isNested = keyLine.column > column;
  const isOwnKey = keyLine.column === column && !keyLine.startsItem;
  return isNested || isOwnKey;
};

/**
 * Reads the keys of the step that holds a key: its own keys, before and after it, and those
 * nested under them.
 * @param {FindStepKeyLinesParams} params - The keys of the file and the index of the key.
 * @returns {YamlKeyLine[]} The keys of the step, in the order of the file.
 */
const findStepKeyLines = ({ keyLines, index }) => {
  const { column } = keyLines[index];
  let start = index;
  while (start > 0) {
    if (opensItem({ keyLine: keyLines[start], column })) break;
    const isPreviousInStep = keyLines[start - 1].column >= column;
    if (!isPreviousInStep) break;
    start -= 1;
  }

  let end = index + 1;
  while (end < keyLines.length && continuesMapping({ keyLine: keyLines[end], column })) end += 1;
  return keyLines.slice(start, end);
};

/**
 * Finds the `persist-credentials` input of a step among the keys right under its `with:` key.
 * @param {FindPersistCredentialsInputParams} params - The keys of the step and their column.
 * @returns {YamlKeyLine | undefined} The input, or `undefined` when the step sets none.
 */
const findPersistCredentialsInput = ({ stepKeyLines, column }) => {
  /** @param {YamlKeyLine} keyLine */
  const isInputsKey = keyLine => keyLine.key === STEP_INPUTS_KEY && keyLine.column === column;
  const inputsIndex = stepKeyLines.findIndex(isInputsKey);
  if (inputsIndex === -1) return undefined;

  const keyLinesAfterInputs = stepKeyLines.slice(inputsIndex + 1);
  /** @param {YamlKeyLine} keyLine */
  const isNextKeyOfStep = keyLine => keyLine.column <= column;
  const inputsEnd = keyLinesAfterInputs.findIndex(isNextKeyOfStep);
  const inputs = keyLinesAfterInputs.slice(0, inputsEnd === -1 ? undefined : inputsEnd);
  const inputColumn = inputs[0]?.column;
  /** @param {YamlKeyLine} keyLine */
  const isPersistCredentialsInput = keyLine =>
    keyLine.key === PERSIST_CREDENTIALS_INPUT && keyLine.column === inputColumn;
  return inputs.find(isPersistCredentialsInput);
};

/**
 * Reads the steps of a workflow or of an action that run `actions/checkout`, with their
 * `persist-credentials` input, as {@link findKeyLines} reads the keys: one per line, in block
 * style, outside the block scalars. An input in a flow mapping (`with: { … }`) is not read.
 * @param {unknown} source - Text of the YAML file. Any value that is not a text counts as an empty
 * file.
 * @returns {CheckoutStep[]} The checkout steps, in the order of the file.
 * @example
 * findCheckoutSteps(
 *   'steps:\n  - uses: actions/checkout@v7\n    with:\n      persist-credentials: false\n',
 * );
 * // [{ line: 2, column: 5, persistCredentials: { line: 4, value: 'false', … } }]
 */
export const findCheckoutSteps = source => {
  const keyLines = findKeyLines(source);
  return keyLines.flatMap((keyLine, index) => {
    const isCheckout = keyLine.key === USES_KEY && CHECKOUT_ACTION_PATTERN.test(keyLine.value);
    if (!isCheckout) return [];

    const stepKeyLines = findStepKeyLines({ keyLines, index });
    const { line, column } = keyLine;
    const persistCredentials = findPersistCredentialsInput({ stepKeyLines, column });
    return [{ line, column, persistCredentials }];
  });
};

/**
 * Tells why a checkout step keeps the token of its job, or its SSH key, in the git config for
 * every later step of the job without saying why: it sets no `persist-credentials` input, which
 * defaults to true, sets it to true without a comment, or to a value that is neither false nor
 * true, such as an expression.
 * @param {CheckoutStep | undefined} step - Checkout step, as {@link findCheckoutSteps} reads it. A
 * missing step, or one whose input holds no text, counts as one without the input.
 * @returns {string | undefined} The reason, or `undefined` for a step that sets
 * `persist-credentials: false`, or `true` with a comment, on its line or right above it. The
 * value is read in any case, as `actions/checkout` reads it.
 * @example
 * describeCredentialsProblem({ line: 2, column: 5, persistCredentials: undefined });
 * // 'This checkout keeps the token of its job, or its SSH key, in the git config … credentials.'
 */
export const describeCredentialsProblem = step => {
  const input = step?.persistCredentials;
  const value = typeof input?.value === 'string' ? input.value : undefined;
  if (value === undefined) {
    return [
      'This checkout keeps the token of its job, or its SSH key, in the git config for every',
      `later step of the job: ${CREDENTIALS_FIX}`,
    ].join(' ');
  }

  const setting = value.toLowerCase();
  if (setting === CREDENTIALS_DROPPED_VALUE) return undefined;
  if (setting !== CREDENTIALS_KEPT_VALUE) {
    const shownValue = value || '(no value on its line)';
    return [
      `${PERSIST_CREDENTIALS_INPUT}: ${shownValue} is neither ${CREDENTIALS_DROPPED_VALUE}`,
      `nor ${CREDENTIALS_KEPT_VALUE}, so the check cannot tell whether the checkout keeps the`,
      `credentials: ${CREDENTIALS_FIX}`,
    ].join(' ');
  }

  const isExplained = typeof input?.comment === 'string' && input.comment.trim() !== '';
  if (isExplained) return undefined;
  return [
    `${PERSIST_CREDENTIALS_INPUT}: ${CREDENTIALS_KEPT_VALUE} keeps the credentials in the git`,
    'config for every later step of the job without saying why: name, in a comment on its line',
    'or right above it, the later step that uses git with them,',
    `or write ${CREDENTIALS_DROPPED_VALUE}.`,
  ].join(' ');
};
