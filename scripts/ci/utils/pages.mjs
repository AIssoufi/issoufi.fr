// @ts-check
import {
  HOME_PAGE_FILE,
  HTML_FILE_PATTERN,
  HTTP_NOT_FOUND,
  HTTP_OK,
  MISSING_PAGE_ROUTE,
  NOT_FOUND_PAGE_FILE,
} from '../constants.mjs';

/**
 * A page of the build to request on the deployed site.
 * @typedef {object} PageCheck
 * @property {string} file - HTML file of the build, e.g. `projects.html`.
 * @property {string} route - Path to request, e.g. `/projects`.
 * @property {number} status - HTTP status the site must answer with.
 */

/**
 * Lists the routes to check from the HTML files at the root of the build. Each page is served at
 * its name without the extension, `index.html` at `/`, and an unknown path must get
 * `404.html` with a 404 status.
 * @param {string[]} [fileNames] - File names at the root of the build. Defaults to none.
 * @returns {PageCheck[]} One check per HTML file, other files are ignored.
 */
export const getPageChecks = (fileNames = []) =>
  fileNames
    .filter(file => typeof file === 'string' && HTML_FILE_PATTERN.test(file))
    .map(file => {
      const isNotFoundPage = file === NOT_FOUND_PAGE_FILE;
      if (isNotFoundPage) {
        return { file, route: MISSING_PAGE_ROUTE, status: HTTP_NOT_FOUND };
      }

      const route = file === HOME_PAGE_FILE ? '/' : `/${file.replace(HTML_FILE_PATTERN, '')}`;
      return { file, route, status: HTTP_OK };
    });

/**
 * Reads the title and the canonical URL of an HTML page, whatever the line breaks in its tags.
 * @param {unknown} html - Content of the page.
 * @returns {{ title: string, canonical: string }} Empty strings for what the page does not have.
 */
export const readPageHead = html => {
  const text = typeof html === 'string' ? html : '';
  const title = text.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  const canonicalTag = text.match(/<link\s[^>]*rel="canonical"[^>]*>/i)?.[0] ?? '';
  const canonical = canonicalTag.match(/href="([^"]*)"/i)?.[1] ?? '';
  return { title, canonical };
};

/**
 * Compares the page the deployed site served for a route with the file of the build: same status
 * as expected, same title and same canonical URL.
 * @param {object} params
 * @param {PageCheck} params.page - Route to check and its expected status.
 * @param {number} params.status - Status the site answered with.
 * @param {string} [params.servedHtml] - Content the site answered with.
 * @param {string} [params.builtHtml] - Content of the file in the build.
 * @returns {string[]} The problems found, empty when the page is served as built.
 */
export const comparePage = ({ page, status, servedHtml, builtHtml }) => {
  const served = readPageHead(servedHtml);
  const built = readPageHead(builtHtml);
  const problems = [];

  const hasExpectedStatus = status === page.status;
  if (!hasExpectedStatus) {
    problems.push(`${page.route}: status ${status} instead of ${page.status}`);
  }
  // Without a title in the build, an empty served title would pass the comparison
  if (!built.title) problems.push(`${page.route}: ${page.file} has no title in the build`);
  if (served.title !== built.title) {
    problems.push(`${page.route}: title "${served.title}" instead of "${built.title}"`);
  }
  if (served.canonical !== built.canonical) {
    problems.push(`${page.route}: canonical "${served.canonical}" instead of "${built.canonical}"`);
  }

  return problems;
};
