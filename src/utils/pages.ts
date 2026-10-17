import { fr } from '../i18n/fr';

/** Production origin of the site, without a trailing slash. Used to build canonical URLs. */
export const SITE_URL = 'https://issoufi.fr';

/**
 * Routes that get their own HTML file at build time, so link previews and search engines see
 * their title, description and canonical URL without running JavaScript.
 * Every route declared in `App.tsx` needs an entry here.
 */
export const PAGES = [
  { path: '/', meta: 'home', fileName: 'index.html' },
  { path: '/projects', meta: 'projects', fileName: 'projects.html' },
  { path: '/experiences', meta: 'experiences', fileName: 'experiences.html' },
] as const;

/**
 * One entry of {@link PAGES}: the route `path`, the `meta` translation key holding its title
 * and description, and the `fileName` generated for it in `dist`.
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

/**
 * Fills the `%PAGE_TITLE%`, `%PAGE_DESCRIPTION%` and `%PAGE_URL%` placeholders of `index.html`
 * with the French metadata of a page. Used by the Vite plugin at build time.
 *
 * @param template - Content of `index.html`, with its placeholders.
 * @param page - Page whose metadata to inject.
 * @param years - Years of experience, replacing `{{years}}` in the description.
 * @returns The HTML with every placeholder replaced and HTML-escaped.
 */
export function renderPageHtml(template: string, page: Page, years: number): string {
  const { title, description } = fr.meta[page.meta];
  const values: Record<string, string> = {
    PAGE_TITLE: title,
    PAGE_DESCRIPTION: description.replace(/{{years}}/g, String(years)),
    PAGE_URL: page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`,
  };

  return template.replace(/%(PAGE_TITLE|PAGE_DESCRIPTION|PAGE_URL)%/g, (_, key: string) =>
    escapeHtml(values[key]),
  );
}
