// @ts-check
import { NON_WORD_CHARACTERS_PATTERN } from '../constants.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */
/** @typedef {import('./types.mjs').CvTextSegment} CvTextSegment */

/**
 * Writes a paragraph made of pieces as one text.
 * @param {{ text: string }[]} segments - Pieces of the paragraph, in order.
 * @returns {string} Their texts, one after the other.
 */
const joinSegments = segments => segments.map(({ text }) => text).join('');

/**
 * Tells whether a text would leave a hole in the CV: empty or made of spaces only.
 * @param {string} text - Text to check.
 * @returns {boolean} True for `''` and `'  '`.
 */
const isBlank = text => text.trim() === '';

/**
 * Lists every text that the CV writes, in the order of the page, so that a check can find each
 * one in the text of the PDF: a missing one means that the PDF no longer says what the site says.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {string[]} The texts, without the empty ones. A paragraph made of pieces is one text.
 * @example
 * listCvTexts(content).includes('Sewan Groupe'); // true
 */
export const listCvTexts = content => {
  const { profile, skills, experiences, projects, education } = content;
  const texts = [
    content.name,
    content.jobTitle,
    joinSegments(content.passion),
    ...content.contacts.map(({ text }) => text),
    ...content.profiles.map(({ text }) => text),
    profile.title,
    profile.summary,
    profile.proof,
    ...profile.proofLinks.flatMap(({ label, text }) => [label, text]),
    skills.title,
    ...skills.items.flatMap(({ category, items }) => [category, ...items]),
    experiences.title,
    ...experiences.items.flatMap(({ company, details, roles }) => [
      company,
      details,
      ...roles.flatMap(role => [
        role.title,
        role.start,
        role.end,
        joinSegments(role.intro),
        ...role.bullets,
        ...role.projects.flatMap(project => [
          project.title,
          project.state,
          joinSegments(project.description),
          ...project.bullets,
          ...project.technologies,
        ]),
        ...role.technologies,
      ]),
    ]),
    projects.title,
    ...projects.items.flatMap(({ title, items }) => [title, ...items.map(({ name }) => name)]),
    education.title,
    ...education.items.flatMap(({ degree, period, school }) => [degree, period, school]),
  ];
  return texts.filter(text => !isBlank(text));
};

/**
 * Lists every link of the CV: the contact details that are links, the site and the profiles of
 * its owner, the proof of its profile, and the projects that have a URL.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {string[]} The URLs, in the order of the page.
 */
export const listCvLinks = content => [
  ...[...content.contacts, ...content.profiles, ...content.profile.proofLinks]
    .map(({ url }) => url)
    .filter(Boolean),
  ...content.projects.items.flatMap(({ items }) => items.map(({ url }) => url).filter(Boolean)),
];

/**
 * Lists the texts that the CV cannot do without, each with its path in the content.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {[string, string][]} The path and the text of each one, in the order of the page.
 */
const listRequiredTexts = content => {
  const { profile, skills, experiences, projects, education } = content;
  /** @type {[string, string][]} */
  const texts = [
    ['title', content.title],
    ['subject', content.subject],
    ['name', content.name],
    ['jobTitle', content.jobTitle],
    ['labelSeparator', content.labelSeparator],
    ['profile.title', profile.title],
    ['profile.summary', profile.summary],
    ['profile.proof', profile.proof],
    ['skills.title', skills.title],
    ['experiences.title', experiences.title],
  ];
  experiences.items.forEach(({ company, roles }, index) => {
    const path = `experiences.items[${index}]`;
    texts.push([`${path}.company`, company]);
    roles.forEach(({ title, start, end, projects: roleProjects }, roleIndex) => {
      const rolePath = `${path}.roles[${roleIndex}]`;
      texts.push(
        [`${rolePath}.title`, title],
        [`${rolePath}.start`, start],
        [`${rolePath}.end`, end],
      );
      roleProjects.forEach(({ title: projectTitle }, projectIndex) => {
        texts.push([`${rolePath}.projects[${projectIndex}].title`, projectTitle]);
      });
    });
  });
  texts.push(['projects.title', projects.title]);
  projects.items.forEach(({ title }, index) =>
    texts.push([`projects.items[${index}].title`, title]),
  );
  texts.push(['education.title', education.title]);
  return texts;
};

/**
 * Writes a text as a search for whole words compares it: its words in lower case, with a space
 * between them and around them, so that a word is found only where it stands whole.
 * @param {string} text - Text to write.
 * @returns {string} The text, e.g. ` node js ` for `Node.js`.
 */
const toSearchableWords = text =>
  ` ${text.toLowerCase().replace(NON_WORD_CHARACTERS_PATTERN, ' ').trim()} `;

/**
 * Lists the keywords of the document information that no text of the CV holds as whole words,
 * whatever their case and punctuation, so that its information only names what a reader of the CV
 * finds in it: a recruiting tool flags a keyword written for machines alone. `React` is found in
 * `React.js`, `Java` is not in `JavaScript`.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {string[]} The keywords that the CV never writes, in their order. Empty when it writes
 * each one.
 * @example
 * findUnwrittenKeywords({ ...content, keywords: ['React', 'Angular'] }); // ['Angular']
 */
export const findUnwrittenKeywords = content => {
  const cvWords = listCvTexts(content).map(toSearchableWords).join('');
  /** @param {string} keyword */
  const isWritten = keyword => cvWords.includes(toSearchableWords(keyword));
  return content.keywords.filter(keyword => !isWritten(keyword));
};

/**
 * Lists the texts that the CV cannot do without and that are empty, so the script stops instead
 * of writing a CV with a hole, as when a translation key is misspelled.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {string[]} The path of each missing text in the content, e.g.
 * `experiences.items[1].roles[0].title`, then of each empty list, e.g. `skills.items`, then
 * `passion` when a piece of that line is empty. Empty when nothing is missing.
 * @example
 * findMissingCvTexts({ ...content, name: '' }); // ['name']
 */
export const findMissingCvTexts = content => {
  const missingTexts = listRequiredTexts(content)
    .filter(([, text]) => isBlank(text))
    .map(([path]) => path);
  /** @type {[string, unknown[]][]} */
  const requiredLists = [
    ['keywords', content.keywords],
    ['contacts', content.contacts],
    ['profiles', content.profiles],
    ['profile.proofLinks', content.profile.proofLinks],
    ['skills.items', content.skills.items],
    ['experiences.items', content.experiences.items],
    ['education.items', content.education.items],
  ];
  const emptyLists = requiredLists.filter(([, items]) => items.length === 0).map(([path]) => path);
  const isPassionIncomplete = content.passion.some(({ text }) => isBlank(text));

  return [...missingTexts, ...emptyLists, ...(isPassionIncomplete ? ['passion'] : [])];
};
