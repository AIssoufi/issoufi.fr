// @ts-check
// Regenerates the link preview image of each language, public/og-image.jpg in French and
// public/og-image-en.jpg in English (`OG_IMAGE_PATHS` of src/utils/pages.ts), from the texts of the
// home page in that language, the design tokens, the background photo and the particle field of
// the home page: run `pnpm og-image` after changing one of them. Chromium, from Playwright,
// renders each image in the web fonts of the site, read from public/fonts/, and saves it as a
// JPEG.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

import { checkFontsLoaded } from '../utils/browser.mjs';
import { PUBLIC_DIR, TRANSLATION_MODULES } from '../utils/constants.mjs';
import { listFontsInUse } from '../utils/fonts.mjs';
import { findMissingTexts, getHomeTexts } from '../utils/home-texts.mjs';
import { hasUnresolvedValue, toDataUrl } from '../utils/html.mjs';
import { loadSiteModules } from '../utils/site-modules.mjs';
import {
  FONTS_IN_USE,
  OG_IMAGE_HEIGHT_PX,
  OG_IMAGE_JPEG_QUALITY,
  OG_IMAGE_MAX_BYTES,
  OG_IMAGE_WIDTH_PX,
  PARTICLE_SEED,
  SOURCE_MODULES,
} from './constants.mjs';
import { findDotLinks, renderParticlesSvg } from './utils/particles.mjs';
import { createSeededRandom } from './utils/random.mjs';
import { renderOgImageHtml, renderOgImageStyles } from './utils/template.mjs';

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
 * @throws {Error} When a font did not load, as when its file is not a font.
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
    await checkFontsLoaded({ page, fonts });

    return await page.screenshot({ type: 'jpeg', quality: OG_IMAGE_JPEG_QUALITY });
  } finally {
    await browser.close();
  }
};

const { sources, translations } = await loadSiteModules({
  sources: SOURCE_MODULES,
  translations: TRANSLATION_MODULES,
});
const { theme } = sources.theme;
const particles = { ...sources.particleConstants, ...sources.particleUtils };

/** @type {Record<string, string>} */
const imagePaths = sources.pages.OG_IMAGE_PATHS;
const images = Object.entries(imagePaths).map(([language, imagePath]) => ({
  language,
  fileName: join(PUBLIC_DIR, imagePath),
  texts: getHomeTexts({
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

// The web fonts of the site, whose files the page reads as data URLs, like the photo
const fontFaceStyles = sources.fonts.renderFontFaces({
  getUrl: (/** @type {string} */ url) =>
    toDataUrl({ content: readFileSync(join(PUBLIC_DIR, url)), fileName: url }),
});
if (!fontFaceStyles) throw new Error('No web font to load in src/theme/constants.ts');

const backgroundImageFile = join(PUBLIC_DIR, sources.home.BACKGROUND_IMAGE_URL);
const backgroundImageUrl = toDataUrl({
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
    fontFaceStyles,
    particlesSvg,
  });
  const file = await takeScreenshot({
    html,
    fonts: listFontsInUse({ theme, fontsInUse: FONTS_IN_USE }),
  });
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
