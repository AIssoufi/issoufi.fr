// @ts-check
// Regenerates the link preview image of each language, public/og-image.jpg in French and
// public/og-image-en.jpg in English (`OG_IMAGE_PATHS` of src/utils/pages.ts), from the texts of the
// home page in that language, the design tokens, the background photo and the particle field of
// the home page: run `pnpm og-image` after changing one of them. Chromium, from Playwright,
// renders each image and saves it as a JPEG. It needs the network, for the Google Fonts of the
// site.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';
import { createServer } from 'vite';

import {
  INDEX_HTML_FILE,
  OG_IMAGE_HEIGHT_PX,
  OG_IMAGE_JPEG_QUALITY,
  OG_IMAGE_MAX_BYTES,
  OG_IMAGE_WIDTH_PX,
  PARTICLE_SEED,
  PUBLIC_DIR,
  SOURCE_MODULES,
  TRANSLATION_MODULES,
} from './constants.mjs';
import { findMissingFonts, listFontsInUse } from './utils/fonts.mjs';
import { findDotLinks, renderParticlesSvg } from './utils/particles.mjs';
import { createSeededRandom } from './utils/random.mjs';
import { findFontStylesheetUrl, hasUnresolvedValue, toImageDataUrl } from './utils/html.mjs';
import { renderOgImageHtml, renderOgImageStyles } from './utils/template.mjs';
import { findMissingTexts, getOgImageTexts } from './utils/texts.mjs';

/**
 * Modules of the site loaded by {@link loadSourceModules}: the exports of each module, by name.
 * @typedef {object} SourceModules
 * @property {Record<keyof typeof SOURCE_MODULES, Record<string, any>>} sources - Modules of
 * {@link SOURCE_MODULES}.
 * @property {Record<string, Record<string, any>>} translations - Modules of
 * {@link TRANSLATION_MODULES}, by language.
 */

/**
 * Loads the TypeScript modules of the site listed in {@link SOURCE_MODULES} and
 * {@link TRANSLATION_MODULES}, compiled by Vite.
 * @returns {Promise<SourceModules>} The exports of each module.
 */
const loadSourceModules = async () => {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    // Nothing is served to a browser, so there are no dependencies to prebundle
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
  });

  /**
   * Loads each module of a list.
   * @param {Record<string, string>} ids - Path of each module, by name.
   * @returns {Promise<Record<string, Record<string, any>>>} The exports of each module, by name.
   */
  const loadModules = async ids => {
    const modules = await Promise.all(
      Object.entries(ids).map(async ([name, id]) => [name, await server.ssrLoadModule(id)]),
    );
    return Object.fromEntries(modules);
  };

  try {
    return {
      sources: await loadModules(SOURCE_MODULES),
      translations: await loadModules(TRANSLATION_MODULES),
    };
  } finally {
    await server.close();
  }
};

/**
 * Parameters of {@link takeScreenshot}.
 * @typedef {object} TakeScreenshotParams
 * @property {string} html - Page to render, from `renderOgImageHtml`.
 * @property {string[]} fonts - CSS fonts the page must load before the screenshot, from
 * `listFontsInUse`.
 */

/**
 * Renders the page in Chromium at the size of the image, once its fonts are loaded.
 * @param {TakeScreenshotParams} params
 * @returns {Promise<Buffer>} The screenshot, as a JPEG file.
 * @throws {Error} When a font did not load, as when the network is down.
 */
const takeScreenshot = async ({ html, fonts }) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: OG_IMAGE_WIDTH_PX, height: OG_IMAGE_HEIGHT_PX },
      // One pixel of the image per CSS pixel, whatever the screen of the machine
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: 'networkidle' });
    const fontChecks = await page.evaluate(
      fontsToLoad =>
        Promise.all(
          fontsToLoad.map(async font => {
            // A face that fails to download rejects the promise: it counts as not loaded
            const faces = await document.fonts.load(font).catch(() => []);
            const loadedFaces = faces.filter(({ status }) => status === 'loaded');
            return { font, loadedFaceCount: loadedFaces.length };
          }),
        ),
      fonts,
    );
    const missingFonts = findMissingFonts(fontChecks);
    if (missingFonts.length > 0) {
      throw new Error(`Fonts not loaded, check the network: ${missingFonts.join(', ')}`);
    }

    return await page.screenshot({ type: 'jpeg', quality: OG_IMAGE_JPEG_QUALITY });
  } finally {
    await browser.close();
  }
};

const { sources, translations } = await loadSourceModules();
const { theme } = sources.theme;
const particles = { ...sources.particleConstants, ...sources.particleUtils };

/** @type {Record<string, string>} */
const imagePaths = sources.pages.OG_IMAGE_PATHS;
const images = Object.entries(imagePaths).map(([language, imagePath]) => ({
  language,
  fileName: join(PUBLIC_DIR, imagePath),
  texts: getOgImageTexts({
    // Each module of translations exports them under the code of its language
    translations: translations[language]?.[language],
    siteUrl: sources.pages.SITE_URL,
  }),
}));
images.forEach(({ language, texts }) => {
  const missingTexts = findMissingTexts(texts);
  if (missingTexts.length > 0) {
    throw new Error(`Texts missing from the ${language} translations: ${missingTexts.join(', ')}`);
  }
});

const fontStylesheetUrl = findFontStylesheetUrl(readFileSync(INDEX_HTML_FILE, 'utf-8'));
if (!fontStylesheetUrl) throw new Error(`No Google Fonts style sheet in ${INDEX_HTML_FILE}`);

const backgroundImageFile = join(PUBLIC_DIR, sources.home.BACKGROUND_IMAGE_URL);
const backgroundImageUrl = toImageDataUrl({
  content: readFileSync(backgroundImageFile),
  fileName: backgroundImageFile,
});
const dots = particles.createParticles({
  width: OG_IMAGE_WIDTH_PX,
  height: OG_IMAGE_HEIGHT_PX,
  random: createSeededRandom(PARTICLE_SEED),
});

const styles = renderOgImageStyles(theme);
const particlesSvg = renderParticlesSvg({
  width: OG_IMAGE_WIDTH_PX,
  height: OG_IMAGE_HEIGHT_PX,
  dots,
  links: findDotLinks({
    dots,
    getLinkStrength: particles.getLinkStrength,
    maxDistance: particles.LINK_DISTANCE_PX,
  }),
  dotColor: particles.PARTICLE_COLOR,
  linkRgb: particles.LINK_RGB,
  linkMaxOpacity: particles.LINK_MAX_OPACITY,
  linkMaxWidth: particles.LINK_MAX_WIDTH_PX,
});
// The theme and the particle settings are read untyped: a renamed one shows as undefined or NaN
if (hasUnresolvedValue(styles)) throw new Error('A design token of the image is missing');
if (hasUnresolvedValue(particlesSvg)) throw new Error('A setting of the particles is missing');

/** @type {{ fileName: string, file: Buffer }[]} */
const files = [];
// One after the other, so that only one Chromium runs at a time
for (const { language, fileName, texts } of images) {
  const html = renderOgImageHtml({
    language,
    texts,
    styles,
    backgroundImageUrl,
    fontStylesheetUrl,
    particlesSvg,
  });
  const file = await takeScreenshot({ html, fonts: listFontsInUse(theme) });
  if (file.length > OG_IMAGE_MAX_BYTES) {
    throw new Error(
      `${fileName} would weigh ${file.length} bytes, over ${OG_IMAGE_MAX_BYTES}: lighten the image`,
    );
  }
  files.push({ fileName, file });
}

// Written once every image is drawn, so a failure leaves none of them changed
files.forEach(({ fileName, file }) => {
  writeFileSync(fileName, file);
  console.log(
    `Wrote ${fileName}: ${OG_IMAGE_WIDTH_PX} × ${OG_IMAGE_HEIGHT_PX}, ${file.length} bytes (limit ${OG_IMAGE_MAX_BYTES})`,
  );
});
