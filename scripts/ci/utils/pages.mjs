// @ts-check
import {
  CANONICAL_LINK_TAG_PATTERN,
  HOME_PAGE_FILE,
  HOME_PAGE_ROUTE,
  HREF_ATTRIBUTE_PATTERN,
  HTML_FILE_PATTERN,
  HTTP_NOT_FOUND,
  HTTP_OK,
  MISSING_PAGE_ROUTE,
  NOT_FOUND_PAGE_FILE,
  TITLE_TAG_PATTERN,
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
 * @example
 * getPageChecks(['index.html', 'projects.html', '404.html', 'robots.txt']);
 * // [
 * //   { file: 'index.html', route: '/', status: 200 },
 * //   { file: 'projects.html', route: '/projects', status: 200 },
 * //   { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
 * // ]
 */
export const getPageChecks = (fileNames = []) =>
  fileNames
    .filter(file => typeof file === 'string' && HTML_FILE_PATTERN.test(file))
    .map(file => {
      const isNotFoundPage = file === NOT_FOUND_PAGE_FILE;
      if (isNotFoundPage) {
        return { file, route: MISSING_PAGE_ROUTE, status: HTTP_NOT_FOUND };
      }

      const isHomePage = file === HOME_PAGE_FILE;
      const route = isHomePage ? HOME_PAGE_ROUTE : `/${file.replace(HTML_FILE_PATTERN, '')}`;
      return { file, route, status: HTTP_OK };
    });

/**
 * Title and canonical URL of an HTML page, read by {@link readPageHead}.
 * @typedef {object} PageHead
 * @property {string} title - Text of the title tag, trimmed. Empty when the page has none.
 * @property {string} canonical - URL of the canonical link. Empty when the page has none.
 */

/**
 * Reads the title and the canonical URL of an HTML page, whatever the line breaks in its tags.
 * @param {unknown} html - Content of the page.
 * @returns {PageHead} Empty strings for what the page does not have.
 * @example
 * readPageHead('<title> Projets </title><link href="https://issoufi.fr/" rel="canonical">');
 * // { title: 'Projets', canonical: 'https://issoufi.fr/' }
 */
export const readPageHead = html => {
  const text = typeof html === 'string' ? html : '';
  const title = text.match(TITLE_TAG_PATTERN)?.[1]?.trim() ?? '';
  const canonicalTag = text.match(CANONICAL_LINK_TAG_PATTERN)?.[0] ?? '';
  const canonical = canonicalTag.match(HREF_ATTRIBUTE_PATTERN)?.[1] ?? '';
  return { title, canonical };
};

/**
 * Parameters of {@link comparePage}.
 * @typedef {object} ComparePageParams
 * @property {PageCheck} page - Route to check and its expected status.
 * @property {number} status - Status the site answered with.
 * @property {string} [servedHtml] - Content the site answered with. Missing counts as empty.
 * @property {string} [builtHtml] - Content of the file in the build. Missing counts as empty.
 */

/**
 * Compares the page the deployed site served for a route with the file of the build: same status
 * as expected, same title and same canonical URL.
 * @param {ComparePageParams} params
 * @returns {string[]} The problems found, empty when the page is served as built.
 * @example
 * comparePage({
 *   page: { file: 'projects.html', route: '/projects', status: 200 },
 *   status: 404,
 *   servedHtml: '<title>Projets</title>',
 *   builtHtml: '<title>Projets</title>',
 * }); // ['/projects: status 404 instead of 200']
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

/**
 * Whether a page check can be listed in the smoke test report: it has a route and a numeric
 * status.
 * @param {PageCheck | null | undefined} page - Page check to list.
 * @returns {boolean} False for a missing page, or one without a route or a numeric status.
 */
const isListablePage = page => typeof page?.route === 'string' && typeof page.status === 'number';

/**
 * Parameters of {@link renderSmokeTestReport}.
 * @typedef {object} RenderSmokeTestReportParams
 * @property {string} [siteUrl] - Site that was checked, e.g. `https://issoufi.fr`. Defaults to an
 * empty string.
 * @property {PageCheck[]} [pages] - Pages requested on the site, from {@link getPageChecks}.
 * Defaults to none.
 * @property {string[]} [problems] - Problems found on those pages, from {@link comparePage}.
 * Defaults to none.
 */

/**
 * Writes the result of the smoke test as Markdown, for the job summary: the routes the site
 * serves as built, or the problems found. Checking no page at all is reported as a failure, not
 * as a success. Pages without a route or a numeric status, and problems that are not text, are
 * left out.
 * @param {RenderSmokeTestReportParams} params
 * @returns {string} The Markdown report.
 * @example
 * renderSmokeTestReport({
 *   siteUrl: 'https://issoufi.fr',
 *   pages: [{ file: 'index.html', route: '/', status: 200 }],
 * }); // '## Smoke test\n\n✅ https://issoufi.fr serves `/` (200) as built.\n'
 */
export const renderSmokeTestReport = ({ siteUrl = '', pages = [], problems = [] }) => {
  const listedProblems = problems.filter(problem => typeof problem === 'string');
  const listedPages = pages.filter(isListablePage);

  const hasProblems = listedProblems.length > 0;
  if (hasProblems) {
    const list = listedProblems.map(problem => `- ${problem}`).join('\n');
    return `## Smoke test\n\n❌ ${siteUrl}:\n\n${list}\n`;
  }

  const hasPages = listedPages.length > 0;
  if (!hasPages) return `## Smoke test\n\n❌ ${siteUrl}: no page of the build was checked.\n`;

  const routes = listedPages.map(({ route, status }) => `\`${route}\` (${status})`).join(', ');
  return `## Smoke test\n\n✅ ${siteUrl} serves ${routes} as built.\n`;
};
