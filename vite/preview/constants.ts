import type { CorsOptions } from 'vite';

import { HEADERS_FILE_NAME, REDIRECTS_FILE_NAME } from '../constants.ts';

/**
 * CORS headers of `vite preview`, as Cloudflare Pages sends them: `Access-Control-Allow-Origin: *`
 * and no `Vary` header. The default of Vite adds `Vary: Origin` to every answer, and WebKit
 * requests a web font for its preload with an `Origin` header, then for its `@font-face` without
 * one: its memory cache drops a file when that header differs from the request it cached, so
 * WebKit downloaded the font again at each load of a page.
 * @see https://github.com/WebKit/WebKit/blob/main/Source/WebCore/loader/cache/CachedResourceLoader.cpp
 */
export const PREVIEW_CORS: CorsOptions = { origin: '*' };

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

/**
 * Methods of the requests that read a file, which the middlewares of the preview answer or give
 * headers; the others reach Vite as is.
 */
export const READ_REQUEST_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD']);

/** HTTP status of the not found page, as Cloudflare Pages sends it. */
export const NOT_FOUND_STATUS = 404;

/** Media type of the not found page, an HTML document written in UTF-8. */
export const NOT_FOUND_PAGE_MEDIA_TYPE = 'text/html; charset=utf-8';

/** Name of the plugin that serves the not found pages from `vite preview`. */
export const NOT_FOUND_PAGES_PLUGIN_NAME = 'not-found-pages';

/** Name of the plugin that sends the cache policy of the files of the build from `vite preview`. */
export const CACHE_HEADERS_PLUGIN_NAME = 'cache-headers';

/** Name of the HTTP header of the cache policy, matched without case. */
export const CACHE_CONTROL_HEADER = 'Cache-Control';

/** Character of a path pattern of `_headers` that matches any part of a path, slashes included. */
export const HEADER_PATH_WILDCARD = '*';

/**
 * Separator of the values that several rules of `_headers` give to the same header, which
 * Cloudflare Pages joins into one.
 * @see https://developers.cloudflare.com/pages/configuration/headers/
 */
export const HEADER_VALUE_SEPARATOR = ', ';

/** Name of the plugin that answers from `vite preview` the routes that Cloudflare Pages answers. */
export const CLOUDFLARE_ROUTES_PLUGIN_NAME = 'cloudflare-routes';

/**
 * HTTP status of the redirect of Cloudflare Pages to the canonical path of a page, permanent and
 * keeping the method.
 * @see https://developers.cloudflare.com/pages/configuration/serving-pages/#route-matching
 */
export const CANONICAL_REDIRECT_STATUS = 308;

/** Name of the HTTP header that gives the URL of a redirect. */
export const LOCATION_HEADER = 'Location';

/** Origin against which a request URL, a path, is parsed to read its query. */
export const REQUEST_URL_BASE = 'http://localhost';

/**
 * Files of the root of the build that Cloudflare Pages reads and does not serve, answering their
 * path with its not found page.
 */
export const CLOUDFLARE_CONFIG_FILES: ReadonlySet<string> = new Set([
  HEADERS_FILE_NAME,
  REDIRECTS_FILE_NAME,
]);
