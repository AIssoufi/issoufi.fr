// @ts-check
import { PAGE_TITLE_SEPARATOR } from '../../utils/constants.mjs';
import {
  DETAILS_SEPARATOR,
  EMAIL_PATTERN,
  LANGUAGE_CODE_PATTERN,
  MAILTO_PREFIX,
} from '../constants.mjs';
import { toLinkText, toLinkUrl } from './links.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */
/** @typedef {import('./types.mjs').CvDegree} CvDegree */
/** @typedef {import('./types.mjs').CvExperience} CvExperience */
/** @typedef {import('./types.mjs').CvLink} CvLink */
/** @typedef {import('./types.mjs').CvProjectItem} CvProjectItem */
/** @typedef {import('./types.mjs').CvRole} CvRole */
/** @typedef {import('./types.mjs').CvTextSegment} CvTextSegment */
/** @typedef {import('./types.mjs').HomeTexts} HomeTexts */
/** @typedef {import('./types.mjs').Translate} Translate */

/**
 * Reads a text of the data, so a missing or misspelled field gives an empty text instead of a
 * crash.
 * @param {unknown} value - Value to read.
 * @returns {string} The value, or `''` when it is not a string.
 */
const toText = value => (typeof value === 'string' ? value : '');

/**
 * Reads a language code of the data, so that a misspelled one never gives a wrong `lang`.
 * @param {unknown} value - Value to read, e.g. the `titleLanguage` of a role.
 * @returns {string} The code, or `''` when it is not one, as `'english'` or `42`.
 */
const toLanguageCode = value => {
  const code = toText(value);
  return LANGUAGE_CODE_PATTERN.test(code) ? code : '';
};

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
  titleLanguage: toLanguageCode(role.titleLanguage),
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
 */

/**
 * Lists the contact details of the header: email, phone, city and mobility.
 * @param {BuildContactsParams} params
 * @returns {CvLink[]} The details whose text is filled, in that order, the email address and the
 * phone number as links.
 */
const buildContacts = ({ contact, texts }) => {
  const email = toText(contact.email);
  const isEmailAddress = EMAIL_PATTERN.test(email);

  return [
    { text: email, url: isEmailAddress ? `${MAILTO_PREFIX}${email}` : '' },
    { text: toText(texts.phone), url: toLinkUrl(contact.phoneUrl) },
    { text: toText(texts.location), url: '' },
    { text: toText(texts.mobility), url: '' },
  ].filter(({ text }) => isFilled(text));
};

/**
 * Parameters of {@link buildProfiles}.
 * @typedef {object} BuildProfilesParams
 * @property {string} siteUrl - URL of the home page of the site in the language.
 * @property {string} siteDomain - Domain of the site, written for that link.
 * @property {unknown} linkedInUrl - LinkedIn profile of the site owner.
 * @property {unknown} gitHubUrl - GitHub profile of the site owner.
 */

/**
 * Lists the links of the header to the site and the profiles of the site owner: the site,
 * LinkedIn and GitHub.
 * @param {BuildProfilesParams} params
 * @returns {CvLink[]} The links whose text is filled, in that order.
 */
const buildProfiles = ({ siteUrl, siteDomain, linkedInUrl, gitHubUrl }) =>
  [
    { text: siteDomain, url: toLinkUrl(siteUrl) },
    { text: toLinkText(linkedInUrl), url: toLinkUrl(linkedInUrl) },
    { text: toLinkText(gitHubUrl), url: toLinkUrl(gitHubUrl) },
  ].filter(({ text }) => isFilled(text));

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
 * @property {unknown} linkedInUrl - LinkedIn profile of the site owner.
 * @property {unknown} gitHubUrl - GitHub profile of the site owner.
 */

/**
 * Gathers everything the CV of one language writes: the name and the job title of the home page,
 * the contact details and the links to the site and the profiles of its owner, the experiences
 * of the Experiences page, the projects of the Projects page, and the skills and the education
 * of the data of the CV, which the site does not show, with the subject and the keywords that its
 * document information gives.
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
  linkedInUrl,
  gitHubUrl,
}) => {
  const texts = isEntry(cvData?.languages?.[language]) ? cvData.languages[language] : {};
  const contact = isEntry(cvData?.contact) ? cvData.contact : {};
  const documentName = translate('cvLink.documentName');

  return {
    language,
    title: [documentName, homeTexts.name, homeTexts.jobTitle]
      .filter(isFilled)
      .join(PAGE_TITLE_SEPARATOR),
    subject: toText(texts.subject),
    keywords: toTexts(texts.keywords),
    name: homeTexts.name,
    jobTitle: homeTexts.jobTitle,
    passion: homeTexts.passion,
    subtitle: homeTexts.subtitle,
    contacts: buildContacts({ contact, texts }),
    profiles: buildProfiles({
      siteUrl,
      siteDomain: homeTexts.site,
      linkedInUrl,
      gitHubUrl,
    }),
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
