// @ts-check
import { FONT_STYLESHEET_PATTERN } from './constants.mjs';

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
 * Finds the Google Fonts style sheet that `index.html` loads, so a page that a script renders uses
 * the same fonts as the site.
 * @param {unknown} html - Content of `index.html`.
 * @returns {string} The URL of the style sheet, `&amp;` decoded, or `''` when there is none.
 */
export const findFontStylesheetUrl = html => {
  if (typeof html !== 'string') return '';

  const url = html.match(FONT_STYLESHEET_PATTERN)?.[1] ?? '';
  return url.replaceAll('&amp;', '&');
};
