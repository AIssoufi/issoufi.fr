// @ts-check
import {
  ICON_ATTRIBUTES,
  SVG_CLOSING_TAG,
  SVG_OPENING_PATTERN,
  XML_PROLOG_AND_COMMENTS_PATTERN,
} from '../constants.mjs';

/**
 * Writes the content of an SVG file as an icon inside the page of the CV: without its XML
 * declaration and its comments, its root given the class of the icons and hidden from screen
 * readers, since the text next to it says what it shows.
 * @param {unknown} svg - Content of the SVG file.
 * @returns {string} The `svg` element, or `''` when the file holds no SVG drawing.
 * @example
 * toInlineIcon('<!-- Mail -->\n<svg viewBox="0 0 16 16"><path d="M1 1H15"/></svg>\n');
 * // '<svg class="icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M1 1H15"/></svg>'
 */
export const toInlineIcon = svg => {
  if (typeof svg !== 'string') return '';
  const drawing = svg.replace(XML_PROLOG_AND_COMMENTS_PATTERN, '').trim();
  const isSvgDrawing = SVG_OPENING_PATTERN.test(drawing) && drawing.endsWith(SVG_CLOSING_TAG);
  return isSvgDrawing ? drawing.replace(SVG_OPENING_PATTERN, `<svg ${ICON_ATTRIBUTES}`) : '';
};
