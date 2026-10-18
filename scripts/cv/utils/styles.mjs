// @ts-check
import { BULLET_MARK, CV_LAYOUT, CV_PAPER_FORMAT } from '../constants.mjs';

/**
 * Design tokens of `src/theme/theme.ts` read by the CV.
 * @typedef {object} CvTheme
 * @property {Record<string, string>} colors - Semantic colors, e.g. `accent`.
 * @property {Record<string, string>} fonts - Font stacks: `body`.
 * @property {Record<string, number>} fontWeights - Font weights, e.g. `bold`.
 * @property {Record<string, string>} letterSpacings - Letter spacings, e.g. `tight`.
 * @property {Record<string, number>} lineHeights - Line heights, e.g. `140`.
 */

/**
 * Builds the style sheet of the CV from the design tokens of the site and the print sizes of
 * {@link CV_LAYOUT}: a sober A4 layout, dark text on white paper with the plum of the site for the
 * name, the section titles and the links, in one column but for the groups of projects, and the
 * skills next to the education. Ligatures are turned off, so a search for
 * "fi" finds the text in every PDF reader. A missing token shows as `undefined` in it.
 * @param {CvTheme} theme - Design tokens of the site.
 * @returns {string} The CSS of the page.
 * @example
 * hasUnresolvedValue(renderCvStyles(theme)); // false while every token exists
 */
export const renderCvStyles = theme => {
  const { colors, fonts, fontWeights, letterSpacings, lineHeights } = theme;
  // The CV prints dark text on white paper, the reverse of the site: its paper is the foreground
  // color of the site, and its ink the background one
  const paper = colors.foreground;
  const ink = colors.background;

  return `
      @page {
        size: ${CV_PAPER_FORMAT};
        margin: ${CV_LAYOUT.pageMargin};
      }
      * {
        box-sizing: border-box;
      }
      html {
        background-color: ${paper};
      }
      body {
        margin: 0;
        color: ${colors['shade-a80']};
        font-family: ${fonts.body};
        font-size: ${CV_LAYOUT.bodyFontSize};
        font-weight: ${fontWeights.regular};
        line-height: ${lineHeights[140]};
        font-variant-ligatures: none;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h1,
      h2,
      h3,
      h4,
      h5,
      p,
      ul {
        margin: 0;
        padding: 0;
      }
      h1,
      h2,
      h3,
      h4,
      h5 {
        break-after: avoid;
      }
      a {
        color: ${colors.accent};
        text-decoration: none;
      }
      strong {
        color: ${ink};
        font-weight: ${fontWeights.bold};
      }
      .header {
        padding-bottom: ${CV_LAYOUT.headerMarginBottom};
        border-bottom: ${CV_LAYOUT.ruleWidth} solid ${colors['accent-soft']};
      }
      .name {
        color: ${colors.accent};
        font-size: ${CV_LAYOUT.nameFontSize};
        font-weight: ${fontWeights.bold};
        line-height: ${lineHeights[120]};
        letter-spacing: ${letterSpacings.tight};
      }
      .job-title {
        color: ${ink};
        font-size: ${CV_LAYOUT.jobTitleFontSize};
        font-weight: ${fontWeights.medium};
      }
      .tagline {
        font-size: ${CV_LAYOUT.taglineFontSize};
      }
      .contacts {
        display: flex;
        flex-wrap: wrap;
        column-gap: ${CV_LAYOUT.contactGap};
        margin-top: ${CV_LAYOUT.itemGap};
        list-style: none;
        font-size: ${CV_LAYOUT.contactFontSize};
        font-weight: ${fontWeights.medium};
      }
      .contacts + .contacts {
        margin-top: 0;
      }
      .section {
        margin-top: ${CV_LAYOUT.sectionMarginTop};
      }
      .section-title {
        margin-bottom: ${CV_LAYOUT.sectionTitleMarginBottom};
        padding-bottom: ${CV_LAYOUT.blockGap};
        border-bottom: ${CV_LAYOUT.ruleWidth} solid ${colors['accent-soft']};
        color: ${colors.accent};
        font-size: ${CV_LAYOUT.sectionTitleFontSize};
        font-weight: ${fontWeights.bold};
        letter-spacing: ${letterSpacings[8]};
        text-transform: uppercase;
      }
      .company + .company {
        margin-top: ${CV_LAYOUT.companyGap};
      }
      .company-name,
      .role-title,
      .group-title,
      .degree {
        color: ${ink};
        font-size: ${CV_LAYOUT.companyFontSize};
        font-weight: ${fontWeights.bold};
      }
      .role-title {
        font-weight: ${fontWeights.medium};
      }
      .details,
      .period,
      .technologies,
      .project-type {
        color: ${colors['shade-a55']};
        font-size: ${CV_LAYOUT.detailsFontSize};
        font-weight: ${fontWeights.medium};
      }
      .role {
        margin-top: ${CV_LAYOUT.itemGap};
      }
      .role-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: ${CV_LAYOUT.contactGap};
        break-after: avoid;
      }
      .period {
        flex-shrink: 0;
      }
      .text,
      .bullets,
      .technologies {
        margin-top: ${CV_LAYOUT.blockGap};
      }
      .bullets {
        list-style: none;
      }
      .bullets li {
        position: relative;
        padding-left: ${CV_LAYOUT.bulletIndent};
      }
      .bullets li::before {
        content: '${BULLET_MARK}';
        position: absolute;
        left: 0;
        color: ${colors.accent};
        font-weight: ${fontWeights.bold};
      }
      .bullets li,
      .entries li {
        break-inside: avoid;
      }
      .entries li + li {
        margin-top: ${CV_LAYOUT.entryGap};
      }
      .project {
        margin-top: ${CV_LAYOUT.itemGap};
        padding-left: ${CV_LAYOUT.projectIndent};
        border-left: ${CV_LAYOUT.projectRuleWidth} solid ${colors['accent-a30']};
        break-inside: avoid;
      }
      .project-title {
        color: ${ink};
        font-size: ${CV_LAYOUT.bodyFontSize};
        font-weight: ${fontWeights.bold};
      }
      .state {
        color: ${colors.accent};
        font-weight: ${fontWeights.medium};
      }
      .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: ${CV_LAYOUT.columnGap};
        break-inside: avoid;
      }
      .degree-entry + .degree-entry {
        margin-top: ${CV_LAYOUT.itemGap};
      }
      .entries {
        margin-top: ${CV_LAYOUT.blockGap};
        list-style: none;
      }
      .degree-entry {
        break-inside: avoid;
      }
`;
};
