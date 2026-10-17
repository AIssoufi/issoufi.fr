import { fr } from '../i18n/fr';

export const SITE_URL = 'https://issoufi.fr';

// Each page gets its own HTML file at build time, so link previews and search engines
// see its title, description and canonical URL without running JavaScript
export const PAGES = [
  { path: '/', meta: 'home', fileName: 'index.html' },
  { path: '/projects', meta: 'projects', fileName: 'projects.html' },
  { path: '/experiences', meta: 'experiences', fileName: 'experiences.html' },
] as const;

export type Page = (typeof PAGES)[number];

export function getPage(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/';
  return PAGES.find(page => page.path === path) ?? PAGES[0];
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Fills the %PAGE_*% placeholders of index.html with the French metadata of the page
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
