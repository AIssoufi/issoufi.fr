// @ts-check
// Types of the content of the CV, shared by its helpers.

/** @typedef {import('../../utils/home-texts.mjs').HomeTexts} HomeTexts */
/** @typedef {import('../../utils/home-texts.mjs').TextSegment} TextSegment */

/**
 * Translates a key of the JSON data in the language of the CV.
 * @typedef {(key: unknown) => string} Translate
 */

/**
 * A piece of a paragraph of the CV.
 * @typedef {object} CvTextSegment
 * @property {string} text - Text of the piece.
 * @property {boolean} isStrong - Whether it is in bold, as a client name.
 */

/**
 * A project carried out within a role.
 * @typedef {object} CvProject
 * @property {string} title - Name of the project.
 * @property {string} state - Its status, e.g. "En production", `''` without one.
 * @property {CvTextSegment[]} description - Its description, piece by piece.
 * @property {string[]} bullets - Bullet points under the description.
 * @property {string[]} technologies - Technologies of the project.
 */

/**
 * One job at a company.
 * @typedef {object} CvRole
 * @property {string} title - Job title.
 * @property {string} titleLanguage - Language of the title when every translation writes it in
 * one, e.g. `en` for a title that the French CV keeps in English, so that a screen reader reads it
 * in that language; `''` otherwise.
 * @property {string} start - Start of the job, e.g. "juin 2021".
 * @property {string} end - End of the job, or "Aujourd’hui".
 * @property {CvTextSegment[]} intro - Introduction of the role, piece by piece.
 * @property {string[]} bullets - Bullet points under the introduction.
 * @property {CvProject[]} projects - Projects of the role.
 * @property {string[]} technologies - Technologies of the role.
 */

/**
 * One company of the experiences, with its roles, most recent first.
 * @typedef {object} CvExperience
 * @property {string} company - Name of the company.
 * @property {string} details - Contract type and city, e.g. "CDI · Paris (75)".
 * @property {CvRole[]} roles - Roles at the company.
 */

/**
 * A contact detail of the header, or a link of the CV.
 * @typedef {object} CvLink
 * @property {string} text - Text written on the CV.
 * @property {string} url - URL it opens, `''` for a text that is not a link, such as a city.
 */

/**
 * A project of the Projects page, which the CV names only: its kind and its technologies, older
 * than the experiences, would take the space of the recent ones.
 * @typedef {object} CvProjectItem
 * @property {string} name - Name of the project, or of the client.
 * @property {string} url - URL of the project, `''` without one.
 */

/**
 * A group of projects, personal or freelance.
 * @typedef {object} CvProjectGroup
 * @property {string} title - Title of the group, e.g. "Projets freelance".
 * @property {CvProjectItem[]} items - Projects of the group.
 */

/**
 * A degree of the education.
 * @typedef {object} CvDegree
 * @property {string} degree - Name of the degree.
 * @property {string} period - Years of study, e.g. "2016 – 2019".
 * @property {string} school - School or university.
 */

/**
 * A section of the CV that lists texts or entries under a title.
 * @template Item
 * @typedef {object} CvSection
 * @property {string} title - Title of the section.
 * @property {Item[]} items - Its entries, in order.
 */

/**
 * Everything the CV writes, in one language.
 * @typedef {object} CvContent
 * @property {string} language - Code of the language, e.g. `fr`.
 * @property {string} title - Title of the document, e.g.
 * "CV - ADAM Issoufi - Développeur full-stack JavaScript".
 * @property {string} subject - Subject of the document, in its information: the role and what
 * sets its author apart, which PDF readers show and recruiting tools index.
 * @property {string[]} keywords - Keywords of the document, in its information: terms that the
 * CV writes and that recruiting tools search, e.g. `React`.
 * @property {string} name - Name of the site's author.
 * @property {string} jobTitle - Job title.
 * @property {TextSegment[]} passion - Line about UX and UI design, as on the home page. The CV
 * leaves out the line under it, which offers the services of a freelancer to clients.
 * @property {CvLink[]} contacts - Contact details, links or not: email, phone and city.
 * @property {CvLink[]} profiles - Links to the site and the LinkedIn profile of its owner, on
 * the line under the contact details.
 * @property {CvSection<CvExperience>} experiences - Experiences of the Experiences page.
 * @property {CvSection<CvProjectGroup>} projects - Freelance then personal projects.
 * @property {CvSection<string>} skills - Skills, from the data of the CV.
 * @property {CvSection<CvDegree>} education - Degrees, from the data of the CV.
 */

export {};
