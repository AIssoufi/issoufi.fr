// @ts-check
import { CV_LAYOUT, CV_PAPER_FORMAT } from '../constants.mjs';

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
 * name, the section titles, the icons of the contact details and the links, in one column but for
 * the projects, next to the education. Ligatures are turned off, so a search for "fi" finds the
 * text in every PDF reader. A missing token shows as `undefined` in it.
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
        line-height: ${lineHeights[130]};
        font-variant-ligatures: none;
        /* Keeps the last word of a paragraph off a line of its own. */
        text-wrap: pretty;
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
      .contacts li {
        display: flex;
        align-items: center;
        column-gap: ${CV_LAYOUT.contactIconGap};
      }
      .icon {
        flex-shrink: 0;
        width: ${CV_LAYOUT.contactIconSize};
        height: ${CV_LAYOUT.contactIconSize};
        color: ${colors.accent};
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
        font-size: ${CV_LAYOUT.roleFontSize};
        font-weight: ${fontWeights.bold};
      }
      .company-name {
        font-size: ${CV_LAYOUT.companyFontSize};
      }
      .details,
      .period,
      .technologies {
        color: ${colors['shade-a65']};
        font-size: ${CV_LAYOUT.detailsFontSize};
        font-weight: ${fontWeights.medium};
      }
      /* A role that fits on a page stays on one, so that a parser that reads page by page never
         parts its bullet points from its title. */
      .role {
        margin-top: ${CV_LAYOUT.itemGap};
        break-inside: avoid;
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
      /* No element that holds text is positioned: Chromium paints a positioned one after the rest
         of its page, so the text of the PDF would read it there. The mark is drawn, so it adds no
         character to that text either. */
      .bullets li {
        padding-left: ${CV_LAYOUT.bulletIndent};
        text-indent: -${CV_LAYOUT.bulletIndent};
      }
      .bullets li::before {
        content: '';
        display: inline-block;
        width: ${CV_LAYOUT.bulletMarkSize};
        height: ${CV_LAYOUT.bulletMarkSize};
        margin-right: calc(${CV_LAYOUT.bulletIndent} - ${CV_LAYOUT.bulletMarkSize});
        border-top: ${CV_LAYOUT.bulletMarkWidth} solid ${colors.accent};
        border-right: ${CV_LAYOUT.bulletMarkWidth} solid ${colors.accent};
        vertical-align: ${CV_LAYOUT.bulletMarkRaise};
        transform: translateX(-${CV_LAYOUT.bulletMarkWidth}) rotate(45deg);
      }
      .bullets li {
        break-inside: avoid;
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
      .skills,
      .labeled-links {
        list-style: none;
      }
      .skills li + li {
        margin-top: ${CV_LAYOUT.blockGap};
      }
      .labeled-links {
        display: flex;
        flex-wrap: wrap;
        column-gap: ${CV_LAYOUT.contactGap};
        margin-top: ${CV_LAYOUT.blockGap};
      }
      .group + .group {
        margin-top: ${CV_LAYOUT.itemGap};
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
      }
      /* A line of projects breaks between two names, never inside one. */
      .entry {
        white-space: nowrap;
      }
      .degree-entry {
        break-inside: avoid;
      }
`;
};
