// @ts-check
import { escapeHtml } from '../../utils/html.mjs';
import { DETAILS_SEPARATOR, PERIOD_SEPARATOR } from '../constants.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */
/** @typedef {import('./types.mjs').CvExperience} CvExperience */
/** @typedef {import('./types.mjs').CvLink} CvLink */
/** @typedef {import('./types.mjs').CvProject} CvProject */
/** @typedef {import('./types.mjs').CvProjectGroup} CvProjectGroup */
/** @typedef {import('./types.mjs').CvProjectItem} CvProjectItem */
/** @typedef {import('./types.mjs').CvRole} CvRole */
/** @typedef {import('./types.mjs').CvDegree} CvDegree */

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
 * Parameters of {@link renderElement}.
 * @typedef {object} RenderElementParams
 * @property {string} tag - Tag of the element, e.g. `p`.
 * @property {string} className - Class of the element, which the style sheet of the CV styles.
 * @property {string} html - Content of the element, its texts already escaped.
 */

/**
 * Writes a text in a tag, or nothing when it is empty.
 * @param {RenderElementParams} params
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
 * Writes a role, its period on the right of its title, which gets the language of its data.
 * @param {CvRole} role - Role to write.
 * @returns {string} Its block.
 */
const renderRole = ({
  title,
  titleLanguage,
  start,
  end,
  intro,
  bullets,
  projects,
  technologies,
}) => {
  const period = [start, end].filter(Boolean).join(PERIOD_SEPARATOR);
  const languageAttribute = titleLanguage ? ` lang="${escapeHtml(titleLanguage)}"` : '';

  return `<div class="role">
        <div class="role-header">
          <h4 class="role-title"${languageAttribute}>${escapeHtml(title)}</h4>
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
 * Writes the name of a project of the Projects page, a link when it has a URL.
 * @param {CvProjectItem} project - Project to write.
 * @returns {string} Its name.
 */
const renderProjectName = ({ name, url }) =>
  url ? `<a href="${escapeHtml(url)}">${escapeHtml(name)}</a>` : escapeHtml(name);

/**
 * Writes a group of projects, their names on one line.
 * @param {CvProjectGroup} group - Group to write.
 * @returns {string} Its block.
 */
const renderProjectGroup = ({ title, items }) => `<div class="group">
      <h3 class="group-title">${escapeHtml(title)}</h3>
      <p class="entries">${items.map(renderProjectName).join(escapeHtml(DETAILS_SEPARATOR))}</p>
    </div>`;

/**
 * Writes a degree of the education, with its years and its school.
 * @param {CvDegree} degree - Degree to write.
 * @returns {string} Its block.
 */
const renderDegree = ({ degree, period, school }) => {
  const details = [period, school].filter(Boolean).join(DETAILS_SEPARATOR);

  return `<div class="degree-entry">
      <h3 class="degree">${escapeHtml(degree)}</h3>
      ${renderElement({ tag: 'p', className: 'details', html: escapeHtml(details) })}
    </div>`;
};

/**
 * Parameters of {@link renderCvHtml}.
 * @typedef {object} RenderCvHtmlParams
 * @property {CvContent} content - Content of the CV, from `buildCvContent`.
 * @property {string} styles - Style sheet of the page, from `renderCvStyles`.
 * @property {string} fontFaces - `@font-face` rules of the static font files of the CV, from
 * `renderFontFaces`, which Chromium embeds in the PDF as TrueType fonts.
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
      ${renderElement({ tag: 'p', className: 'tagline', html: renderSegments(content.passion) })}
      <ul class="contacts">${content.contacts.map(renderContact).join('')}</ul>
      <ul class="contacts">${content.profiles.map(renderContact).join('')}</ul>
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
          ${renderBullets(skills.items)}
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
