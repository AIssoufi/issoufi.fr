// @ts-check
import { escapeHtml } from '../../utils/html.mjs';
import { CV_LAYOUT, CV_PAPER_FORMAT, DETAILS_SEPARATOR, PERIOD_SEPARATOR } from '../constants.mjs';

/** @typedef {import('./content.mjs').CvContent} CvContent */
/** @typedef {import('./content.mjs').CvExperience} CvExperience */
/** @typedef {import('./content.mjs').CvLink} CvLink */
/** @typedef {import('./content.mjs').CvProject} CvProject */
/** @typedef {import('./content.mjs').CvProjectGroup} CvProjectGroup */
/** @typedef {import('./content.mjs').CvRole} CvRole */
/** @typedef {import('./content.mjs').CvDegree} CvDegree */

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

  return `
      @page {
        size: ${CV_PAPER_FORMAT};
        margin: ${CV_LAYOUT.pageMargin};
      }
      * {
        box-sizing: border-box;
      }
      html {
        background-color: ${colors.foreground};
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
        color: ${colors.background};
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
        color: ${colors.background};
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
        color: ${colors.background};
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
        padding-left: ${CV_LAYOUT.bulletIndent};
      }
      .bullets li::marker {
        color: ${colors.accent};
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
        color: ${colors.background};
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

/**
 * Writes a paragraph made of pieces, the strong ones in bold.
 * @param {{ text: string, isStrong?: boolean, isHighlighted?: boolean }[]} segments - Pieces of
 * the paragraph, from the content of the CV or the line about design of the home page.
 * @returns {string} Their HTML, one after the other.
 */
const renderSegments = segments =>
  segments
    .map(({ text, isStrong = false, isHighlighted = false }) => {
      const isBold = isStrong || isHighlighted;
      return isBold ? `<strong>${escapeHtml(text)}</strong>` : escapeHtml(text);
    })
    .join('');

/**
 * Writes a text in a tag, or nothing when it is empty.
 * @param {{ tag: string, className: string, html: string }} params - Tag and class of the element,
 * and its HTML, already escaped.
 * @returns {string} The element, or `''` when `html` is empty.
 */
const renderElement = ({ tag, className, html }) =>
  html ? `<${tag} class="${className}">${html}</${tag}>` : '';

/**
 * Writes the bullet points of a role or a project.
 * @param {string[]} bullets - Texts of the bullet points.
 * @returns {string} The list, or `''` without bullet points.
 */
const renderBullets = bullets =>
  bullets.length > 0
    ? `<ul class="bullets">${bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
    : '';

/**
 * Writes the technologies of a role or a project on one line.
 * @param {string[]} technologies - Names of the technologies.
 * @returns {string} The line, or `''` without technologies.
 */
const renderTechnologies = technologies =>
  renderElement({
    tag: 'p',
    className: 'technologies',
    html: technologies.map(escapeHtml).join(DETAILS_SEPARATOR),
  });

/**
 * Writes a contact detail: a link, or a text when it has no URL.
 * @param {CvLink} contact - Contact detail.
 * @returns {string} The item of the list of the header.
 */
const renderContact = ({ text, url }) =>
  url
    ? `<li><a href="${escapeHtml(url)}">${escapeHtml(text)}</a></li>`
    : `<li>${escapeHtml(text)}</li>`;

/**
 * Writes a project of a role.
 * @param {CvProject} project - Project to write.
 * @returns {string} Its block, its status after its title.
 */
const renderProject = ({ title, state, description, bullets, technologies }) => {
  const stateHtml = state
    ? `<span class="state">${escapeHtml(`${DETAILS_SEPARATOR}${state}`)}</span>`
    : '';

  return `<div class="project">
          <h5 class="project-title">${escapeHtml(title)}${stateHtml}</h5>
          ${renderElement({ tag: 'p', className: 'text', html: renderSegments(description) })}
          ${renderBullets(bullets)}
          ${renderTechnologies(technologies)}
        </div>`;
};

/**
 * Writes a role, its period on the right of its title.
 * @param {CvRole} role - Role to write.
 * @returns {string} Its block.
 */
const renderRole = ({ title, start, end, intro, bullets, projects, technologies }) => {
  const period = [start, end].filter(Boolean).join(PERIOD_SEPARATOR);

  return `<div class="role">
        <div class="role-header">
          <h4 class="role-title">${escapeHtml(title)}</h4>
          ${renderElement({ tag: 'p', className: 'period', html: escapeHtml(period) })}
        </div>
        ${renderElement({ tag: 'p', className: 'text', html: renderSegments(intro) })}
        ${renderBullets(bullets)}
        ${projects.map(renderProject).join('')}
        ${renderTechnologies(technologies)}
      </div>`;
};

/**
 * Writes a company of the experiences, with its roles.
 * @param {CvExperience} experience - Company to write.
 * @returns {string} Its block.
 */
const renderExperience = ({ company, details, roles }) => {
  const detailsHtml = details
    ? `<span class="details">${escapeHtml(`${DETAILS_SEPARATOR}${details}`)}</span>`
    : '';

  return `<article class="company">
      <h3 class="company-name">${escapeHtml(company)}${detailsHtml}</h3>
      ${roles.map(renderRole).join('')}
    </article>`;
};

/**
 * Writes a group of projects, each one with its kind and its technologies, its name a link when
 * it has a URL.
 * @param {CvProjectGroup} group - Group to write.
 * @returns {string} Its block.
 */
const renderProjectGroup = ({ title, items }) => {
  const entries = items.map(({ name, type, tools, url }) => {
    const nameHtml = url
      ? `<a href="${escapeHtml(url)}"><strong>${escapeHtml(name)}</strong></a>`
      : `<strong>${escapeHtml(name)}</strong>`;
    const details = [type, tools.join(', ')].filter(Boolean).join(DETAILS_SEPARATOR);
    const detailsHtml = details
      ? `<span class="project-type">${escapeHtml(`${DETAILS_SEPARATOR}${details}`)}</span>`
      : '';
    return `<li>${nameHtml}${detailsHtml}</li>`;
  });

  return `<div class="group">
      <h3 class="group-title">${escapeHtml(title)}</h3>
      <ul class="entries">${entries.join('')}</ul>
    </div>`;
};

/**
 * Writes a degree of the education.
 * @param {CvDegree} degree - Degree to write.
 * @returns {string} Its block.
 */
const renderDegree = ({ degree, period, school, description }) => {
  const details = [period, school].filter(Boolean).join(DETAILS_SEPARATOR);

  return `<div class="degree-entry">
      <h3 class="degree">${escapeHtml(degree)}</h3>
      ${renderElement({ tag: 'p', className: 'details', html: escapeHtml(details) })}
      ${renderElement({ tag: 'p', className: 'text', html: escapeHtml(description) })}
    </div>`;
};

/**
 * Parameters of {@link renderCvHtml}.
 * @typedef {object} RenderCvHtmlParams
 * @property {CvContent} content - Content of the CV, from `buildCvContent`.
 * @property {string} styles - Style sheet of the page, from {@link renderCvStyles}.
 * @property {string} fontFaces - `@font-face` rules of the static fonts of Google Fonts, which
 * Chromium embeds in the PDF as TrueType fonts.
 */

/**
 * Builds the HTML page that Chromium prints to make the CV: the name, the job title and the
 * contact details, then the experiences, the projects, the skills and the education, with the
 * headings of a document, so that the PDF, tagged, reads in that order. Every text is escaped.
 * @param {RenderCvHtmlParams} params
 * @returns {string} A complete HTML document, in the language of the content.
 * @example
 * await page.setContent(renderCvHtml({ content, styles, fontFaces }));
 * await page.pdf({ preferCSSPageSize: true, tagged: true });
 */
export const renderCvHtml = ({ content, styles, fontFaces }) => {
  const { experiences, projects, skills, education } = content;
  const tagline = [renderSegments(content.passion), escapeHtml(content.subtitle)]
    .filter(Boolean)
    .join(escapeHtml(DETAILS_SEPARATOR));

  return `<!doctype html>
<html lang="${escapeHtml(content.language)}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(content.title)}</title>
    <meta name="author" content="${escapeHtml(content.name)}" />
    <style>${fontFaces}</style>
    <style>${styles}</style>
  </head>
  <body>
    <header class="header">
      <h1 class="name">${escapeHtml(content.name)}</h1>
      <p class="job-title">${escapeHtml(content.jobTitle)}</p>
      ${renderElement({ tag: 'p', className: 'tagline', html: tagline })}
      <ul class="contacts">${content.contacts.map(renderContact).join('')}</ul>
    </header>
    <main>
      <section class="section">
        <h2 class="section-title">${escapeHtml(experiences.title)}</h2>
        ${experiences.items.map(renderExperience).join('')}
      </section>
      <section class="section">
        <h2 class="section-title">${escapeHtml(projects.title)}</h2>
        <div class="columns">${projects.items.map(renderProjectGroup).join('')}</div>
      </section>
      <div class="columns">
        <section class="section">
          <h2 class="section-title">${escapeHtml(skills.title)}</h2>
          <ul class="bullets">${skills.items.map(skill => `<li>${escapeHtml(skill)}</li>`).join('')}</ul>
        </section>
        <section class="section">
          <h2 class="section-title">${escapeHtml(education.title)}</h2>
          ${education.items.map(renderDegree).join('')}
        </section>
      </div>
    </main>
  </body>
</html>
`;
};
