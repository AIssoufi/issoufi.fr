// @ts-check
import { FONT_MEDIA_TYPE } from '../constants.mjs';

/**
 * Turns a font file into a data URL, so the page that Chromium prints, which is not served from
 * the project, can load it without network.
 * @param {Buffer} content - Content of a TrueType file of `CV_FONT_FILES`.
 * @returns {string} The data URL, e.g. `data:font/ttf;base64,AAEAAAAS…`.
 */
export const toFontDataUrl = content =>
  `data:${FONT_MEDIA_TYPE};base64,${content.toString('base64')}`;

/**
 * A file of a font, in one weight.
 * @typedef {object} FontFace
 * @property {unknown} weight - CSS weight of the file, e.g. `700`, from the `fontWeights` of the
 * theme.
 * @property {string} url - URL of the file, e.g. from {@link toFontDataUrl}.
 */

/**
 * Parameters of {@link renderFontFaces}.
 * @typedef {object} RenderFontFacesParams
 * @property {string} family - Family that the style sheet of the page names, e.g. `Montserrat`.
 * @property {FontFace[]} faces - File of each weight.
 */

/**
 * Writes the `@font-face` rules that give a page a font from its files, one rule per weight.
 * @param {RenderFontFacesParams} params
 * @returns {string} The rules, without those whose weight is not a number or whose URL is empty,
 * so that the check of the fonts that the page loaded names the missing weight.
 * @example
 * renderFontFaces({ family: 'Montserrat', faces: [{ weight: 400, url: 'data:font/ttf;base64,…' }] });
 * // '@font-face { font-family: "Montserrat"; font-style: normal; font-weight: 400; src: url("data:…") format("truetype"); }'
 */
export const renderFontFaces = ({ family, faces }) =>
  faces
    .filter(({ weight, url }) => Number.isFinite(weight) && url !== '')
    .map(
      ({ weight, url }) =>
        `@font-face { font-family: ${JSON.stringify(family)}; font-style: normal; font-weight: ${weight}; src: url(${JSON.stringify(url)}) format("truetype"); }`,
    )
    .join('\n');
