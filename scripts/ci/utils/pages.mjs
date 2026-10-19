// @ts-check
import {
  CANONICAL_LINK_TAG_PATTERN,
  HOME_PAGE_FILE,
  HOME_PAGE_ROUTE,
  HREF_ATTRIBUTE_PATTERN,
  HTML_FILE_PATTERN,
  HTTP_NOT_FOUND,
  HTTP_OK,
  MEDIA_TYPE_PARAMETERS_PATTERN,
  MISSING_PAGE_ROUTE,
  NOT_FOUND_PAGE_FILE,
  PATH_SEPARATOR,
  SERVED_AS_BUILT_FILES,
  SITE_URL,
  TITLE_TAG_PATTERN,
  WINDOWS_PATH_SEPARATOR_PATTERN,
} from '../constants.mjs';
import { toList } from './lists.mjs';

/**
 * A page or another file of the build to request on the deployed site.
 * @typedef {object} PageCheck
 * @property {string} file - File of the build, e.g. `projects.html` or `sitemap.xml`.
 * @property {string} route - Path to request, e.g. `/projects`.
 * @property {number} status - HTTP status the site must answer with.
 * @property {string} [mediaType] - Media type the site must send the file with, e.g.
 * `application/manifest+json`. Left out, any media type passes.
 */

/**
 * Tells whether a value is a string with at least one character.
 * @param {unknown} value - Value to check.
 * @returns {boolean} False for `''` and for a value that is not a string.
 */
const isNonEmptyString = value => typeof value === 'string' && value !== '';

/**
 * Tells whether a value is a page check that can be requested and reported: an object with a
 * file name, a route and an integer status.
 * @param {unknown} value - Value to check.
 * @returns {value is PageCheck} False for `null`, a value that is not an object, and an object
 * with a missing or empty file or route, or a status that is not an integer.
 * @example
 * isPageCheck({ file: 'index.html', route: '/', status: 200 }); // true
 * isPageCheck({ route: '/' }); // false
 */
export const isPageCheck = value => {
  const isObject = typeof value === 'object' && value !== null;
  if (!isObject) return false;

  const { file, route, status } = /** @type {Record<string, unknown>} */ (value);
  const hasFileAndRoute = isNonEmptyString(file) && isNonEmptyString(route);
  return hasFileAndRoute && Number.isInteger(status);
};

/**
 * Tells whether an entry of the build is the path of an HTML page.
 * @param {unknown} fileName - Entry of the build folder, e.g. `en/projects.html`.
 * @returns {boolean} False for another file and for a value that is not a string.
 */
const isHtmlFileName = fileName => typeof fileName === 'string' && HTML_FILE_PATTERN.test(fileName);

/**
 * Writes a path of the build with `/` separators, as Node.js lists them on every system but
 * Windows.
 * @param {string} fileName - Path relative to the build folder, e.g. `en\\projects.html`.
 * @returns {string} The same path with `/` separators, e.g. `en/projects.html`.
 */
const toPosixPath = fileName => fileName.replace(WINDOWS_PATH_SEPARATOR_PATTERN, PATH_SEPARATOR);

/**
 * A path of the build split by {@link splitBuildPath}.
 * @typedef {object} BuildPath
 * @property {string} folderRoute - Route of the folder of the file, without a trailing slash:
 * empty at the root of the build, e.g. `/en` for a file of `en/`.
 * @property {string} name - Name of the file, e.g. `projects.html`.
 */

/**
 * Splits a path of the build into the route of its folder and the name of its file.
 * @param {string} file - Path relative to the build folder, with `/` separators.
 * @returns {BuildPath} The route of the folder and the file name.
 * @example
 * splitBuildPath('en/projects.html'); // { folderRoute: '/en', name: 'projects.html' }
 * splitBuildPath('index.html'); // { folderRoute: '', name: 'index.html' }
 */
export const splitBuildPath = file => {
  const separatorIndex = file.lastIndexOf(PATH_SEPARATOR);
  const isAtRoot = separatorIndex === -1;
  return {
    folderRoute: isAtRoot ? '' : `${PATH_SEPARATOR}${file.slice(0, separatorIndex)}`,
    name: file.slice(separatorIndex + 1),
  };
};

/**
 * Lists the routes to check from the HTML files of the build, at its root and in its folders,
 * such as `en/`. Each page is served at its folder and its name without the extension, an
 * `index.html` at its folder (`/`, `/en/`), and an unknown path of its folder must get the
 * `404.html` of that folder with a 404 status.
 * @param {string[]} [fileNames] - Paths of the files of the build, relative to its folder, as
 * `readdirSync` lists them with `recursive`. Any value that is not an array counts as none.
 * @returns {PageCheck[]} One check per HTML file, other files are ignored.
 * @example
 * getPageChecks(['index.html', 'projects.html', '404.html', 'en/index.html', 'robots.txt']);
 * // [
 * //   { file: 'index.html', route: '/', status: 200 },
 * //   { file: 'projects.html', route: '/projects', status: 200 },
 * //   { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
 * //   { file: 'en/index.html', route: '/en/', status: 200 },
 * // ]
 */
export const getPageChecks = fileNames =>
  toList(fileNames)
    .filter(isHtmlFileName)
    .map(toPosixPath)
    .map(file => {
      const { folderRoute, name } = splitBuildPath(file);

      const isNotFoundPage = name === NOT_FOUND_PAGE_FILE;
      if (isNotFoundPage) {
        return { file, route: `${folderRoute}${MISSING_PAGE_ROUTE}`, status: HTTP_NOT_FOUND };
      }

      const isHomePage = name === HOME_PAGE_FILE;
      const pageRoute = isHomePage
        ? HOME_PAGE_ROUTE
        : `${PATH_SEPARATOR}${name.replace(HTML_FILE_PATTERN, '')}`;
      return { file, route: `${folderRoute}${pageRoute}`, status: HTTP_OK };
    });

/**
 * Lists the files of the build, other than its pages, that the deployed site must serve unchanged
 * ({@link SERVED_AS_BUILT_FILES}), such as `sitemap.xml` at `/sitemap.xml`, and
 * `en/manifest.webmanifest` at `/en/manifest.webmanifest`, with the media type it must have.
 * @param {string[]} [fileNames] - Paths of the files of the build, relative to its folder, as
 * `readdirSync` lists them with `recursive`. Any value that is not an array counts as none.
 * @returns {PageCheck[]} One check per such file with a 200 status, in the order of
 * {@link SERVED_AS_BUILT_FILES}, then of the build. A file the build does not have, or has only in
 * a folder (`en/robots.txt`) when the site serves the one of its root only, gets none.
 * @example
 * getFileChecks(['index.html', 'robots.txt', 'en/manifest.webmanifest']);
 * // [
 * //   { file: 'robots.txt', route: '/robots.txt', status: 200 },
 * //   {
 * //     file: 'en/manifest.webmanifest',
 * //     route: '/en/manifest.webmanifest',
 * //     status: 200,
 * //     mediaType: 'application/manifest+json',
 * //   },
 * // ]
 */
export const getFileChecks = fileNames => {
  const buildFiles = toList(fileNames).filter(isNonEmptyString).map(toPosixPath);
  return SERVED_AS_BUILT_FILES.flatMap(({ name, isInEveryFolder = false, mediaType }) =>
    buildFiles
      .filter(file => {
        const { folderRoute, name: fileName } = splitBuildPath(file);
        const isServedFolder = folderRoute === '' || isInEveryFolder;
        return fileName === name && isServedFolder;
      })
      .map(file => ({
        file,
        route: `${PATH_SEPARATOR}${file}`,
        status: HTTP_OK,
        ...(mediaType ? { mediaType } : {}),
      })),
  );
};

/**
 * Reads the media type of a `Content-Type` header: its value without its parameters, in lower case,
 * as media types are compared.
 * @param {unknown} contentType - Value of the header, e.g. `Application/JSON; charset=utf-8`.
 * @returns {string} The media type, e.g. `application/json`, or `''` for a missing header or a
 * value that is not a string.
 * @example
 * getMediaType('application/manifest+json; charset=utf-8'); // 'application/manifest+json'
 */
export const getMediaType = contentType =>
  typeof contentType === 'string'
    ? contentType.replace(MEDIA_TYPE_PARAMETERS_PATTERN, '').trim().toLowerCase()
    : '';

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
 * Parameters of {@link compareStatus}.
 * @typedef {object} CompareStatusParams
 * @property {PageCheck} check - Route that was requested and the status it must answer with.
 * @property {number} [status] - Status the site answered with. Missing or not an integer, it is
 * reported as unknown.
 */

/**
 * Compares the status the site answered a route with to the one expected.
 * @param {CompareStatusParams} params
 * @returns {string[]} A problem naming both statuses when they differ, none otherwise.
 */
const compareStatus = ({ check, status }) => {
  const hasExpectedStatus = status === check.status;
  if (hasExpectedStatus) return [];

  const servedStatus = Number.isInteger(status) ? status : 'unknown';
  return [`${check.route}: status ${servedStatus} instead of ${check.status}`];
};

/**
 * Parameters of {@link comparePage}.
 * @typedef {object} ComparePageParams
 * @property {PageCheck} [page] - Route to check and its expected status. A missing or malformed
 * page (see {@link isPageCheck}) is reported as a problem.
 * @property {number} [status] - Status the site answered with. Missing or not an integer, it is
 * reported as unknown.
 * @property {string} [servedHtml] - Content the site answered with. Missing counts as empty.
 * @property {string} [builtHtml] - Content of the file in the build. Missing counts as empty.
 */

/**
 * Compares the page the deployed site served for a route with the file of the build: same status
 * as expected, same title and same canonical URL.
 * @param {ComparePageParams} params
 * @returns {string[]} The problems found, empty when the page is served as built, and a single
 * problem when the page check is missing or malformed.
 * @example
 * comparePage({
 *   page: { file: 'projects.html', route: '/projects', status: 200 },
 *   status: 404,
 *   servedHtml: '<title>Projets</title>',
 *   builtHtml: '<title>Projets</title>',
 * }); // ['/projects: status 404 instead of 200']
 */
export const comparePage = ({ page, status, servedHtml, builtHtml }) => {
  if (!isPageCheck(page)) {
    return ['A page check without a file, a route or an integer status cannot be compared'];
  }

  const served = readPageHead(servedHtml);
  const built = readPageHead(builtHtml);
  const problems = compareStatus({ check: page, status });

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
 * Parameters of {@link compareFile}.
 * @typedef {object} CompareFileParams
 * @property {PageCheck} [check] - File to check, from {@link getFileChecks}, and its expected
 * status. A missing or malformed check (see {@link isPageCheck}) is reported as a problem.
 * @property {number} [status] - Status the site answered with. Missing or not an integer, it is
 * reported as unknown.
 * @property {string} [servedText] - Content the site answered with. Missing or not a string, it
 * counts as empty.
 * @property {string} [builtText] - Content of the file in the build. Missing or not a string, it
 * counts as empty.
 * @property {string | null} [contentType] - `Content-Type` header of the response, compared with
 * the media type of the check when it has one. Missing, it counts as no media type.
 */

/**
 * Compares a file that the deployed site served, such as `sitemap.xml`, with the file of the
 * build: same status as expected, the media type of the check when it has one, and the same
 * content, character for character.
 * @param {CompareFileParams} params
 * @returns {string[]} The problems found, empty when the file is served as built, and a single
 * problem when the file check is missing or malformed.
 * @example
 * compareFile({
 *   check: { file: 'robots.txt', route: '/robots.txt', status: 200 },
 *   status: 200,
 *   servedText: 'User-agent: *\n',
 *   builtText: 'User-agent: *\nSitemap: https://issoufi.fr/sitemap.xml\n',
 * }); // ['/robots.txt: content differs from robots.txt of the build']
 */
export const compareFile = ({ check, status, servedText, builtText, contentType }) => {
  if (!isPageCheck(check)) {
    return ['A file check without a file, a route or an integer status cannot be compared'];
  }

  const served = typeof servedText === 'string' ? servedText : '';
  const built = typeof builtText === 'string' ? builtText : '';
  const problems = compareStatus({ check, status });

  const servedMediaType = getMediaType(contentType);
  const hasWrongMediaType =
    isNonEmptyString(check.mediaType) && servedMediaType !== check.mediaType;
  if (hasWrongMediaType) {
    const servedAs = servedMediaType || 'no media type';
    problems.push(`${check.route}: served as ${servedAs} instead of ${check.mediaType}`);
  }

  // Without content in the build, an empty served file would pass the comparison
  const isEmptyInBuild = built === '';
  if (isEmptyInBuild) {
    problems.push(`${check.route}: ${check.file} is empty in the build`);
  } else if (served !== built) {
    problems.push(`${check.route}: content differs from ${check.file} of the build`);
  }

  return problems;
};

/**
 * Reads the site to smoke-test from the argument of the command: the production site,
 * {@link SITE_URL}, when the command has none. Only a missing argument falls back to production:
 * an empty one, such as an unset deployment URL, stays empty, so that the smoke test fails rather
 * than checking production in place of a preview.
 * @param {unknown} argument - First argument of the command, `undefined` when there is none.
 * @returns {string} The argument as given, {@link SITE_URL} when it is missing, or `''` when it is
 * not a string.
 * @example
 * resolveSiteUrl(undefined); // 'https://issoufi.fr/'
 * resolveSiteUrl('https://develop.issoufi-fr.pages.dev'); // 'https://develop.issoufi-fr.pages.dev'
 * resolveSiteUrl(''); // ''
 */
export const resolveSiteUrl = argument => {
  if (argument === undefined) return SITE_URL;
  return typeof argument === 'string' ? argument : '';
};

/**
 * Parameters of {@link renderSmokeTestReport}.
 * @typedef {object} RenderSmokeTestReportParams
 * @property {string} [siteUrl] - Site that was checked, e.g. `https://issoufi.fr`. Missing or not
 * a string, it is left empty.
 * @property {PageCheck[]} [pages] - Pages and files requested on the site, from
 * {@link getPageChecks} and {@link getFileChecks}. Any value that is not an array counts as none.
 * @property {string[]} [problems] - Problems found on those pages and files, from
 * {@link comparePage} and {@link compareFile}.
 * Any value that is not an array counts as none.
 */

/**
 * Writes the result of the smoke test as Markdown, for the job summary: the routes the site
 * serves as built, or the problems found. Checking no page at all is reported as a failure, not
 * as a success. Entries that are not page checks (see {@link isPageCheck}), and problems that are
 * not text, are left out.
 * @param {RenderSmokeTestReportParams} params
 * @returns {string} The Markdown report.
 * @example
 * renderSmokeTestReport({
 *   siteUrl: 'https://issoufi.fr',
 *   pages: [{ file: 'index.html', route: '/', status: 200 }],
 * }); // '## Smoke test\n\n✅ https://issoufi.fr serves `/` (200) as built.\n'
 */
export const renderSmokeTestReport = ({ siteUrl, pages, problems }) => {
  const site = typeof siteUrl === 'string' ? siteUrl : '';
  const listedProblems = toList(problems).filter(problem => typeof problem === 'string');
  const listedPages = toList(pages).filter(isPageCheck);

  const hasProblems = listedProblems.length > 0;
  if (hasProblems) {
    const list = listedProblems.map(problem => `- ${problem}`).join('\n');
    return `## Smoke test\n\n❌ ${site}:\n\n${list}\n`;
  }

  const hasPages = listedPages.length > 0;
  if (!hasPages) return `## Smoke test\n\n❌ ${site}: no page of the build was checked.\n`;

  const routes = listedPages.map(({ route, status }) => `\`${route}\` (${status})`).join(', ');
  return `## Smoke test\n\n✅ ${site} serves ${routes} as built.\n`;
};
