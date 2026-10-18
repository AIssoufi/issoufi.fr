// @ts-check
import { findMissingFonts } from './fonts.mjs';

/**
 * Loads each font in the page, as the browser does before drawing a text in it.
 * @param {string[]} fonts - CSS fonts, e.g. `700 16px "Montserrat"`.
 * @returns {Promise<import('./fonts.mjs').FontCheck[]>} The number of faces loaded for each
 * font, 0 for a font whose files failed to download.
 */
const loadFonts = fonts =>
  Promise.all(
    fonts.map(async font => {
      // A face that fails to download rejects the promise: it counts as not loaded
      const faces = await document.fonts.load(font).catch(() => []);
      const loadedFaces = faces.filter(({ status }) => status === 'loaded');
      return { font, loadedFaceCount: loadedFaces.length };
    }),
  );

/**
 * Page of Playwright: only the method that runs a function in the browser is used.
 * @typedef {object} BrowserPage
 * @property {(callback: typeof loadFonts, fonts: string[]) => Promise<unknown>} evaluate - Runs
 * the callback in the page with the fonts, and gives what it returns.
 */

/**
 * Parameters of {@link checkFontsLoaded}.
 * @typedef {object} CheckFontsLoadedParams
 * @property {BrowserPage} page - Page of Chromium, its content already set.
 * @property {string[]} fonts - CSS fonts the page must have loaded, from `listFontsInUse`.
 */

/**
 * Makes sure that the page has loaded every font it uses, before a script saves it as an image
 * or a PDF, so that no text is drawn in a fallback font.
 * @param {CheckFontsLoadedParams} params
 * @returns {Promise<void>} Resolves once every font is loaded.
 * @throws {Error} When a font did not load, as when the network is down.
 * @example
 * await page.setContent(html, { waitUntil: 'networkidle' });
 * await checkFontsLoaded({ page, fonts: listFontsInUse({ theme, fontsInUse }) });
 */
export const checkFontsLoaded = async ({ page, fonts }) => {
  const fontChecks = await page.evaluate(loadFonts, fonts);
  const missingFonts = findMissingFonts(/** @type {unknown[]} */ (fontChecks));
  if (missingFonts.length > 0) {
    throw new Error(`Fonts not loaded, check the network: ${missingFonts.join(', ')}`);
  }
};
