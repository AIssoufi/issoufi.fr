// @ts-check
import {
  OG_IMAGE_HEIGHT_PX,
  OG_IMAGE_WIDTH_PX,
  OG_LAYOUT,
  SHIMMER_OFF_WORD_POSITION,
  SHIMMER_POSITIONS,
} from '../constants.mjs';
import { escapeHtml } from '../../utils/html.mjs';

/** @typedef {import('../../utils/home-texts.mjs').HomeTexts} HomeTexts */

/**
 * Design tokens of `src/theme/theme.ts` read by the image.
 * @typedef {object} OgImageTheme
 * @property {Record<string, string>} colors - Semantic colors, e.g. `accent-soft`.
 * @property {Record<string, string>} fonts - Font stacks: `body` and `display`.
 * @property {Record<string, number>} fontWeights - Font weights, e.g. `bold`.
 * @property {Record<string, string>} letterSpacings - Letter spacings, e.g. `tight`.
 * @property {Record<string, number>} lineHeights - Line heights, e.g. `100`.
 * @property {Record<string, string>} radii - Corner radii, e.g. `pill`.
 * @property {Record<string, string>} shadows - Shadows and glows, e.g. `accentGlowStrong`.
 */

/**
 * Renders the words of the job title, each with the pink shimmer of the home page frozen where it
 * stood in the first version of the image.
 * @param {string} jobTitle - Job title, split on spaces.
 * @returns {string} One `<span>` per word, separated by spaces.
 */
const renderJobTitleWords = jobTitle =>
  jobTitle
    .split(' ')
    .map((word, index) => {
      const position = SHIMMER_POSITIONS[index] ?? SHIMMER_OFF_WORD_POSITION;
      return `<span class="word" style="background-position-x: ${position}">${escapeHtml(word)}</span>`;
    })
    .join(' ');

/**
 * Builds the style sheet of the page of the image from the design tokens of the site and the
 * sizes of {@link OG_LAYOUT}. The background photo is set on the page itself, so the style sheet
 * holds nothing but tokens and sizes, and a missing token shows as `undefined` in it.
 * @param {OgImageTheme} theme - Design tokens of the site.
 * @returns {string} The CSS of the page.
 * @example
 * hasUnresolvedValue(renderOgImageStyles(theme)); // false while every token exists
 */
export const renderOgImageStyles = theme => {
  const { colors, fonts, fontWeights, letterSpacings, lineHeights, radii, shadows } = theme;

  return `
      html,
      body {
        margin: 0;
        width: ${OG_IMAGE_WIDTH_PX}px;
        height: ${OG_IMAGE_HEIGHT_PX}px;
        overflow: hidden;
      }
      body {
        position: relative;
        font-family: ${fonts.body};
        color: ${colors.foreground};
        background: ${colors.background} center / cover no-repeat;
      }
      .layer {
        position: absolute;
        inset: 0;
      }
      .shade {
        background-color: ${colors['shade-a80']};
      }
      .logo {
        position: absolute;
        left: ${OG_LAYOUT.logoLeftPx}px;
        top: ${OG_LAYOUT.logoTopPx}px;
        font-family: ${fonts.display};
        font-size: ${OG_LAYOUT.logoFontSizePx}px;
        line-height: ${lineHeights[100]};
        letter-spacing: ${letterSpacings[2]};
      }
      main {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: ${OG_LAYOUT.contentTopPx}px;
        text-align: center;
      }
      .name {
        margin: 0;
        color: ${colors['accent-soft']};
        font-size: ${OG_LAYOUT.nameFontSizePx}px;
        font-weight: ${fontWeights.medium};
        letter-spacing: ${letterSpacings[8]};
        text-transform: uppercase;
      }
      h1 {
        max-width: ${OG_LAYOUT.titleMaxWidthPx}px;
        margin: ${OG_LAYOUT.titleMarginTopPx}px 0 0;
        font-size: ${OG_LAYOUT.titleFontSizePx}px;
        font-weight: ${fontWeights.bold};
        line-height: ${lineHeights[120]};
        letter-spacing: ${letterSpacings.tight};
      }
      /* The shimmer of the home page words, from src/pages/Home/SplitWords/SplitWords.styled.ts */
      .word {
        display: inline-block;
        background: linear-gradient(
          90deg,
          ${colors.foreground} 0%,
          ${colors.foreground} 30%,
          ${colors['accent-soft']} 50%,
          ${colors.foreground} 70%,
          ${colors.foreground} 100%
        );
        background-size: 300% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .passion {
        margin: ${OG_LAYOUT.passionMarginTopPx}px 0 0;
        font-size: ${OG_LAYOUT.passionFontSizePx}px;
        font-weight: ${fontWeights.regular};
        letter-spacing: ${letterSpacings[1]};
      }
      .passion strong {
        font-size: ${OG_LAYOUT.skillFontSizePx}px;
        font-weight: ${fontWeights.bold};
        letter-spacing: ${letterSpacings.tight};
      }
      .subtitle {
        margin: ${OG_LAYOUT.subtitleMarginTopPx}px 0 0;
        color: ${colors['foreground-secondary']};
        font-size: ${OG_LAYOUT.subtitleFontSizePx}px;
      }
      .site {
        margin-top: ${OG_LAYOUT.siteMarginTopPx}px;
        padding: ${OG_LAYOUT.siteVerticalPaddingPx}px ${OG_LAYOUT.siteHorizontalPaddingPx}px;
        border-radius: ${radii.pill};
        background-color: ${colors.accent};
        box-shadow: ${shadows.accentGlowStrong};
        font-size: ${OG_LAYOUT.siteFontSizePx}px;
        font-weight: ${fontWeights.medium};
        letter-spacing: ${letterSpacings[5]};
        text-transform: uppercase;
      }
`;
};

/**
 * Parameters of {@link renderOgImageHtml}.
 * @typedef {object} RenderOgImageHtmlParams
 * @property {string} language - Code of the language of the texts, e.g. `en`, written in the
 * `lang` of the page so the browser applies its typography rules. A value that is not a string
 * leaves the language unknown (`lang=""`).
 * @property {HomeTexts} texts - Texts of the image, from `getHomeTexts`.
 * @property {string} styles - Style sheet of the page, from {@link renderOgImageStyles}.
 * @property {string} backgroundImageUrl - Background photo of the home page, as a data URL,
 * since the page is not served from the project.
 * @property {string} fontFaceStyles - `@font-face` rules of the web fonts of the site, their files
 * as data URLs, from `renderFontFaces` (`src/theme/utils.ts`), written in the page as they are. A
 * value that is not a string leaves the style of the fonts empty.
 * @property {string} particlesSvg - Still of the particle field, from `renderParticlesSvg`.
 */

/**
 * Builds the HTML page that Chromium screenshots to make the link preview image: the darkened
 * photo and the particles of the home page, the logo, the author's name, the job title with its
 * shimmer, the line about design, the subtitle, and the domain in a button, in the fonts and
 * colors of the site.
 * @param {RenderOgImageHtmlParams} params
 * @returns {string} A complete HTML document, sized to the image.
 * @example
 * await page.setContent(
 *   renderOgImageHtml({
 *     language: 'en',
 *     texts,
 *     styles,
 *     backgroundImageUrl,
 *     fontFaceStyles,
 *     particlesSvg,
 *   }),
 * );
 */
export const renderOgImageHtml = ({
  language,
  texts,
  styles,
  backgroundImageUrl,
  fontFaceStyles,
  particlesSvg,
}) => {
  const fontStyles = typeof fontFaceStyles === 'string' ? fontFaceStyles : '';
  const passion = texts.passion
    .map(({ text, isHighlighted }) =>
      isHighlighted ? `<strong>${escapeHtml(text)}</strong>` : escapeHtml(text),
    )
    .join('');

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
  <head>
    <meta charset="utf-8" />
    <style>${fontStyles}</style>
    <style>${styles}</style>
  </head>
  <body style="background-image: url('${escapeHtml(backgroundImageUrl)}')">
    <div class="layer shade"></div>
    <div class="layer">${particlesSvg}</div>
    <div class="logo">${escapeHtml(texts.logo)}</div>
    <main class="layer">
      <p class="name">${escapeHtml(texts.name)}</p>
      <h1>${renderJobTitleWords(texts.jobTitle)}</h1>
      <p class="passion">${passion}</p>
      <p class="subtitle">${escapeHtml(texts.subtitle)}</p>
      <div class="site">${escapeHtml(texts.site)}</div>
    </main>
  </body>
</html>
`;
};
