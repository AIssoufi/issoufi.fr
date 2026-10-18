// @ts-check
import i18next from 'i18next';

import { getHomeTexts } from '../../utils/home-texts.mjs';
import { buildCvContent } from './content.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */
/** @typedef {import('i18next').TFunction} TFunction */

/**
 * Parameters of {@link buildCvContents}: the modules of the site that the CV reads, which the
 * script loads through Vite and the tests import.
 * @typedef {object} BuildCvContentsParams
 * @property {readonly string[]} languages - Languages of the site, `LANGUAGES`: one CV each.
 * @property {string} defaultLanguage - Language whose texts replace a missing translation,
 * `DEFAULT_LANGUAGE`, as on the site.
 * @property {Record<string, any>} translations - Translations of each language, by its code.
 * @property {(params: { t: TFunction, key?: unknown }) => string} translateKey - `translateKey`
 * of `src/i18n/utils.ts`.
 * @property {(params: { projects?: any, t: TFunction }) => unknown} translateProjects -
 * `translateProjects` of `src/pages/Projects/utils.ts`.
 * @property {(params: { path: string, language: any }) => string} getPageUrl - `getPageUrl` of
 * `src/utils/pages.ts`.
 * @property {string} homePath - Path of the home page, whose URL in each language the CV links
 * to.
 * @property {string} siteUrl - Origin of the site, `SITE_URL`, whose domain the CV writes.
 * @property {string} gitHubUrl - GitHub profile of the site owner, `GITHUB_PROFILE_URL`.
 * @property {any} cvData - Data of the CV, `scripts/cv/.data/cv.json`.
 * @property {any} experiences - Companies of `src/pages/Experiences/.data/experiences.json`.
 * @property {any} personalProjects - Projects of `src/pages/Projects/.data/personal-projects.json`.
 * @property {any} freelanceProjects - Projects of
 * `src/pages/Projects/.data/freelance-projects.json`.
 */

/**
 * Gathers the content of the CV of every language of the site, each from the texts of the site
 * in that language, translated by i18next as on the site, so that a text missing in a language
 * falls back to the default one.
 * @param {BuildCvContentsParams} params
 * @returns {Promise<CvContent[]>} The content of each CV, in the order of `languages`.
 * @example
 * const [french, english] = await buildCvContents({ languages: LANGUAGES, … });
 * english.jobTitle; // 'Full-stack JavaScript Developer'
 */
export const buildCvContents = ({
  languages,
  defaultLanguage,
  translations,
  translateKey,
  translateProjects,
  getPageUrl,
  homePath,
  siteUrl,
  gitHubUrl,
  cvData,
  experiences,
  personalProjects,
  freelanceProjects,
}) =>
  Promise.all(
    languages.map(async language => {
      const i18n = i18next.createInstance();
      await i18n.init({
        resources: Object.fromEntries(
          Object.entries(translations).map(([code, translation]) => [code, { translation }]),
        ),
        lng: language,
        fallbackLng: defaultLanguage,
        // The template of the CV escapes every text itself
        interpolation: { escapeValue: false },
        showSupportNotice: false,
      });
      const { t } = i18n;

      return buildCvContent({
        language,
        translate: key => translateKey({ t, key }),
        homeTexts: getHomeTexts({ translations: translations[language], siteUrl }),
        cvData,
        experiences: experiences?.experiences,
        personalProjects: translateProjects({ projects: personalProjects?.projects, t }),
        freelanceProjects: translateProjects({ projects: freelanceProjects?.projects, t }),
        siteUrl: getPageUrl({ path: homePath, language }),
        gitHubUrl,
      });
    }),
  );
