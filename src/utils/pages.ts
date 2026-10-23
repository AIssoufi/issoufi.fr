import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/constants.ts';
import type { Language } from '../i18n/types.ts';
import {
  getLanguagePrefix,
  isLanguage,
  localizePath,
  removeLanguagePrefix,
} from '../i18n/utils.ts';
import { theme } from '../theme/theme.ts';
import { isNonBlankString } from './strings.ts';

/**
 * Production origin of the site, without a trailing slash. Used to build canonical URLs. The CI
 * scripts check the same address, their own `SITE_URL` (`scripts/ci/constants.mjs`), and
 * `public/robots.txt` declares the sitemap there: the `production address` tests of
 * `scripts/ci/utils/pages.spec.js` fail when one of the three changes alone.
 */
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
 * Photo covering the screen behind a page, under its dark overlay: two files of `public/`, each
 * written as one whole absolute URL, which the standalone build makes relative to its page, and a
 * tiny version written in the page itself.
 */
export interface BackgroundPhoto {
  /** URL of the whole photo, shown on every screen but narrow portrait ones, e.g. `/home.webp`. */
  url: string;
  /**
   * URL of its lighter portrait version, shown where {@link PORTRAIT_PHOTO_MEDIA_QUERY} matches,
   * e.g. `/home-portrait.webp`: the center of the photo in 3:4, what such a screen shows of the
   * whole photo, at a lower resolution.
   */
  portraitUrl: string;
  /**
   * Data URL of a tiny version of the whole photo, 32 px wide, which the page shows enlarged, so
   * blurred, under the photo: written in the code of the app, it needs no request and shows with
   * the text, so the page never goes from black to the photo once the photo is downloaded.
   */
  placeholderUrl: string;
}

/**
 * Media query of the screens that show the portrait version of a {@link BackgroundPhoto}: narrower
 * than the tablet breakpoint and in portrait, as a phone held upright. The other screens, landscape
 * phones included, show the whole photo, framed as before. The style of `Page`, the preloads that
 * the build writes in the HTML of each page (`addPrerenderedPage`) and the preload of the photo
 * when the app starts (`src/preloadBackgroundPhoto.ts`) all read it, so a browser downloads only
 * the version that it shows.
 */
export const PORTRAIT_PHOTO_MEDIA_QUERY = `(orientation: portrait) and (width < ${theme.screens.tablet})`;

/**
 * Media query of the screens that show the whole version of a {@link BackgroundPhoto}: every
 * screen that {@link PORTRAIT_PHOTO_MEDIA_QUERY} leaves out, so that a browser matches exactly one
 * of them.
 */
export const LANDSCAPE_PHOTO_MEDIA_QUERY = `not all and ${PORTRAIT_PHOTO_MEDIA_QUERY}`;

/**
 * Home page, the first entry of {@link PAGES}. In the default language, its HTML file is
 * `index.html` itself, which Vite writes from the template.
 */
export const HOME_PAGE = {
  path: '/',
  meta: 'home',
  fileName: 'index.html',
  folder: 'Home',
  backgroundPhoto: {
    url: '/home.webp',
    portraitUrl: '/home-portrait.webp',
    placeholderUrl:
      'data:image/webp;base64,UklGRjQBAABXRUJQVlA4ICgBAADQBQCdASogABYAPtFUo0uoJKMhsAgBABoJZgCuHYxinDlETSrB7m5u+XMQWvVkyNMrAXtNg/agAPZ3HlmiXGvwqAAVccCdh4MXckPyw/kUwofEYv4G7P/uIAT2EWfKf/0moY3cmoYMwqQ4ZIoN+1vWA8Suu8c/PAoxPt2W39bXUDvn55tGeoFBuzZZ9AuBSV576MVGAkeCKLiB80/A3VR7AH+/sPZwsD+ojfzQAqJA9LzmLz/rhND6vQ6YRu9lC2SfQ6fw19Wv5Qpm33ov8uEV6D8uTPfhFgYFKr7RfVxfbYWVJFw19L849RVdY72GxdGGI0egefwh/CbO9JT81lAUDiau2ZTkqiXbS2/nqtPN/fE+gBhx76aju08GpagxBmaS2GBwEkAAAA==',
  },
} as const;

/** Projects page, an entry of {@link PAGES}. */
export const PROJECTS_PAGE = {
  path: '/projects',
  meta: 'projects',
  fileName: 'projects.html',
  folder: 'Projects',
  backgroundPhoto: {
    url: '/projects.webp',
    portraitUrl: '/projects-portrait.webp',
    placeholderUrl:
      'data:image/webp;base64,UklGRpwAAABXRUJQVlA4IJAAAABwBACdASogABYAPtFYpEuoJSOhsAgBABoJQBdmW+Bpt/l5jbP7YEktJrO6IAD+7EAM1xhnG6LbJsn4LcCwztk+KQVOSTVvqAW9fQ5o+DFKOEqtGztNm5qhO6sQlUZ36ktuqMFOesO9XtuwaU2QHhMPG13eEwpW72sOHvZp9+R3oD8obaOuxt8JV79vwHAAAAA=',
  },
} as const;

/** Experiences page, an entry of {@link PAGES}. */
export const EXPERIENCES_PAGE = {
  path: '/experiences',
  meta: 'experiences',
  fileName: 'experiences.html',
  folder: 'Experiences',
  backgroundPhoto: {
    url: '/experiences.webp',
    portraitUrl: '/experiences-portrait.webp',
    placeholderUrl:
      'data:image/webp;base64,UklGRpwAAABXRUJQVlA4IJAAAABQBQCdASogABYAPtFcoEwoJaMiMBgMAQAaCUATplvgpEOU7m8qsMFyrlKfkdJIJdXKhqAA/vbftWZT+DtFeTcc1wL0QkP0+JKqN2a3hLZMA7oExM7rZpr5J0YGJ03ru4+6N0rT31neK1tZ0U+ZNKS5dA7hUkFf7gZPzZh6Jm0bHGbmeDkGA7ioPoWgaWuAAAA=',
  },
} as const;

/**
 * Routes that get their own HTML file at build time in every language, so link previews and
 * search engines see their title, description, canonical URL and translations without running
 * JavaScript, and the browser downloads the chunk of a lazily loaded page at the same time as the
 * app. Each `path` and `fileName` is the one of the default language; the other languages put them
 * behind their prefix (see {@link getPageFiles}). Every route declared in `App.tsx` needs an entry
 * here, and each page shows the `backgroundPhoto` of its entry.
 */
export const PAGES = [HOME_PAGE, PROJECTS_PAGE, EXPERIENCES_PAGE] as const;

/**
 * One entry of {@link PAGES}: the route `path`, the `meta` translation key holding its title
 * and description, the `fileName` generated for it in `dist`, the `folder` of its page in
 * `src/pages`, whose `index.ts` is the module of its chunk when the page is loaded lazily, and the
 * `backgroundPhoto` that the page shows and that the app preloads as soon as it starts.
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

/** Parameters of {@link getBackgroundPhotoUrl}. */
interface GetBackgroundPhotoUrlParams {
  /** Path of the current URL, e.g. `location.pathname`, in any language. */
  pathname?: string;
  /**
   * Whether the screen matches {@link PORTRAIT_PHOTO_MEDIA_QUERY}, so shows the portrait version
   * of the photo. @default false
   */
  isPortraitScreen?: boolean;
}

/**
 * Finds the file of the background photo that the page at a path shows on the screen, as the
 * style of `Page` picks it: the portrait version on narrow portrait screens, the whole photo on
 * the others.
 *
 * @returns Its URL, or an empty string for a path of no page of {@link PAGES}, such as an unknown
 * path, which shows the not found page, or the path of the file of the standalone build, whose
 * routes are in the hash of the URL.
 *
 * @example
 * getBackgroundPhotoUrl({ pathname: '/en/projects', isPortraitScreen: true });
 * // '/projects-portrait.webp'
 * getBackgroundPhotoUrl({ pathname: '/skills' }); // ''
 */
export const getBackgroundPhotoUrl = ({
  pathname,
  isPortraitScreen = false,
}: GetBackgroundPhotoUrlParams = {}): string => {
  const photo = typeof pathname === 'string' ? getPage(pathname)?.backgroundPhoto : undefined;
  const url = isPortraitScreen === true ? photo?.portraitUrl : photo?.url;
  return isNonBlankString(url) ? url : '';
};

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
  /** Path of the page in its language, at which the build renders it, e.g. `/en/projects`. */
  path: string;
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
      path: localizePath({ path: page.path, language }),
    })),
  );

/**
 * Tells whether a page file is the home page of the default language, `index.html`, which Vite
 * writes itself from the template, rather than a file the build emits.
 *
 * @param file - Page file of {@link getPageFiles}.
 *
 * @example
 * const [frenchHome, , , englishHome] = getPageFiles();
 * isTemplatePageFile(frenchHome); // true
 * isTemplatePageFile(englishHome); // false
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

/** `hreflang` of the version of a page shown to the visitors of no listed language. */
const DEFAULT_HREFLANG = 'x-default';

/** Translation of a page, as the HTML of the page and the sitemap link to it. */
export interface PageAlternate {
  /** Language of the translation, or {@link DEFAULT_HREFLANG}. */
  hreflang: string;
  /** Absolute URL of the translation. */
  href: string;
}

/**
 * Lists the translations of a page, which search engines use to show each visitor the page in
 * their language: its URL in every language of `LANGUAGES`, the page itself included, then its URL
 * in the default language as {@link DEFAULT_HREFLANG}. The HTML file of each page links to them
 * (`renderPageHtml`), and so does the sitemap (`renderSitemap`), so both list the same ones.
 *
 * @param path - Path of the page in the default language, e.g. `/projects`.
 *
 * @example
 * getPageAlternates('/projects');
 * // [
 * //   { hreflang: 'fr', href: 'https://issoufi.fr/projects' },
 * //   { hreflang: 'en', href: 'https://issoufi.fr/en/projects' },
 * //   { hreflang: 'x-default', href: 'https://issoufi.fr/projects' },
 * // ]
 */
export const getPageAlternates = (path: string): PageAlternate[] => [
  ...LANGUAGES.map(language => ({ hreflang: language, href: getPageUrl({ path, language }) })),
  { hreflang: DEFAULT_HREFLANG, href: getPageUrl({ path, language: DEFAULT_LANGUAGE }) },
];

/**
 * Name of the file that Cloudflare Pages and GitHub Pages serve, with a 404 status, for any path
 * that matches no file. Its presence turns off the single-page-app fallback of Cloudflare Pages,
 * which is fine because every route in {@link PAGES} has its own HTML file. Cloudflare Pages
 * serves the closest one up the folders of the path, so each language has its own, in the folder
 * of its prefix (see {@link getNotFoundFiles}).
 */
const NOT_FOUND_FILE_NAME = '404.html';

/** Folder of the page that {@link NOT_FOUND_FILE_NAME} shows, in `src/pages`. */
export const NOT_FOUND_FOLDER = 'NotFound';

/**
 * Path at which the build renders the not found page of the default language, and under its
 * prefix that of each other language (`/en/404`): the path of no page of {@link PAGES}, like those
 * that Cloudflare Pages answers with that page.
 */
export const NOT_FOUND_PATH = '/404';

/**
 * Photo behind every status page (not found, unexpected error), which `StatusPage` shows:
 * mountains lost in the clouds, for a visitor who lost their way. It is the photo of the home
 * page, the same object, so changing one changes both: give it its own to set them apart.
 */
export const STATUS_PAGE_BACKGROUND_PHOTO: BackgroundPhoto = HOME_PAGE.backgroundPhoto;

/** Not found page of one language, emitted at build time. */
export interface NotFoundFile {
  /** Language of the page. */
  language: Language;
  /** Path of the file in the build, e.g. `en/404.html`. */
  fileName: string;
  /** Path at which the build renders the page, e.g. `/en/404` (see {@link NOT_FOUND_PATH}). */
  path: string;
}

/**
 * Lists the not found page of every language of `LANGUAGES`: `404.html` for the default language,
 * `en/404.html` for English, which Cloudflare Pages serves for the unknown paths under `/en/`.
 */
export const getNotFoundFiles = (): NotFoundFile[] =>
  LANGUAGES.map(language => ({
    language,
    fileName: getLanguageFileName({ fileName: NOT_FOUND_FILE_NAME, language }),
    path: localizePath({ path: NOT_FOUND_PATH, language }),
  }));
