// @ts-check
import { escapeHtml } from '../../utils/html.mjs';
import { DETAILS_SEPARATOR, PERIOD_SEPARATOR, SKILLS_SEPARATOR } from '../constants.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */
/** @typedef {import('./types.mjs').CvExperience} CvExperience */
/** @typedef {import('./types.mjs').CvLabeledLink} CvLabeledLink */
/** @typedef {import('./types.mjs').CvIconName} CvIconName */
/** @typedef {import('./types.mjs').CvLink} CvLink */
/** @typedef {import('./types.mjs').CvProject} CvProject */
/** @typedef {import('./types.mjs').CvProjectGroup} CvProjectGroup */
/** @typedef {import('./types.mjs').CvProjectItem} CvProjectItem */
/** @typedef {import('./types.mjs').CvProfile} CvProfile */
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
 * Icons of the contact details, each an inline `svg` element from `toInlineIcon`, by name.
 * @typedef {Partial<Record<CvIconName, string>>} CvIcons
 */

/**
 * Parameters of {@link renderContact}.
 * @typedef {object} RenderContactParams
 * @property {CvLink} contact - Contact detail.
 * @property {CvIcons} icons - Icons of the contact details.
 */

/**
 * Writes a contact detail after its icon: a link, or a text when it has no URL.
 * @param {RenderContactParams} params
 * @returns {string} The item of the list of the header, without icon when `icons` lacks its own.
 */
const renderContact = ({ contact: { text, url, icon }, icons }) => {
  const html = url ? `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>` : escapeHtml(text);
  return `<li>${icons[icon] ?? ''}${html}</li>`;
};

/**
 * Parameters of {@link renderLabeledItem}.
 * @typedef {object} RenderLabeledItemParams
 * @property {string} label - Label of the item, e.g. "Front-end".
 * @property {string} separator - What separates the label from the text, from `labelSeparator`.
 * @property {string} html - Text that the label introduces, already escaped.
 */

/**
 * Writes an item of a list whose label, in bold, introduces a text on the same line, as a
 * category does its skills.
 * @param {RenderLabeledItemParams} params
 * @returns {string} The item.
 */
const renderLabeledItem = ({ label, separator, html }) =>
  `<li><strong>${escapeHtml(label)}</strong>${escapeHtml(separator)}${html}</li>`;

/**
 * Parameters of {@link renderProfile}.
 * @typedef {object} RenderProfileParams
 * @property {CvProfile} profile - Profile to write.
 * @property {string} separator - What separates the label of a link from it.
 */

/**
 * Writes the profile that opens the CV: its summary, then where to check the practice it
 * describes, each link after its label.
 * @param {RenderProfileParams} params
 * @returns {string} Its section.
 */
const renderProfile = ({ profile, separator }) => {
  const links = profile.proofLinks.map(({ label, text, url }) =>
    renderLabeledItem({
      label,
      separator,
      html: `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>`,
    }),
  );

  return `<section class="section">
        <h2 class="section-title">${escapeHtml(profile.title)}</h2>
        <p class="summary">${escapeHtml(profile.summary)}</p>
        ${renderElement({ tag: 'p', className: 'text', html: escapeHtml(profile.proof) })}
        <ul class="labeled-links">${links.join('')}</ul>
      </section>`;
};

/**
 * Parameters of {@link renderSkills}.
 * @typedef {object} RenderSkillsParams
 * @property {CvContent['skills']} skills - Skills to write, by category.
 * @property {string} separator - What separates a category from its skills.
 */

/**
 * Writes the skills, one line per category, its skills after it.
 * @param {RenderSkillsParams} params
 * @returns {string} Its section.
 */
const renderSkills = ({ skills, separator }) => {
  const groups = skills.items.map(({ category, items }) =>
    renderLabeledItem({
      label: category,
      separator,
      html: escapeHtml(items.join(SKILLS_SEPARATOR)),
    }),
  );

  return `<section class="section">
        <h2 class="section-title">${escapeHtml(skills.title)}</h2>
        <ul class="skills">${groups.join('')}</ul>
      </section>`;
};

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
 * @property {CvIcons} [icons] - Icons of the contact details: a detail whose icon is missing goes
 * without one.
 */

/**
 * Builds the HTML page that Chromium prints to make the CV: the name, the job title and the
 * contact details, then the profile, the skills and the experiences, which a reader looks for
 * first, then the projects next to the education, with the headings of a document, so that the
 * PDF, tagged, reads in that order. Every text is escaped.
 * @param {RenderCvHtmlParams} params
 * @returns {string} A complete HTML document, in the language of the content.
 * @example
 * await page.setContent(renderCvHtml({ content, styles, fontFaces, icons }));
 * await page.pdf({ preferCSSPageSize: true, tagged: true });
 */
export const renderCvHtml = ({ content, styles, fontFaces, icons = {} }) => {
  const { profile, skills, experiences, projects, education, labelSeparator } = content;
  /** @param {CvLink} contact */
  const renderHeaderContact = contact => renderContact({ contact, icons });

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
      <ul class="contacts">${content.contacts.map(renderHeaderContact).join('')}</ul>
      <ul class="contacts">${content.profiles.map(renderHeaderContact).join('')}</ul>
    </header>
    <main>
      ${renderProfile({ profile, separator: labelSeparator })}
      ${renderSkills({ skills, separator: labelSeparator })}
      <section class="section">
        <h2 class="section-title">${escapeHtml(experiences.title)}</h2>
        ${experiences.items.map(renderExperience).join('')}
      </section>
      <div class="columns">
        <section class="section">
          <h2 class="section-title">${escapeHtml(projects.title)}</h2>
          ${projects.items.map(renderProjectGroup).join('')}
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
