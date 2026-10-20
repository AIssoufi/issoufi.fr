import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from '../../src/constants/profiles.ts';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../../src/i18n/constants.ts';
import { en } from '../../src/i18n/en.ts';
import { fr } from '../../src/i18n/fr.ts';
import { translateKey } from '../../src/i18n/utils.ts';
import experiences from '../../src/pages/Experiences/.data/experiences.json';
import freelanceProjects from '../../src/pages/Projects/.data/freelance-projects.json';
import personalProjects from '../../src/pages/Projects/.data/personal-projects.json';
import { translateProjects } from '../../src/pages/Projects/utils.ts';
import { getPageUrl, HOME_PAGE, SITE_URL } from '../../src/utils/pages.ts';
import cvData from './.data/cv.json';

/**
 * Modules of the site that the CV reads, as `generate-cv.mjs` passes them to `buildCvContents`
 * once Vite loaded them, so the tests build the content of the real CVs.
 */
export const CV_SOURCES = {
  languages: LANGUAGES,
  defaultLanguage: DEFAULT_LANGUAGE,
  translations: { fr, en },
  translateKey,
  translateProjects,
  getPageUrl,
  homePath: HOME_PAGE.path,
  siteUrl: SITE_URL,
  linkedInUrl: LINKEDIN_PROFILE_URL,
  gitHubUrl: GITHUB_PROFILE_URL,
  cvData,
  experiences,
  personalProjects,
  freelanceProjects,
};
