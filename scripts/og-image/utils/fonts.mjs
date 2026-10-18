// @ts-check
import { FONT_CHECK_SIZE_PX, FONTS_IN_USE } from '../constants.mjs';

/** @typedef {import('./template.mjs').OgImageTheme} OgImageTheme */

/**
 * Result of loading one font in the page.
 * @typedef {object} FontCheck
 * @property {string} font - CSS font that was loaded, e.g. `700 16px "Montserrat"`.
 * @property {number} loadedFaceCount - Number of its font faces that finished loading, 0 when
 * none matches or every one failed.
 */

/** Name reported for an entry of the font checks that is not a font check. */
const UNKNOWN_FONT = 'unknown font';

/** Quotes that may surround a font family name in CSS. */
const FAMILY_QUOTES_PATTERN = /^['"]|['"]$/g;

/**
 * Removes the quotes and the spaces around a font family name.
 * @param {string} family - Family name, e.g. `'Saira Stencil One'`.
 * @returns {string} The bare name, e.g. `Saira Stencil One`.
 */
const unquoteFamily = family => family.trim().replace(FAMILY_QUOTES_PATTERN, '');

/**
 * Reads the font the site asks for first in a font stack, the one served from `public/fonts/`.
 * @param {unknown} stack - CSS font stack, e.g. `'Montserrat', -apple-system, sans-serif`.
 * @returns {string} The first family, without quotes, or `''` when the value is not a string.
 * @example
 * getFirstFontFamily("'Saira Stencil One', cursive"); // 'Saira Stencil One'
 */
export const getFirstFontFamily = stack =>
  typeof stack === 'string' ? unquoteFamily(stack.split(',')[0]) : '';

/**
 * Lists the fonts that the page of the image uses, each family of {@link FONTS_IN_USE} in each of
 * its weights, as CSS fonts that `document.fonts.load` takes.
 * @param {OgImageTheme} theme - Design tokens of the site, for the font stacks and weights.
 * @returns {string[]} The fonts, e.g. `700 16px "Montserrat"`, without those whose family or
 * weight is missing from the theme.
 * @example
 * listFontsInUse(theme); // ['400 16px "Montserrat"', …, '400 16px "Saira Stencil One"']
 */
export const listFontsInUse = theme =>
  FONTS_IN_USE.flatMap(({ font, weights }) => {
    const family = getFirstFontFamily(theme.fonts[font]);
    if (!family) return [];

    return weights
      .map(weight => theme.fontWeights[weight])
      .filter(Number.isFinite)
      .map(weight => `${weight} ${FONT_CHECK_SIZE_PX}px "${family}"`);
  });

/**
 * Tells whether a font check found no loaded face, as when its file failed to download.
 * @param {unknown} check - Result of loading a font in the page.
 * @returns {boolean} True for a check without a loaded face, and for a value that is not a
 * font check.
 */
const isMissingFont = check => {
  const isObject = typeof check === 'object' && check !== null;
  if (!isObject) return true;

  const { loadedFaceCount } = /** @type {Record<string, unknown>} */ (check);
  const hasLoadedFace = typeof loadedFaceCount === 'number' && loadedFaceCount > 0;
  return !hasLoadedFace;
};

/**
 * Lists the fonts that did not load in the page, so the script stops instead of drawing the
 * texts in a fallback or a synthesized bold font, as when its file is missing or is not a font.
 * @param {unknown[]} [checks] - Results of loading each font, from the page. A value that is not
 * an array counts as no checks.
 * @returns {string[]} The fonts without a loaded face, in the order given, `unknown font` for an
 * entry that is not a font check.
 * @example
 * findMissingFonts([
 *   { font: '400 16px "Montserrat"', loadedFaceCount: 1 },
 *   { font: '700 16px "Montserrat"', loadedFaceCount: 0 },
 * ]); // ['700 16px "Montserrat"']
 */
export const findMissingFonts = checks => {
  const list = Array.isArray(checks) ? checks : [];

  return list.filter(isMissingFont).map(check => {
    const font = /** @type {{ font?: unknown } | null} */ (check)?.font;
    return typeof font === 'string' ? font : UNKNOWN_FONT;
  });
};
