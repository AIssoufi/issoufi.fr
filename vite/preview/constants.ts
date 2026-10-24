/**
 * File that a request for a folder of the build reads, as Cloudflare Pages serves it: `/en/`
 * reads `en/index.html`.
 */
export const FOLDER_INDEX_FILE_NAME = 'index.html';

/**
 * Extension of the pages of the build, which Cloudflare Pages serves without it: `/projects`
 * reads `projects.html`.
 */
export const PAGE_FILE_EXTENSION = '.html';

/** Query and fragment of a request URL, which name no file. */
export const URL_QUERY_AND_FRAGMENT_PATTERN = /[?#].*$/s;

/** Methods of the requests that the preview answers with a page; the others reach Vite as is. */
export const PAGE_REQUEST_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD']);

/** HTTP status of the not found page, as Cloudflare Pages sends it. */
export const NOT_FOUND_STATUS = 404;

/** Media type of the not found page, an HTML document written in UTF-8. */
export const NOT_FOUND_PAGE_MEDIA_TYPE = 'text/html; charset=utf-8';

/** Name of the plugin that serves the not found pages from `vite preview`. */
export const NOT_FOUND_PAGES_PLUGIN_NAME = 'not-found-pages';
