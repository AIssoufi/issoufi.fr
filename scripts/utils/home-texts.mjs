// @ts-check
import { DESIGN_SKILLS, LOGO_TEXT, PAGE_TITLE_SEPARATOR } from './constants.mjs';

/**
 * A piece of the line about design, under the job title.
 * @typedef {object} TextSegment
 * @property {string} text - Text of the piece.
 * @property {boolean} isHighlighted - Whether it is one of the design skills, in bold.
 */

/**
 * Texts of the home page, which the link preview image and the CV write.
 * @typedef {object} HomeTexts
 * @property {string} logo - Logo of the header.
 * @property {string} name - Name of the site's author, which the job title follows.
 * @property {string} jobTitle - Job title, the largest text of the home page.
 * @property {TextSegment[]} passion - Line about UX and UI design, under the job title.
 * @property {string} subtitle - Line under it.
 * @property {string} site - Domain of the site.
 */

/**
 * Reads a text of the translations, so a missing or misspelled key gives an empty text that
 * {@link findMissingTexts} reports, instead of a crash.
 * @param {unknown} value - Translation to read.
 * @returns {string} The translation, or `''` when it is not a string.
 */
const toText = value => (typeof value === 'string' ? value : '');

/**
 * Parameters of {@link getAuthorName}.
 * @typedef {object} GetAuthorNameParams
 * @property {unknown} pageTitle - Title of the home page, `meta.home.title` of the translations,
 * e.g. `ADAM Issoufi - Développeur full-stack JavaScript`.
 * @property {unknown} jobTitle - Job title that ends it, `home.title1` of the translations.
 */

/**
 * Reads the name of the site's author in the title of the home page, which is the name followed
 * by the job title.
 * @param {GetAuthorNameParams} params
 * @returns {string} The name, or `''` when the title does not end with the job title, or when
 * either is not a string.
 * @example
 * getAuthorName({ pageTitle: 'ADAM Issoufi - Développeur', jobTitle: 'Développeur' });
 * // 'ADAM Issoufi'
 */
export const getAuthorName = ({ pageTitle, jobTitle }) => {
  const title = toText(pageTitle);
  const titleEnd = `${PAGE_TITLE_SEPARATOR}${toText(jobTitle)}`;
  const isNameThenJobTitle = toText(jobTitle) !== '' && title.endsWith(titleEnd);
  return isNameThenJobTitle ? title.slice(0, -titleEnd.length).trim() : '';
};

/**
 * Reads the domain of the site in its URL.
 * @param {unknown} siteUrl - Origin of the site, `SITE_URL` of `src/utils/pages.ts`.
 * @returns {string} The domain, e.g. `issoufi.fr`, or `''` when the value is not a URL.
 */
const getSiteDomain = siteUrl =>
  URL.canParse(toText(siteUrl)) ? new URL(toText(siteUrl)).host : '';

/**
 * Parameters of {@link getHomeTexts}.
 * @typedef {object} GetHomeTextsParams
 * @property {any} translations - Translations of one language, e.g. `fr` of
 * `src/i18n/fr.ts` or `en` of `src/i18n/en.ts`.
 * @property {unknown} siteUrl - Origin of the site, `SITE_URL` of `src/utils/pages.ts`.
 */

/**
 * Gathers the texts of the home page from the translations of one language, so that a page
 * rendered by a script says what the home page says in that language.
 * @param {GetHomeTextsParams} params
 * @returns {HomeTexts} The texts, empty where a translation is missing.
 * @example
 * getHomeTexts({ translations: fr, siteUrl: SITE_URL }).subtitle;
 * // 'Je vous aide à développer vos applications web'
 * getHomeTexts({ translations: en, siteUrl: SITE_URL }).subtitle;
 * // 'I help you build web applications'
 */
export const getHomeTexts = ({ translations, siteUrl }) => {
  const home = translations?.home;
  const jobTitle = toText(home?.title1);
  const [firstSkill, secondSkill] = DESIGN_SKILLS;

  return {
    logo: LOGO_TEXT,
    name: getAuthorName({ pageTitle: translations?.meta?.home?.title, jobTitle }),
    jobTitle,
    passion: [
      { text: toText(home?.title2Pre), isHighlighted: false },
      { text: firstSkill, isHighlighted: true },
      { text: toText(home?.title2Mid), isHighlighted: false },
      { text: secondSkill, isHighlighted: true },
      { text: toText(home?.title2Post), isHighlighted: false },
    ],
    subtitle: toText(home?.subtitle),
    site: getSiteDomain(siteUrl),
  };
};

/**
 * Tells whether a text would leave a hole in a page: empty or made of spaces only.
 * @param {string} text - Text to check.
 * @returns {boolean} True for `''` and `'  '`.
 */
const isBlank = text => text.trim() === '';

/**
 * Lists the texts of the home page that are empty or blank, so a script stops instead of writing
 * a page with a hole.
 * @param {HomeTexts} texts - Texts from {@link getHomeTexts}.
 * @returns {string[]} The names of the empty texts, e.g. `['subtitle']`, and `passion` when a
 * piece of that line is empty. Empty when every text is there.
 */
export const findMissingTexts = texts => {
  const { passion, ...singleTexts } = texts;
  const missingTexts = Object.entries(singleTexts)
    .filter(([, text]) => isBlank(text))
    .map(([name]) => name);
  const isPassionIncomplete = passion.some(({ text }) => isBlank(text));
  return isPassionIncomplete ? [...missingTexts, 'passion'] : missingTexts;
};
