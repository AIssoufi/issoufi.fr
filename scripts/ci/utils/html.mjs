// @ts-check
import {
  EXTERNAL_URL_PATTERN,
  HREF_ATTRIBUTE_PATTERN,
  HTML_COMMENT_PATTERN,
  INITIAL_LOAD_LINK_RELATIONS,
  LINK_RELATION_SEPARATOR_PATTERN,
  LINK_TAG_PATTERN,
  REL_ATTRIBUTE_PATTERN,
  ROOT_URL_PREFIX_PATTERN,
  SCRIPT_TAG_PATTERN,
  SRC_ATTRIBUTE_PATTERN,
  URL_QUERY_AND_HASH_PATTERN,
} from '../constants.mjs';

/**
 * Turns a URL that a page of the build references into the path of the file it serves, relative
 * to the build folder, as the build files name it.
 * @param {unknown} url - URL of a `src` or `href` attribute, e.g. `/assets/index-B7cJ.js`.
 * @returns {string} The path without its query string or fragment, e.g. `assets/index-B7cJ.js`,
 * or an empty string for a URL of another site, a `data:` URL, a URL without a path and a value
 * that is not a string.
 * @example
 * toBuildPath('/assets/index-B7cJ.js?v=2'); // 'assets/index-B7cJ.js'
 * toBuildPath('https://fonts.googleapis.com/css2'); // ''
 */
export const toBuildPath = url => {
  if (typeof url !== 'string') return '';

  const trimmedUrl = url.trim();
  const isExternal = EXTERNAL_URL_PATTERN.test(trimmedUrl);
  if (isExternal) return '';

  return trimmedUrl.replace(URL_QUERY_AND_HASH_PATTERN, '').replace(ROOT_URL_PREFIX_PATTERN, '');
};

/**
 * Tells whether a link tag makes the browser load its file with the page: a module preload or a
 * style sheet ({@link INITIAL_LOAD_LINK_RELATIONS}), whatever the other relations it lists.
 * @param {string} tag - Link tag, from `<link` to `>`.
 * @returns {boolean} False for a tag without a `rel` attribute, or with other relations only, such
 * as `icon` or `preconnect`.
 */
const isInitialLoadLink = tag => {
  const relations = tag.match(REL_ATTRIBUTE_PATTERN)?.[1] ?? '';
  return relations
    .toLowerCase()
    .split(LINK_RELATION_SEPARATOR_PATTERN)
    .some(relation => INITIAL_LOAD_LINK_RELATIONS.includes(relation));
};

/**
 * Lists the files of the build that an HTML page makes the browser load before it renders: the
 * scripts of its `script` tags, and the module preloads and style sheets of its `link` tags.
 * Tags in comments, inline scripts, tags without a URL and files of other sites are left out, like
 * attributes without double quotes, which Vite never writes.
 * @param {unknown} html - Content of the page, e.g. `dist/index.html`.
 * @returns {string[]} The paths relative to the build folder (see {@link toBuildPath}), each one
 * once, scripts first. Empty for a value that is not a string.
 * @example
 * readInitialLoadPaths(
 *   '<script type="module" src="/assets/index-B7cJ.js"></script>' +
 *     '<link rel="stylesheet" href="https://fonts.googleapis.com/css2">',
 * ); // ['assets/index-B7cJ.js']
 */
export const readInitialLoadPaths = html => {
  const text = typeof html === 'string' ? html.replace(HTML_COMMENT_PATTERN, '') : '';
  const scriptUrls = (text.match(SCRIPT_TAG_PATTERN) ?? []).map(
    tag => tag.match(SRC_ATTRIBUTE_PATTERN)?.[1],
  );
  const linkUrls = (text.match(LINK_TAG_PATTERN) ?? [])
    .filter(isInitialLoadLink)
    .map(tag => tag.match(HREF_ATTRIBUTE_PATTERN)?.[1]);

  const paths = [...scriptUrls, ...linkUrls].map(toBuildPath).filter(path => path !== '');
  return [...new Set(paths)];
};
