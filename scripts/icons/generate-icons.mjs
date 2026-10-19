// @ts-check
// Regenerates the icons of the site in public/ (`APP_ICONS` of src/utils/icons.ts): the SVG and
// ICO favicons, the Apple touch icon and the icons of the installed app, maskable one included,
// from the "AI" logo of the header, in its font (the display font of the theme, read from
// public/fonts/), its letter spacing and the colors of the theme: run `pnpm icons` after changing
// one of them. The logo is drawn from the outlines of its glyphs, so the SVG needs no font, and
// Chromium, from Playwright, saves each other icon as a PNG.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

import { LOGO_TEXT, PUBLIC_DIR } from '../utils/constants.mjs';
import { getFirstFontFamily } from '../utils/fonts.mjs';
import { toDataUrl } from '../utils/html.mjs';
import { loadSiteModules } from '../utils/site-modules.mjs';
import {
  FAVICON_SIZE,
  ICO_SIZES_PX,
  ICON_LAYOUTS,
  INK_ALPHA_THRESHOLD,
  LOGO_FONT,
  LOGO_LETTER_SPACING,
  MAX_OUTLINE_MISMATCH_RATIO,
  OUTLINE_CHECK_FONT_SIZE_PX,
  OUTLINE_CHECK_MARGIN_PX,
  SOURCE_MODULES,
  TILE_CORNER_RADIUS_RATIO,
} from './constants.mjs';
import {
  getMismatchRatio,
  layoutLogo,
  parseEmLength,
  renderIconSvg,
  toLogoPathData,
} from './utils/logo.mjs';
import { toIco } from './utils/ico.mjs';
import { readGlyphOutlines } from './utils/woff2.mjs';

/** Media type of the SVG favicon, the only icon written as it is drawn. */
const SVG_MEDIA_TYPE = 'image/svg+xml';

/** Media type of the ICO favicon, which holds the logo at each of `ICO_SIZES_PX`. */
const ICO_MEDIA_TYPE = 'image/x-icon';

/**
 * An icon to draw.
 * @typedef {object} IconToDraw
 * @property {string} role - Role of the icon in `APP_ICONS`, which gives its layout.
 * @property {number} size - Width and height of the icon, in pixels.
 */

/**
 * What the browser needs to draw the logo twice, as text in its font and as its outline.
 * @typedef {object} OutlineCheck
 * @property {string} family - Family of the font of the logo.
 * @property {string} text - Text of the logo.
 * @property {string} pathData - Outline of the logo, in the pixels of the canvas.
 * @property {number} fontSizePx - Font size of the text.
 * @property {number} letterSpacingPx - Letter spacing of the text.
 * @property {number} width - Width of the canvas.
 * @property {number} height - Height of the canvas.
 * @property {number} originX - Left of the text, where the outline starts.
 * @property {number} baselineY - Baseline of the text and of the outline.
 * @property {number} inkAlphaThreshold - Opacity from which a pixel counts as ink.
 */

/**
 * Draws the logo as text in its font and as its outline, each on a canvas, and counts the pixels
 * where they differ. Runs in the browser.
 * @param {OutlineCheck} check
 * @returns {Promise<import('./utils/logo.mjs').InkComparison>} The pixels counted.
 */
const compareOutlineWithText = async check => {
  const font = `${check.fontSizePx}px "${check.family}"`;
  await document.fonts.load(font, check.text);

  /** @param {(context: CanvasRenderingContext2D) => void} draw */
  const paint = draw => {
    const canvas = document.createElement('canvas');
    canvas.width = check.width;
    canvas.height = check.height;
    const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    draw(context);
    return context.getImageData(0, 0, check.width, check.height).data;
  };
  const textPixels = paint(context => {
    context.font = font;
    context.letterSpacing = `${check.letterSpacingPx}px`;
    context.fillText(check.text, check.originX, check.baselineY);
  });
  const outlinePixels = paint(context => context.fill(new Path2D(check.pathData)));

  let inkedCount = 0;
  let mismatchCount = 0;
  // The opacity of each pixel, the fourth of its four channels
  for (let index = 3; index < textPixels.length; index += 4) {
    const isTextInk = textPixels[index] >= check.inkAlphaThreshold;
    const isOutlineInk = outlinePixels[index] >= check.inkAlphaThreshold;
    if (isTextInk || isOutlineInk) inkedCount += 1;
    if (isTextInk !== isOutlineInk) mismatchCount += 1;
  }
  return { inkedCount, mismatchCount };
};

const { sources } = await loadSiteModules({ sources: SOURCE_MODULES });
const { theme } = sources.theme;

const family = getFirstFontFamily(theme.fonts[LOGO_FONT]);
/** @type {{ family: string, url: string } | undefined} */
const fontFace = sources.fontFaces.FONT_FACES.find(
  (/** @type {{ family: string }} */ face) => face.family === family,
);
if (!fontFace) throw new Error(`No web font of src/theme/constants.ts draws ${family}`);

const letterSpacingEm = parseEmLength(theme.letterSpacings[LOGO_LETTER_SPACING]);
if (!Number.isFinite(letterSpacingEm)) throw new Error('The letter spacing of the logo is missing');

const outlines = readGlyphOutlines({
  file: readFileSync(join(PUBLIC_DIR, fontFace.url)),
  text: LOGO_TEXT,
});
const logo = layoutLogo({ outlines, letterSpacingEm });
const colors = { background: theme.colors.background, foreground: theme.colors.foreground };

/** @type {Record<string, { url: string, type: string, sizePx?: number }>} */
const icons = sources.icons.APP_ICONS;
const missingLayouts = Object.keys(icons).filter(role => !(role in ICON_LAYOUTS));
if (missingLayouts.length > 0) {
  throw new Error(`No layout in scripts/icons/constants.mjs for: ${missingLayouts.join(', ')}`);
}

const browser = await chromium.launch();
/** @type {{ fileName: string, file: Buffer | string, dimensions: string }[]} */
const files = [];
try {
  // The outline of the logo, drawn over its text in its font: a glyph read wrong shows
  const fontFaceStyles = sources.fontUtils.renderFontFaces({
    getUrl: (/** @type {string} */ url) =>
      toDataUrl({ content: readFileSync(join(PUBLIC_DIR, url)), fileName: url }),
  });
  const checkPage = await browser.newPage();
  await checkPage.setContent(`<style>${fontFaceStyles}</style>`);
  const scale = OUTLINE_CHECK_FONT_SIZE_PX / outlines.unitsPerEm;
  const originX = OUTLINE_CHECK_MARGIN_PX - logo.box.minX * scale;
  const baselineY = OUTLINE_CHECK_MARGIN_PX - logo.box.minY * scale;
  const comparison = await checkPage.evaluate(compareOutlineWithText, {
    family,
    text: LOGO_TEXT,
    pathData: toLogoPathData({
      contours: logo.contours,
      transform: { scale, translateX: originX, translateY: baselineY },
    }),
    fontSizePx: OUTLINE_CHECK_FONT_SIZE_PX,
    letterSpacingPx: letterSpacingEm * OUTLINE_CHECK_FONT_SIZE_PX,
    width: Math.ceil((logo.box.maxX - logo.box.minX) * scale + 2 * OUTLINE_CHECK_MARGIN_PX),
    height: Math.ceil((logo.box.maxY - logo.box.minY) * scale + 2 * OUTLINE_CHECK_MARGIN_PX),
    originX,
    baselineY,
    inkAlphaThreshold: INK_ALPHA_THRESHOLD,
  });
  const mismatchRatio = getMismatchRatio(comparison);
  if (mismatchRatio > MAX_OUTLINE_MISMATCH_RATIO) {
    throw new Error(
      `The outline of the logo differs from its text in ${family} on ${(mismatchRatio * 100).toFixed(1)} % of its pixels`,
    );
  }

  /**
   * Draws an icon of a role at a size, as an SVG, in the layout of the role.
   * @param {IconToDraw} icon - Icon to draw.
   */
  const drawIcon = ({ role, size }) =>
    renderIconSvg({
      logo,
      size,
      layout: ICON_LAYOUTS[role],
      cornerRadiusRatio: TILE_CORNER_RADIUS_RATIO,
      colors,
    });

  /**
   * Draws an icon of a role at a size as a PNG: Chromium saves its SVG on a page of its size, one
   * pixel of the image per CSS pixel, transparent around the rounded corners of a tile.
   * @param {IconToDraw} icon - Icon to draw.
   */
  const renderPng = async icon => {
    const page = await browser.newPage({
      viewport: { width: icon.size, height: icon.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`<style>html,body{margin:0}svg{display:block}</style>${drawIcon(icon)}`);
    return page.screenshot({ omitBackground: true });
  };

  for (const [role, { url, type, sizePx = FAVICON_SIZE }] of Object.entries(icons)) {
    const fileName = join(PUBLIC_DIR, url);
    const dimensions = `${sizePx} × ${sizePx}`;
    if (type === SVG_MEDIA_TYPE) {
      files.push({ fileName, file: drawIcon({ role, size: sizePx }), dimensions });
    } else if (type === ICO_MEDIA_TYPE) {
      const images = [];
      for (const size of ICO_SIZES_PX) images.push({ size, png: await renderPng({ role, size }) });
      files.push({ fileName, file: toIco(images), dimensions: `${ICO_SIZES_PX.join(', ')} px` });
    } else {
      files.push({ fileName, file: await renderPng({ role, size: sizePx }), dimensions });
    }
  }
} finally {
  await browser.close();
}

// Written once every icon is drawn, so a failure leaves none of them changed
files.forEach(({ fileName, file, dimensions }) => {
  writeFileSync(fileName, file);
  console.log(`Wrote ${fileName}: ${dimensions}, ${Buffer.byteLength(file)} bytes`);
});
