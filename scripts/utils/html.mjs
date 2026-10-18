// @ts-check
import { extname } from 'node:path';

import { DATA_URL_MEDIA_TYPES } from './constants.mjs';

/** Words that a template literal writes for a missing value or a failed computation. */
const UNRESOLVED_VALUE_PATTERN = /\b(undefined|null|NaN)\b/;

/** Characters that HTML reads as markup, and the entity that writes each one as text. */
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapes a text for an HTML text node or a quoted attribute, so that a translation can never
 * break the markup of a page that a script renders.
 * @param {unknown} value - Text to escape. A value that is not a string gives an empty text.
 * @returns {string} The escaped text.
 * @example
 * escapeHtml('R&D <3'); // 'R&amp;D &lt;3'
 */
export const escapeHtml = value =>
  typeof value === 'string'
    ? value.replace(/[&<>"']/g, character => HTML_ENTITIES[/** @type {'&'} */ (character)])
    : '';

/**
 * Tells whether generated markup holds a value that was never resolved, such as a design token
 * renamed in the theme, which a template literal writes as `undefined`, or a computation on it,
 * which gives `NaN`. The browser would drop the style silently and draw a wrong page.
 * @param {unknown} markup - CSS or SVG built from the tokens. Keep data URLs out: their base64
 * may spell one of these words.
 * @returns {boolean} True when the markup contains `undefined`, `null` or `NaN` as a word, or when
 * it is not a string.
 * @example
 * hasUnresolvedValue('color: undefined;'); // true
 * hasUnresolvedValue('color: #ffffff;'); // false
 */
export const hasUnresolvedValue = markup =>
  typeof markup !== 'string' || UNRESOLVED_VALUE_PATTERN.test(markup);

/**
 * Parameters of {@link toDataUrl}.
 * @typedef {object} ToDataUrlParams
 * @property {Buffer} content - Content of the file.
 * @property {string} fileName - Name or path of the file, whose extension gives the media type.
 */

/**
 * Turns an image or a font file into a data URL, so the page rendered by Chromium, which is not
 * served from the project, can load it.
 * @param {ToDataUrlParams} params
 * @returns {string} The data URL, e.g. `data:image/webp;base64,UklGR…`.
 * @throws {RangeError} When the extension of the file is not one of {@link DATA_URL_MEDIA_TYPES}.
 * @example
 * toDataUrl({ content: readFileSync('public/home.webp'), fileName: 'public/home.webp' });
 */
export const toDataUrl = ({ content, fileName }) => {
  const extension = extname(fileName).toLowerCase();
  const mediaType = DATA_URL_MEDIA_TYPES[/** @type {keyof DATA_URL_MEDIA_TYPES} */ (extension)];
  if (!mediaType) throw new RangeError(`Unknown file type: ${fileName}`);

  return `data:${mediaType};base64,${content.toString('base64')}`;
};
