import { fr } from '../i18n/fr';

/** Production origin of the site, without a trailing slash. Used to build canonical URLs. */
export const SITE_URL = 'https://issoufi.fr';

/**
 * Routes that get their own HTML file at build time, so link previews and search engines see
 * their title, description and canonical URL without running JavaScript, and the browser
 * downloads the chunk of a lazily loaded page at the same time as the app.
 * Every route declared in `App.tsx` needs an entry here.
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
 * Finds the page declared for a route path.
 *
 * @param pathname - Path of the current URL, e.g. `location.pathname`. A trailing slash is ignored.
 * @returns The matching page, or `undefined` when no page exists at that path.
 *
 * @example
 * getPage('/projects/'); // { path: '/projects', meta: 'projects', fileName: 'projects.html' }
 * getPage('/skills'); // undefined
 */
export function getPage(pathname: string): Page | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  return PAGES.find(page => page.path === path);
}

/** Escapes a value for use inside a double-quoted HTML attribute or a text node. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Key of a page's title and description in the `meta` translations. */
type PageMetaKey = keyof typeof fr.meta;

/** Parameters of {@link fillPlaceholders}. */
interface FillPlaceholdersParams {
  /** HTML containing the `%PAGE_*%` placeholders. */
  template: string;
  /** Translation key of the title and description to inject. */
  meta: PageMetaKey;
  /** Absolute URL injected as the canonical and `og:url`. */
  url: string;
  /** Years of experience, replacing `{{years}}` in the description. */
  years: number;
}

/** Replaces every `%PAGE_*%` placeholder with the French metadata and the URL, HTML-escaped. */
function fillPlaceholders({ template, meta, url, years }: FillPlaceholdersParams): string {
  const { title, description } = fr.meta[meta];
  const values: Record<string, string> = {
    PAGE_TITLE: title,
    PAGE_DESCRIPTION: description.replace(/{{years}}/g, String(years)),
    PAGE_URL: url,
  };

  return template.replace(/%(PAGE_TITLE|PAGE_DESCRIPTION|PAGE_URL)%/g, (_, key: string) =>
    escapeHtml(values[key]),
  );
}

/** Parameters of {@link renderPageHtml}. */
interface RenderPageHtmlParams {
  /** Content of `index.html`, with its placeholders. */
  template: string;
  /** Page whose metadata to inject. */
  page: Page;
  /** Years of experience, replacing `{{years}}` in the description. */
  years: number;
}

/**
 * Fills the `%PAGE_TITLE%`, `%PAGE_DESCRIPTION%` and `%PAGE_URL%` placeholders of `index.html`
 * with the French metadata of a page. Used by the Vite plugin at build time.
 *
 * @returns The HTML with every placeholder replaced and HTML-escaped.
 */
export function renderPageHtml({ template, page, years }: RenderPageHtmlParams): string {
  const url = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
  return fillPlaceholders({ template, meta: page.meta, url, years });
}

/**
 * Name of the file that Cloudflare Pages and GitHub Pages serve, with a 404 status, for any path
 * that matches no file. Its presence turns off the single-page-app fallback of Cloudflare Pages,
 * which is fine because every route in {@link PAGES} has its own HTML file.
 */
export const NOT_FOUND_FILE_NAME = '404.html';

/** Folder of the page that {@link NOT_FOUND_FILE_NAME} shows, in `src/pages`. */
export const NOT_FOUND_FOLDER = 'NotFound';

const CANONICAL_TAG = /<link\s+rel="canonical"[^>]*>\s*/;
const OG_URL_TAG = /<meta\s+property="og:url"[^>]*>\s*/;
const NO_INDEX_TAG = '<meta name="robots" content="noindex" />';
const HEAD_END_TAG = '</head>';

/** Parameters of {@link renderNotFoundHtml}. */
interface RenderNotFoundHtmlParams {
  /** Content of `index.html`, with its placeholders. */
  template: string;
  /** Years of experience, in case the not found description uses `{{years}}`. */
  years: number;
}

/**
 * Builds the `404.html` page from the `index.html` template: the "page not found" title and
 * description, no canonical URL or `og:url` (the page has no address of its own), and a
 * `noindex` robots tag. The app loads normally and shows its NotFound page at the requested URL.
 *
 * @returns The HTML of the not found page, with every placeholder replaced.
 */
export function renderNotFoundHtml({ template, years }: RenderNotFoundHtmlParams): string {
  return fillPlaceholders({ template, meta: 'notFound', url: '', years })
    .replace(CANONICAL_TAG, '')
    .replace(OG_URL_TAG, '')
    .replace(HEAD_END_TAG, `  ${NO_INDEX_TAG}\n  ${HEAD_END_TAG}`);
}

/** Parameters of {@link addModulePreload}. */
interface AddModulePreloadParams {
  /** HTML of a generated page. Missing or not a string, it counts as empty. */
  html?: string;
  /**
   * URL of the script to preload, e.g. `/assets/Projects-1a2b3c.js`. Missing, empty or blank,
   * no link is added.
   */
  href?: string;
}

/**
 * Adds a `modulepreload` link to a script in the head of a generated page, so that on a direct
 * visit the browser downloads the chunk of a lazily loaded page at the same time as the app,
 * instead of once the app has run. Used by the Vite plugin at build time.
 *
 * @returns The HTML with the link, HTML-escaped, just before `</head>`, or unchanged when there
 * is no URL or no head.
 *
 * @example
 * addModulePreload({ html: '<head>\n  </head>', href: '/assets/P-1.js' });
 * // '<head>\n    <link rel="modulepreload" crossorigin href="/assets/P-1.js" />\n  </head>'
 */
export function addModulePreload({ html, href }: AddModulePreloadParams = {}): string {
  const page = typeof html === 'string' ? html : '';
  const hasHref = typeof href === 'string' && href.trim() !== '';
  const canAddLink = hasHref && page.includes(HEAD_END_TAG);
  if (!canAddLink) return page;

  const link = `<link rel="modulepreload" crossorigin href="${escapeHtml(href)}" />`;
  return page.replace(HEAD_END_TAG, `  ${link}\n  ${HEAD_END_TAG}`);
}
