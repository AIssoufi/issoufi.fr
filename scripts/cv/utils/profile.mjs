// @ts-check
import { isFilled, toEntries, toText, toTexts } from './data.mjs';
import { toLinkText, toLinkUrl } from './links.mjs';

/** @typedef {import('./types.mjs').CvLabeledLink} CvLabeledLink */
/** @typedef {import('./types.mjs').CvProfile} CvProfile */
/** @typedef {import('./types.mjs').CvSkillGroup} CvSkillGroup */

/**
 * Tells whether a link of the proof can be written: it has a label and a web address.
 * @param {CvLabeledLink} link - Link to check.
 * @returns {boolean} False when its label or its text is empty.
 */
const isCompleteLink = ({ label, text }) => isFilled(label) && isFilled(text);

/**
 * Turns the links to the proof of the profile into labeled links, written without their scheme.
 * @param {unknown} links - `proofLinks` of `scripts/cv/.data/cv.json` in one language, each with
 * its `label` and its `url`.
 * @returns {CvLabeledLink[]} The links that have a label and a web address, in order, none when
 * `links` is not a list.
 */
const buildProofLinks = links =>
  toEntries(links)
    .map(({ label, url }) => ({ label: toText(label), text: toLinkText(url), url: toLinkUrl(url) }))
    .filter(isCompleteLink);

/**
 * Reads the profile that opens the CV: a summary of the role, the scope and the practice of its
 * author, then where to check that practice.
 * @param {Record<string, any>} texts - Texts of the data of the CV in the language.
 * @returns {CvProfile} The profile, with empty texts where the data lacks one.
 * @example
 * buildProfile(cvData.languages.en).proofLinks[0];
 * // { label: 'Code', text: 'github.com/AIssoufi/issoufi.fr', url: 'https://github.com/…' }
 */
export const buildProfile = texts => ({
  title: toText(texts.profileTitle),
  summary: toText(texts.summary),
  proof: toText(texts.proof),
  proofLinks: buildProofLinks(texts.proofLinks),
});

/**
 * Tells whether a group of skills can be written: it has a category and a skill.
 * @param {CvSkillGroup} group - Group to check.
 * @returns {boolean} False when its category is empty or it has no skill.
 */
const isCompleteGroup = ({ category, items }) => isFilled(category) && items.length > 0;

/**
 * Reads the skills of the CV, grouped by category, each skill written as the job descriptions
 * write it, so a recruiter and a screening tool find the terms they search.
 * @param {unknown} skills - `skills` of `scripts/cv/.data/cv.json` in one language, each group
 * with its `category` and its `items`.
 * @returns {CvSkillGroup[]} The groups that have a category and a skill, in order, none when
 * `skills` is not a list.
 * @example
 * buildSkillGroups([{ category: 'Front-end', items: ['React.js', ''] }]);
 * // [{ category: 'Front-end', items: ['React.js'] }]
 */
export const buildSkillGroups = skills =>
  toEntries(skills)
    .map(({ category, items }) => ({ category: toText(category), items: toTexts(items) }))
    .filter(isCompleteGroup);
