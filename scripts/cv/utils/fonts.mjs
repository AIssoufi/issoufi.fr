// @ts-check
import { FONT_FORMAT } from '../constants.mjs';

/**
 * A file of a font of the CV, in one weight.
 * @typedef {object} CvFontFile
 * @property {unknown} weight - CSS weight of the file, e.g. `700`, from the `fontWeights` of the
 * theme.
 * @property {string} url - URL of the file, e.g. a data URL from `toDataUrl`
 * (`scripts/utils/html.mjs`).
 */

/**
 * Parameters of {@link renderFontFaces}.
 * @typedef {object} RenderFontFacesParams
 * @property {string} family - Family that the style sheet of the page names, e.g. `Montserrat`.
 * @property {CvFontFile[]} faces - File of each weight.
 */

/**
 * Tells whether a file of a font can give a rule: it has a numeric weight and a URL.
 * @param {CvFontFile} face - File of the font.
 * @returns {boolean} False for a weight that is not a number, as a weight missing from the
 * theme, or for an empty URL.
 */
const isLoadableFace = ({ weight, url }) => Number.isFinite(weight) && url !== '';

/**
 * Writes the `@font-face` rules that give a page a font from its files, one rule per weight.
 * @param {RenderFontFacesParams} params
 * @returns {string} The rules, without those whose weight is not a number or whose URL is empty,
 * so that the check of the fonts that the page loaded names the missing weight.
 * @example
 * renderFontFaces({
 *   family: 'Montserrat',
 *   faces: [{ weight: 400, url: 'data:font/ttf;base64,…' }],
 * });
 * // '@font-face { font-family: "Montserrat"; … font-weight: 400; src: url("data:…") … }'
 */
export const renderFontFaces = ({ family, faces }) =>
  faces
    .filter(isLoadableFace)
    .map(({ weight, url }) => {
      const declarations = [
        `font-family: ${JSON.stringify(family)};`,
        'font-style: normal;',
        `font-weight: ${weight};`,
        `src: url(${JSON.stringify(url)}) format("${FONT_FORMAT}");`,
      ];
      return `@font-face { ${declarations.join(' ')} }`;
    })
    .join('\n');
