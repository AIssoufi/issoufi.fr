import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/constants';
import type { Language } from '../i18n/types';
import { getLanguagePrefix, isLanguage, localizePath, removeLanguagePrefix } from '../i18n/utils';

/** Production origin of the site, without a trailing slash. Used to build canonical URLs. */
export const SITE_URL = 'https://issoufi.fr';

/**
 * Path of the link preview image of each language, a 1200 × 630 JPEG of `public/` that
 * `pnpm og-image` (`scripts/og-image/`) draws from the home page texts in that language. Every
 * page of a language points to it in its `og:image` (see {@link getOgImageUrl}).
 */
export const OG_IMAGE_PATHS = {
  fr: '/og-image.jpg',
  en: '/og-image-en.jpg',
} as const satisfies Record<Language, string>;

/**
 * Builds the absolute URL of the link preview image of a language, the `og:image` of its pages.
 *
 * @param language - Language of the image. A value that is not one of the `LANGUAGES` counts as
 * the default language.
 *
 * @example
 * getOgImageUrl('fr'); // 'https://issoufi.fr/og-image.jpg'
 * getOgImageUrl('en'); // 'https://issoufi.fr/og-image-en.jpg'
 */
export const getOgImageUrl = (language: unknown): string => {
  const imageLanguage = isLanguage(language) ? language : DEFAULT_LANGUAGE;
  return `${SITE_URL}${OG_IMAGE_PATHS[imageLanguage]}`;
};

/**
 * Routes that get their own HTML file at build time in every language, so link previews and
 * search engines see their title, description, canonical URL and translations without running
 * JavaScript, and the browser downloads the chunk of a lazily loaded page at the same time as the
 * app. Each `path` and `fileName` is the one of the default language; the other languages put them
 * behind their prefix (see {@link getPageFiles}). Every route declared in `App.tsx` needs an entry
 * here.
 */
export const PAGES = [
  { path: '/', meta: 'home', fileName: 'index.html', folder: 'Home' },
  { path: '/projects', meta: 'projects', fileName: 'projects.html', folder: 'Projects' },
  {
    path: '/experiences',
    meta: 'experiences',
    fileName: 'experiences.html',
    folder: 'Experiences',
  },
] as const;

/**
 * One entry of {@link PAGES}: the route `path`, the `meta` translation key holding its title
 * and description, the `fileName` generated for it in `dist`, and the `folder` of its page in
 * `src/pages`, whose `index.ts` is the module of its chunk when the page is loaded lazily.
 */
export type Page = (typeof PAGES)[number];

/**
 * Finds the page declared for a route path, in any language.
 *
 * @param pathname - Path of the current URL, e.g. `location.pathname`. A language prefix and a
 * trailing slash are ignored.
 * @returns The matching page, or `undefined` when no page exists at that path.
 *
 * @example
 * getPage('/projects/'); // { path: '/projects', meta: 'projects', fileName: 'projects.html' }
 * getPage('/en/projects'); // the same page
 * getPage('/skills'); // undefined
 */
export function getPage(pathname: string): Page | undefined {
  const path = removeLanguagePrefix(pathname).replace(/\/+$/, '') || '/';
  return PAGES.find(page => page.path === path);
}

/** Parameters of {@link getLanguageFileName}. */
interface GetLanguageFileNameParams {
  /** Name of the file in the default language, at the root of the build, e.g. `projects.html`. */
  fileName: string;
  /** Language of the file. */
  language: Language;
}

/**
 * Names the HTML file of a page in a language: at the root of the build for the default language,
 * in the folder of its prefix for the others, which Cloudflare Pages serves at the URLs of that
 * prefix (`en/projects.html` at `/en/projects`, `en/index.html` at `/en/`).
 *
 * @returns The path of the file in the build.
 *
 * @example
 * getLanguageFileName({ fileName: 'projects.html', language: 'fr' }); // 'projects.html'
 * getLanguageFileName({ fileName: 'projects.html', language: 'en' }); // 'en/projects.html'
 */
export function getLanguageFileName({ fileName, language }: GetLanguageFileNameParams): string {
  const prefix = getLanguagePrefix(language);
  // The prefix starts with the slash that roots the URL, which a path of the build has not
  const folder = prefix ? `${prefix.slice(1)}/` : '';
  return `${folder}${fileName}`;
}

/** HTML file of a page in one language, emitted at build time. */
export interface PageFile {
  /** Page the file shows. */
  page: Page;
  /** Language of the file. */
  language: Language;
  /** Path of the file in the build, e.g. `en/projects.html`. */
  fileName: string;
}

/**
 * Lists the HTML file of every page of {@link PAGES} in every language of `LANGUAGES`, language
 * by language, in the order of `PAGES`.
 *
 * @example
 * getPageFiles().map(({ fileName }) => fileName);
 * // ['index.html', 'projects.html', 'experiences.html', 'en/index.html', 'en/projects.html', …]
 */
export const getPageFiles = (): PageFile[] =>
  LANGUAGES.flatMap(language =>
    PAGES.map(page => ({
      page,
      language,
      fileName: getLanguageFileName({ fileName: page.fileName, language }),
    })),
  );

/**
 * Home page, the first entry of {@link PAGES}. In the default language, its HTML file is
 * `index.html` itself, which Vite writes from the template.
 */
export const [HOME_PAGE] = PAGES;

/**
 * Tells whether a page file is the home page of the default language, `index.html`, which Vite
 * writes itself from the template, rather than a file the build emits.
 *
 * @param file - Page file of {@link getPageFiles}.
 *
 * @example
 * isTemplatePageFile({ page: HOME_PAGE, language: 'fr', fileName: 'index.html' }); // true
 * isTemplatePageFile({ page: HOME_PAGE, language: 'en', fileName: 'en/index.html' }); // false
 */
export const isTemplatePageFile = ({ page, language }: PageFile): boolean =>
  page === HOME_PAGE && language === DEFAULT_LANGUAGE;

/** Parameters of {@link getPageUrl}. */
interface GetPageUrlParams {
  /** Path of the page in the default language, e.g. `/projects`. */
  path: string;
  /** Language of the URL. */
  language: Language;
}

/**
 * Builds the absolute URL of a page in a language, its canonical URL.
 *
 * @example
 * getPageUrl({ path: '/', language: 'fr' }); // 'https://issoufi.fr/'
 * getPageUrl({ path: '/projects', language: 'en' }); // 'https://issoufi.fr/en/projects'
 */
export const getPageUrl = ({ path, language }: GetPageUrlParams): string =>
  `${SITE_URL}${localizePath({ path, language })}`;

/**
 * Name of the file that Cloudflare Pages and GitHub Pages serve, with a 404 status, for any path
 * that matches no file. Its presence turns off the single-page-app fallback of Cloudflare Pages,
 * which is fine because every route in {@link PAGES} has its own HTML file. Cloudflare Pages
 * serves the closest one up the folders of the path, so each language has its own, in the folder
 * of its prefix (see {@link getNotFoundFiles}).
 */
export const NOT_FOUND_FILE_NAME = '404.html';

/** Folder of the page that {@link NOT_FOUND_FILE_NAME} shows, in `src/pages`. */
export const NOT_FOUND_FOLDER = 'NotFound';

/** Not found page of one language, emitted at build time. */
export interface NotFoundFile {
  /** Language of the page. */
  language: Language;
  /** Path of the file in the build, e.g. `en/404.html`. */
  fileName: string;
}

/**
 * Lists the not found page of every language of `LANGUAGES`: `404.html` for the default language,
 * `en/404.html` for English, which Cloudflare Pages serves for the unknown paths under `/en/`.
 */
export const getNotFoundFiles = (): NotFoundFile[] =>
  LANGUAGES.map(language => ({
    language,
    fileName: getLanguageFileName({ fileName: NOT_FOUND_FILE_NAME, language }),
  }));
