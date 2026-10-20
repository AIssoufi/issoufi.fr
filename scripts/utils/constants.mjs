// @ts-check
// Constants shared by the scripts that render a page of the site in Chromium: the link preview
// images (`scripts/og-image/`) and the CV (`scripts/cv/`).

/** Folder whose files the site serves at its root, relative to the project root. */
export const PUBLIC_DIR = 'public';

/**
 * Media type of each extension of the files that a page can load as a data URL: the images, the
 * web fonts of the site and the static font files of the CV.
 */
export const DATA_URL_MEDIA_TYPES = {
  '.avif': 'image/avif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/** Font size at which a page checks that each font it uses has loaded. */
export const FONT_CHECK_SIZE_PX = 16;

/**
 * Translations of each language, read through Vite (`loadSiteModules`): each module exports them
 * under the code of its language (`fr` in `fr.ts`). The scripts render every language of the
 * site, from its texts.
 */
export const TRANSLATION_MODULES = {
  fr: '/src/i18n/fr.ts',
  en: '/src/i18n/en.ts',
};

/** Text of the logo of the header (`LOGO_TEXT` of `src/App/Header/Logo/constants.ts`). */
export const LOGO_TEXT = 'AI';

/** Design skills in bold in the line under the job title, as on the home page (`Home.tsx`). */
export const DESIGN_SKILLS = ['UX', 'UI'];

/** Text between the author's name and the job title in the title of the home page. */
export const PAGE_TITLE_SEPARATOR = ' - ';
