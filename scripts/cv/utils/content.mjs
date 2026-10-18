// @ts-check
import { PAGE_TITLE_SEPARATOR } from '../../utils/constants.mjs';
import {
  DETAILS_SEPARATOR,
  EMAIL_PATTERN,
  LINK_PROTOCOLS,
  MAILTO_PREFIX,
  TRAILING_SLASHES_PATTERN,
  WEB_PROTOCOLS,
  WWW_PREFIX,
} from '../constants.mjs';

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
 * A project of the Projects page.
 * @typedef {object} CvProjectItem
 * @property {string} name - Name of the project, or of the client.
 * @property {string} type - Kind of project, e.g. "Site vitrine".
 * @property {string[]} tools - Technologies of the project.
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
 * @property {string} description - What it taught, `''` without one.
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
 * @property {string} title - Title of the document, e.g. "CV - ADAM Issoufi".
 * @property {string} name - Name of the site's author.
 * @property {string} jobTitle - Job title.
 * @property {TextSegment[]} passion - Line about UX and UI design, as on the home page.
 * @property {string} subtitle - Line under it, as on the home page.
 * @property {CvLink[]} contacts - Contact details, links or not.
 * @property {CvSection<CvExperience>} experiences - Experiences of the Experiences page.
 * @property {CvSection<CvProjectGroup>} projects - Freelance then personal projects.
 * @property {CvSection<string>} skills - Skills, from the data of the CV.
 * @property {CvSection<CvDegree>} education - Degrees, from the data of the CV.
 */

/**
 * Reads a text of the data, so a missing or misspelled field gives an empty text instead of a
 * crash.
 * @param {unknown} value - Value to read.
 * @returns {string} The value, or `''` when it is not a string.
 */
const toText = value => (typeof value === 'string' ? value : '');

/**
 * Tells whether a text holds more than spaces.
 * @param {string} text - Text to check.
 * @returns {boolean} False for `''` and `'  '`.
 */
const isFilled = text => text.trim() !== '';

/**
 * Tells whether a value of the data is an object other than a list, as an entry is.
 * @param {unknown} value - Value to check.
 * @returns {value is Record<string, any>} True for an object that is not a list.
 */
const isEntry = value => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Keeps the entries of a list of the data.
 * @param {unknown} value - List to read.
 * @returns {Record<string, any>[]} Its objects, or none when it is not a list.
 */
const toEntries = value => (Array.isArray(value) ? value.filter(isEntry) : []);

/**
 * Keeps the filled texts of a list of the data, such as technologies.
 * @param {unknown} value - List to read.
 * @returns {string[]} Its texts that hold more than spaces, or none when it is not a list.
 */
const toTexts = value => (Array.isArray(value) ? value.map(toText).filter(isFilled) : []);

/**
 * Reads a URL of the data that the CV can write as a link.
 * @param {unknown} value - URL to read.
 * @returns {string} The URL, or `''` when it is not a URL, or its scheme is not one of
 * {@link LINK_PROTOCOLS}, as `javascript:`.
 */
export const toLinkUrl = value => {
  const url = toText(value);
  const isLink = URL.canParse(url) && LINK_PROTOCOLS.has(new URL(url).protocol);
  return isLink ? url : '';
};

/**
 * Writes a web address the way people read it: without its scheme, `www.` and the slash that
 * ends it.
 * @param {unknown} value - Web address, e.g. `https://www.linkedin.com/in/issoufiadam/`.
 * @returns {string} The address to write, e.g. `linkedin.com/in/issoufiadam`, or `''` when it is
 * not a web address.
 * @example
 * toLinkText('https://github.com/AIssoufi'); // 'github.com/AIssoufi'
 */
export const toLinkText = value => {
  const url = toLinkUrl(value);
  const isWebAddress = url !== '' && WEB_PROTOCOLS.has(new URL(url).protocol);
  if (!isWebAddress) return '';

  const { host, pathname } = new URL(url);
  const domain = host.startsWith(WWW_PREFIX) ? host.slice(WWW_PREFIX.length) : host;
  return `${domain}${pathname}`.replace(TRAILING_SLASHES_PATTERN, '');
};

/**
 * Parameters of {@link translateSegments}.
 * @typedef {object} TranslateSegmentsParams
 * @property {Translate} translate - Translates a key in the language of the CV.
 * @property {unknown} segments - Pieces of a paragraph of `.data/experiences.json`, each with
 * its `key` and `isStrong`.
 */

/**
 * Translates the pieces of a paragraph, leaving out those without translation.
 * @param {TranslateSegmentsParams} params
 * @returns {CvTextSegment[]} The pieces, in order, none when `segments` is not a list.
 */
const translateSegments = ({ translate, segments }) =>
  toEntries(segments)
    .map(({ key, isStrong }) => ({ text: translate(key), isStrong: isStrong === true }))
    .filter(({ text }) => isFilled(text));

/**
 * Parameters of {@link translateTexts}.
 * @typedef {object} TranslateTextsParams
 * @property {Translate} translate - Translates a key in the language of the CV.
 * @property {unknown} keys - Translation keys, e.g. the bullet points of a role.
 */

/**
 * Translates a list of keys, leaving out those without translation.
 * @param {TranslateTextsParams} params
 * @returns {string[]} The texts, in order, none when `keys` is not a list.
 */
const translateTexts = ({ translate, keys }) =>
  (Array.isArray(keys) ? keys : []).map(key => translate(key)).filter(isFilled);

/**
 * Parameters of {@link buildRole}.
 * @typedef {object} BuildRoleParams
 * @property {Translate} translate - Translates a key in the language of the CV.
 * @property {Record<string, any>} role - Role of `.data/experiences.json`.
 */

/**
 * Translates a role and its projects.
 * @param {BuildRoleParams} params
 * @returns {CvRole} The role, as the CV writes it.
 */
const buildRole = ({ translate, role }) => ({
  title: translate(role.titleKey),
  start: translate(role.startKey),
  end: translate(role.endKey),
  intro: translateSegments({ translate, segments: role.intro }),
  bullets: translateTexts({ translate, keys: role.bulletKeys }),
  projects: toEntries(role.projects).map(project => ({
    title: translate(project.titleKey),
    state: translate(project.stateKey),
    description: translateSegments({ translate, segments: project.description }),
    bullets: translateTexts({ translate, keys: project.bulletKeys }),
    technologies: toTexts(project.technologies),
  })),
  technologies: toTexts(role.technologies),
});

/**
 * Parameters of {@link buildExperiences}.
 * @typedef {object} BuildExperiencesParams
 * @property {Translate} translate - Translates a key in the language of the CV.
 * @property {unknown} experiences - Companies of `src/pages/Experiences/.data/experiences.json`.
 */

/**
 * Translates the experiences of the Experiences page, so the CV lists the same companies, roles,
 * projects and technologies, in the same order.
 * @param {BuildExperiencesParams} params
 * @returns {CvExperience[]} The companies, none when `experiences` is not a list.
 */
export const buildExperiences = ({ translate, experiences }) =>
  toEntries(experiences).map(experience => ({
    company: translate(experience.nameKey),
    details: [translate(experience.contractKey), translate(experience.cityKey)]
      .filter(isFilled)
      .join(DETAILS_SEPARATOR),
    roles: toEntries(experience.roles).map(role => buildRole({ translate, role })),
  }));

/**
 * Turns the projects of the Projects page, already translated, into entries of the CV.
 * @param {unknown} projects - Cards of `translateProjects` (`src/pages/Projects/utils.ts`).
 * @returns {CvProjectItem[]} The projects that have a name, none when `projects` is not a list.
 */
export const buildProjectItems = projects =>
  toEntries(projects)
    .map(({ name, type, tools, url }) => ({
      name: toText(name),
      type: toText(type),
      tools: toTexts(tools),
      url: toLinkUrl(url),
    }))
    .filter(({ name }) => isFilled(name));

/**
 * Turns the degrees of the data of the CV into entries.
 * @param {unknown} education - Degrees of `scripts/cv/.data/cv.json` in one language.
 * @returns {CvDegree[]} The degrees that have a name, none when `education` is not a list.
 */
const buildDegrees = education =>
  toEntries(education)
    .map(({ degree, period, school, description }) => ({
      degree: toText(degree),
      period: toText(period),
      school: toText(school),
      description: toText(description),
    }))
    .filter(({ degree }) => isFilled(degree));

/**
 * Parameters of {@link buildContacts}.
 * @typedef {object} BuildContactsParams
 * @property {Record<string, any>} contact - Contact details shared by every language, `contact`
 * of `scripts/cv/.data/cv.json`.
 * @property {Record<string, any>} texts - Texts of the data of the CV in the language.
 * @property {string} siteUrl - URL of the home page of the site in the language.
 * @property {string} siteDomain - Domain of the site, written for that link.
 * @property {unknown} gitHubUrl - GitHub profile of the site owner.
 */

/**
 * Lists the contact details of the header: email, phone, city, mobility, then the links to the
 * site, LinkedIn and GitHub.
 * @param {BuildContactsParams} params
 * @returns {CvLink[]} The details whose text is filled, in that order.
 */
const buildContacts = ({ contact, texts, siteUrl, siteDomain, gitHubUrl }) => {
  const email = toText(contact.email);
  const isEmailAddress = EMAIL_PATTERN.test(email);

  return [
    { text: email, url: isEmailAddress ? `${MAILTO_PREFIX}${email}` : '' },
    { text: toText(texts.phone), url: toLinkUrl(contact.phoneUrl) },
    { text: toText(texts.location), url: '' },
    { text: toText(texts.mobility), url: '' },
    { text: siteDomain, url: toLinkUrl(siteUrl) },
    { text: toLinkText(contact.linkedInUrl), url: toLinkUrl(contact.linkedInUrl) },
    { text: toLinkText(gitHubUrl), url: toLinkUrl(gitHubUrl) },
  ].filter(({ text }) => isFilled(text));
};

/**
 * Parameters of {@link buildCvContent}.
 * @typedef {object} BuildCvContentParams
 * @property {string} language - Code of the language of the CV, e.g. `fr`.
 * @property {Translate} translate - Translates a key of the site in that language, falling back
 * to French as the site does.
 * @property {HomeTexts} homeTexts - Texts of the home page in that language, from
 * `getHomeTexts`.
 * @property {any} cvData - Data of the CV, `scripts/cv/.data/cv.json`.
 * @property {unknown} experiences - Companies of `src/pages/Experiences/.data/experiences.json`.
 * @property {unknown} personalProjects - Personal projects, translated by `translateProjects`.
 * @property {unknown} freelanceProjects - Freelance projects, translated by `translateProjects`.
 * @property {string} siteUrl - URL of the home page of the site in that language.
 * @property {unknown} gitHubUrl - GitHub profile of the site owner.
 */

/**
 * Gathers everything the CV of one language writes: the name and the job title of the home page,
 * the contact details, the experiences of the Experiences page, the projects of the Projects page,
 * and the skills and the education of the data of the CV, which the site does not show.
 * @param {BuildCvContentParams} params
 * @returns {CvContent} The content, with empty texts where the data or a translation lacks one.
 * @example
 * buildCvContent({ language: 'en', translate, homeTexts, cvData, … }).experiences.title;
 * // 'Experience'
 */
export const buildCvContent = ({
  language,
  translate,
  homeTexts,
  cvData,
  experiences,
  personalProjects,
  freelanceProjects,
  siteUrl,
  gitHubUrl,
}) => {
  const texts = isEntry(cvData?.languages?.[language]) ? cvData.languages[language] : {};
  const contact = isEntry(cvData?.contact) ? cvData.contact : {};
  const documentName = translate('cvLink.text');

  return {
    language,
    title: [documentName, homeTexts.name].filter(isFilled).join(PAGE_TITLE_SEPARATOR),
    name: homeTexts.name,
    jobTitle: homeTexts.jobTitle,
    passion: homeTexts.passion,
    subtitle: homeTexts.subtitle,
    contacts: buildContacts({ contact, texts, siteUrl, siteDomain: homeTexts.site, gitHubUrl }),
    experiences: {
      title: translate('exp.pageTitle'),
      items: buildExperiences({ translate, experiences }),
    },
    projects: {
      title: translate('projects.pageTitle'),
      items: [
        { title: translate('projects.freelance'), items: buildProjectItems(freelanceProjects) },
        { title: translate('projects.personal'), items: buildProjectItems(personalProjects) },
      ].filter(({ items }) => items.length > 0),
    },
    skills: { title: toText(texts.skillsTitle), items: toTexts(texts.skills) },
    education: { title: toText(texts.educationTitle), items: buildDegrees(texts.education) },
  };
};
