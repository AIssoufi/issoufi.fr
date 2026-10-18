// @ts-check
import {
  ANNOTATION_LEVELS,
  ANNOTATION_PROPERTY_NAME_PATTERN,
  WORKFLOW_COMMAND_ESCAPES,
  WORKFLOW_DATA_ESCAPE_PATTERN,
  WORKFLOW_PROPERTY_ESCAPE_PATTERN,
} from '../constants.mjs';

/**
 * Level of an annotation, one of {@link ANNOTATION_LEVELS}.
 * @typedef {(typeof ANNOTATION_LEVELS)[number]} AnnotationLevel
 */

/**
 * Parameters of {@link formatAnnotation} and {@link writeAnnotation}.
 * @typedef {object} FormatAnnotationParams
 * @property {AnnotationLevel} level - Level of the annotation: `error`, `warning` or `notice`.
 * @property {unknown} [message] - Text of the annotation, on any number of lines. A missing
 * message gives an empty annotation.
 * @property {Record<string, unknown>} [properties] - Properties of the annotation, by name, such
 * as the `file` it points to or its `title`. A property whose value is missing or empty is left
 * out. Each name must match {@link ANNOTATION_PROPERTY_NAME_PATTERN}, as GitHub's names do.
 */

/**
 * Writes the character that a workflow command cannot hold as is, as its percent-encoding.
 * @param {string} character - One of the keys of {@link WORKFLOW_COMMAND_ESCAPES}.
 * @returns {string} The encoded character, e.g. `%0A` for a line feed.
 */
const escapeCharacter = character =>
  WORKFLOW_COMMAND_ESCAPES[/** @type {keyof WORKFLOW_COMMAND_ESCAPES} */ (character)];

/**
 * Tells whether a name can be written as is before the `=` of a property of an annotation.
 * @param {string} name - Name of the property, e.g. `file`.
 * @returns {boolean} True when it matches {@link ANNOTATION_PROPERTY_NAME_PATTERN}.
 */
const isValidPropertyName = name => ANNOTATION_PROPERTY_NAME_PATTERN.test(name);

/**
 * Escapes the message of a workflow command of GitHub Actions, such as the text of an annotation,
 * so that a line break cannot end the command and a `%` is not read as an encoding. GitHub
 * decodes the message, so a line break still shows as a new line.
 * @param {unknown} value - Message to escape. `undefined` and `null` give an empty text, and any
 * other value its text.
 * @returns {string} The escaped message.
 * @example
 * escapeWorkflowData('100% done\nNext'); // '100%25 done%0ANext'
 */
export const escapeWorkflowData = value =>
  String(value ?? '').replace(WORKFLOW_DATA_ESCAPE_PATTERN, escapeCharacter);

/**
 * Escapes the value of a property of a workflow command of GitHub Actions, such as the `file` of
 * an annotation, so that a `:` or a `,` cannot end the property, besides the characters that
 * {@link escapeWorkflowData} escapes.
 * @param {unknown} value - Value to escape. `undefined` and `null` give an empty text, and any
 * other value its text.
 * @returns {string} The escaped value.
 * @example
 * escapeWorkflowProperty('public/a,b.pdf'); // 'public/a%2Cb.pdf'
 */
export const escapeWorkflowProperty = value =>
  String(value ?? '').replace(WORKFLOW_PROPERTY_ESCAPE_PATTERN, escapeCharacter);

/**
 * Builds the workflow command of an annotation of GitHub Actions, with its properties and its
 * message escaped.
 * @param {FormatAnnotationParams} params
 * @returns {string} The command, e.g. `::warning file=public/cv.pdf::cv.pdf weighs 612.4 kB`.
 * @throws {RangeError} When the level is not one of {@link ANNOTATION_LEVELS}, or a property name
 * does not match {@link ANNOTATION_PROPERTY_NAME_PATTERN}, since a name is written as is.
 * @example
 * formatAnnotation({ level: 'error', message: 'dist/ not found' }); // '::error::dist/ not found'
 */
export const formatAnnotation = ({ level, message, properties }) => {
  const isKnownLevel = ANNOTATION_LEVELS.includes(level);
  if (!isKnownLevel) throw new RangeError(`Unknown annotation level: ${String(level)}`);

  const hasProperties = typeof properties === 'object' && properties !== null;
  const entries = Object.entries(hasProperties ? properties : {});
  const invalidName = entries.map(([name]) => name).find(name => !isValidPropertyName(name));
  if (invalidName !== undefined) {
    throw new RangeError(`Invalid annotation property name: "${invalidName}"`);
  }

  const settings = entries
    .map(([name, value]) => ({ name, value: escapeWorkflowProperty(value) }))
    .filter(({ value }) => value !== '')
    .map(({ name, value }) => `${name}=${value}`)
    .join(',');
  const command = settings === '' ? level : `${level} ${settings}`;

  return `::${command}::${escapeWorkflowData(message)}`;
};

/**
 * Writes an annotation to the log of GitHub Actions, which shows it on the run and on the pull
 * request. Outside GitHub Actions, the command is printed as is.
 * @param {FormatAnnotationParams} params
 * @throws {RangeError} When the level or a property name is invalid, as for
 * {@link formatAnnotation}.
 * @example
 * writeAnnotation({ level: 'warning', message, properties: { file: 'public/cv.pdf' } });
 */
export const writeAnnotation = params => {
  console.log(formatAnnotation(params));
};
