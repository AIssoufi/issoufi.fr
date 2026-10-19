// @ts-check

/** Width of the image, in pixels: with its height, the 1.91:1 ratio of Open Graph and X. */
export const OG_IMAGE_WIDTH_PX = 1200;

/** Height of the image, in pixels. */
export const OG_IMAGE_HEIGHT_PX = 630;

/**
 * Largest size of each image, in bytes: WhatsApp drops larger link preview images. The test of
 * `src/utils/pageHtml.spec.ts` checks the same limit.
 */
export const OG_IMAGE_MAX_BYTES = 300_000;

/**
 * JPEG quality of the images, from 0 to 100. In October 2026, 90 gave 101 kB for the French one
 * and 98 kB for the English one, a third of the limit, with no artifact visible at full size; 85
 * left a faint halo around the white text of the button. A PNG of the French image weighs 473 kB.
 */
export const OG_IMAGE_JPEG_QUALITY = 90;

/**
 * Fonts of the theme that the page of the image uses, with their weights: the body font for the
 * texts, in regular, medium and bold, and the display font for the logo.
 */
export const FONTS_IN_USE = [
  { font: 'body', weights: ['regular', 'medium', 'bold'] },
  { font: 'display', weights: ['regular'] },
];

/**
 * Modules of the site read by the script through Vite (`loadSiteModules`), which compiles their
 * TypeScript, with the translations of `TRANSLATION_MODULES` (`scripts/utils/constants.mjs`): the
 * design tokens, the `@font-face` rules of the web fonts, the particle field of the home page, and
 * the domain of the site, the path of the image of each language and the background photo of the
 * home page. Paths are relative to the project root.
 */
export const SOURCE_MODULES = {
  theme: '/src/theme/theme.ts',
  fonts: '/src/theme/utils.ts',
  particleConstants: '/src/pages/Home/ParticleField/constants.ts',
  particleUtils: '/src/pages/Home/ParticleField/utils.ts',
  pages: '/src/utils/pages.ts',
};

/**
 * Seed of the particles, so they stay in place from one generation to the next. Change it to
 * draw another arrangement.
 */
export const PARTICLE_SEED = 2026;

/** Background position that keeps the shimmer away from a word, which stays white. */
export const SHIMMER_OFF_WORD_POSITION = '-25%';

/**
 * Horizontal background position of the pink shimmer on each word of the job title, frozen as in
 * the first version of the image: away from the first word, in the middle of the second, at the
 * end of the third. The gradient is three times as wide as the word, as on the home page.
 */
export const SHIMMER_POSITIONS = [SHIMMER_OFF_WORD_POSITION, '52%', '20%'];

/**
 * Sizes and spacing of the image, in pixels. They are drawn for a 1200 × 630 image seen as a
 * thumbnail, larger than on the home page, so they are not tokens of the site.
 */
export const OG_LAYOUT = {
  /** Distance of the logo from the left edge. */
  logoLeftPx: 64,
  /** Distance of the logo from the top edge. */
  logoTopPx: 63,
  /** Font size of the logo. */
  logoFontSizePx: 52,
  /** Space above the author's name, the first of the centered texts. */
  contentTopPx: 144,
  /** Font size of the author's name. */
  nameFontSizePx: 26,
  /** Font size of the job title. */
  titleFontSizePx: 68,
  /**
   * Width from which the job title wraps: after "full-stack" in French, after "JavaScript" in
   * English.
   */
  titleMaxWidthPx: 960,
  /** Space between the author's name and the job title. */
  titleMarginTopPx: 20,
  /** Font size of the line about design. */
  passionFontSizePx: 32,
  /** Font size of the design skills in that line. */
  skillFontSizePx: 44,
  /** Space between the job title and the line about design. */
  passionMarginTopPx: 17,
  /** Font size of the subtitle. */
  subtitleFontSizePx: 26,
  /** Space between the line about design and the subtitle. */
  subtitleMarginTopPx: 19,
  /** Font size of the domain in the button. */
  siteFontSizePx: 20,
  /** Space between the subtitle and the button. */
  siteMarginTopPx: 53,
  /** Space above and below the domain, inside the button. */
  siteVerticalPaddingPx: 12,
  /** Space on each side of the domain, inside the button. */
  siteHorizontalPaddingPx: 37,
};
