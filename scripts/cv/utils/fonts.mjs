// @ts-check
import { FONT_FORMAT_PATTERN, STATIC_FONT_FORMAT } from '../constants.mjs';

/**
 * Lists the formats of the font files of a style sheet, as its `@font-face` rules declare them.
 * @param {unknown} css - Style sheet of fonts, e.g. from Google Fonts.
 * @returns {string[]} The format of each file, in order, e.g. `['truetype', 'woff2']`, none when
 * the style sheet declares no format or is not a string.
 * @example
 * listFontFormats("src: url(a.ttf) format('truetype');"); // ['truetype']
 */
export const listFontFormats = css =>
  typeof css === 'string' ? [...css.matchAll(FONT_FORMAT_PATTERN)].map(([, format]) => format) : [];

/**
 * Tells whether a style sheet of Google Fonts holds only static TrueType files, which Chromium
 * embeds in a PDF as TrueType fonts, rather than the variable WOFF2 files that it sends to
 * browsers, which Chromium turns into Type 3 fonts that Preview and Safari cannot select.
 * @param {unknown} css - Style sheet of fonts.
 * @returns {boolean} True when it declares at least one file, and only in
 * {@link STATIC_FONT_FORMAT}.
 * @example
 * hasOnlyStaticFonts("src: url(a.woff2) format('woff2');"); // false
 */
export const hasOnlyStaticFonts = css => {
  const formats = listFontFormats(css);
  return formats.length > 0 && formats.every(format => format === STATIC_FONT_FORMAT);
};
