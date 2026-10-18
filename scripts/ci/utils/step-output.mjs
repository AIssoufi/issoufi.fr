// @ts-check
import { appendFileSync } from 'node:fs';

import { LINE_BREAK_PATTERN } from '../constants.mjs';

/**
 * Parameters of {@link setStepOutput}.
 * @typedef {object} SetStepOutputParams
 * @property {string} name - Name of the output, read by the next steps as
 * `steps.<step id>.outputs.<name>`.
 * @property {string} [value] - Value of the output, on a single line. Defaults to an empty
 * string, which a step condition reads like a missing output.
 * @property {string} [outputFile] - File GitHub Actions reads the step outputs from. Defaults to
 * the `GITHUB_OUTPUT` environment variable.
 */

/**
 * Sets an output of the current GitHub Actions step, or prints it outside GitHub Actions, so
 * that the scripts also work locally.
 * @param {SetStepOutputParams} params
 * @throws {Error} When the name is empty, or when the name or the value holds a line break,
 * which would let the value write other outputs.
 * @example
 * setStepOutput({ name: 'due', value: 'true' }); // Adds `due=true` to the file of GITHUB_OUTPUT
 */
export const setStepOutput = ({ name, value = '', outputFile = process.env.GITHUB_OUTPUT }) => {
  const hasName = typeof name === 'string' && name !== '';
  if (!hasName) throw new Error('A step output needs a name');

  const line = `${name}=${value}`;
  const isSingleLine = !LINE_BREAK_PATTERN.test(line);
  if (!isSingleLine) throw new Error(`The step output "${name}" must hold a single line`);

  if (outputFile) appendFileSync(outputFile, `${line}\n`);
  else console.log(line);
};
