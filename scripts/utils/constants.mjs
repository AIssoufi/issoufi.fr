// @ts-check
// Constants shared by the scripts that render a page of the site in Chromium: the link preview
// images (`scripts/og-image/`) and the CV (`scripts/cv/`).

/** Page whose Google Fonts style sheet the scripts load, relative to the project root. */
export const INDEX_HTML_FILE = 'index.html';

/** Folder whose files the site serves at its root, relative to the project root. */
export const PUBLIC_DIR = 'public';

/**
 * Google Fonts style sheet link of an HTML page. Its first group captures the URL, without the
 * quotes.
 */
export const FONT_STYLESHEET_PATTERN = /href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]*)"/;

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

/** Logo of the header (`src/App/Header/Header.tsx`). */
export const LOGO_TEXT = 'AI';

/** Design skills in bold in the line under the job title, as on the home page (`Home.tsx`). */
export const DESIGN_SKILLS = ['UX', 'UI'];

/** Text between the author's name and the job title in the title of the home page. */
export const PAGE_TITLE_SEPARATOR = ' - ';
