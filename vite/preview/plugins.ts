import type { OutgoingHttpHeaders } from 'node:http';

import type { Connect, Plugin } from 'vite';

import type { HeaderRule } from '../types.ts';
import {
  CACHE_CONTROL_HEADER,
  CACHE_HEADERS_PLUGIN_NAME,
  CANONICAL_REDIRECT_STATUS,
  CLOUDFLARE_ROUTES_PLUGIN_NAME,
  LOCATION_HEADER,
  NOT_FOUND_PAGES_PLUGIN_NAME,
  READ_REQUEST_METHODS,
} from './constants.ts';
import { createNotFoundMiddleware } from './middlewares/notFoundPages.ts';
import { getRedirectLocation, isCloudflareConfigFile } from './redirects.ts';
import { findExactFile, getPreviewBuildRoot } from './utils/files.ts';
import { getCacheControl } from './utils/headers.ts';
import { getNotFoundPageFiles, getRequestPathname, getServedFiles } from './utils/paths.ts';
import { sendNotFoundResponse, setResponseHeaders } from './utils/responses.ts';

/**
 * Vite plugin that makes `vite preview` answer the paths that name no file of the build as
 * Cloudflare Pages does: with the not found page of their language, `404.html` or `en/404.html`,
 * and the status 404, even on a disk that ignores case (see {@link createNotFoundMiddleware}). The
 * browser tests can then check the status and the `noindex` of the not found page. It runs before
 * the middlewares of Vite, whose single page fallback would answer them with `index.html`, and
 * changes neither the build nor the dev server.
 */
export const notFoundPages = (): Plugin => ({
  name: NOT_FOUND_PAGES_PLUGIN_NAME,
  configurePreviewServer: server => {
    const buildRoot = getPreviewBuildRoot(server);
    const { headers } = server.config.preview;
    server.middlewares.use(createNotFoundMiddleware({ root: buildRoot, headers }));
  },
});

/** Parameters of {@link createCacheHeadersMiddleware}. */
interface CreateCacheHeadersMiddlewareParams {
  /** Absolute path of the build that the preview serves, `dist/`. */
  root: string;
  /** Rules of `_headers` to read, `HEADER_RULES` by default (see {@link getCacheControl}). */
  rules?: readonly HeaderRule[];
}

/**
 * Creates the middleware that gives a `GET` or `HEAD` request of a file of the build, case
 * included (see {@link getServedFiles}), the `Cache-Control` that the rules of `_headers` give its
 * path on Cloudflare Pages (see {@link getCacheControl}), then hands it to the next middleware.
 * The files of Vite keep that header, which wins over their own `no-cache`. A request of no file,
 * or of a file that no rule gives a cache policy, reaches the next middleware unchanged.
 *
 * @example
 * server.middlewares.use(createCacheHeadersMiddleware({ root: '/app/dist' }));
 */
export const createCacheHeadersMiddleware =
  ({ root, rules }: CreateCacheHeadersMiddlewareParams): Connect.NextHandleFunction =>
  (request, response, next) => {
    const pathname = getRequestPathname(request.url);
    const isReadRequest = READ_REQUEST_METHODS.has(request.method ?? '');
    if (!isReadRequest || pathname === undefined) return next();

    const cacheControl = getCacheControl({ pathname, rules });
    if (cacheControl === undefined) return next();

    const isBuildFile = findExactFile({ root, files: getServedFiles(pathname) }) !== undefined;
    if (isBuildFile) response.setHeader(CACHE_CONTROL_HEADER, cacheControl);
    next();
  };

/**
 * Vite plugin that makes `vite preview` send the files of the build with the cache policy that
 * Cloudflare Pages gives them, from the rules of `_headers` (`HEADER_RULES`), rather than the
 * `no-cache` that Vite sends with every file (see {@link createCacheHeadersMiddleware}). The
 * browsers of the tests then keep the hashed files of `assets/`, the web fonts included, as a
 * visitor does. It runs before the middlewares of Vite and changes neither the build nor the dev
 * server.
 */
export const cacheHeaders = (): Plugin => ({
  name: CACHE_HEADERS_PLUGIN_NAME,
  configurePreviewServer: server => {
    server.middlewares.use(createCacheHeadersMiddleware({ root: getPreviewBuildRoot(server) }));
  },
});

/** Parameters of {@link createCloudflareRoutesMiddleware}. */
interface CreateCloudflareRoutesMiddlewareParams {
  /** Absolute path of the build that the preview serves, `dist/`. */
  root: string;
  /** HTTP headers that the preview sends with every file, such as the security headers. */
  headers?: OutgoingHttpHeaders;
}

/**
 * Creates the middleware that answers, as Cloudflare Pages does, a `GET` or `HEAD` request that
 * Cloudflare Pages answers before serving a file:
 * - the path of one of its configuration files (see {@link isCloudflareConfigFile}) with the
 *   closest not found page up its folders and the status 404, or no body when the build has none;
 * - a path that names a file of the build, case included (see {@link getServedFiles}), other than
 *   its canonical path, with a redirect 308 to that path and the query of the request (see
 *   {@link getRedirectLocation}).
 *
 * Both answers carry the headers of the preview. Every other request reaches the next middleware.
 *
 * @example
 * const middleware = createCloudflareRoutesMiddleware({
 *   root: '/app/dist',
 *   headers: SECURITY_HEADERS,
 * });
 * server.middlewares.use(middleware);
 */
export const createCloudflareRoutesMiddleware =
  ({ root, headers = {} }: CreateCloudflareRoutesMiddlewareParams): Connect.NextHandleFunction =>
  (request, response, next) => {
    const pathname = getRequestPathname(request.url);
    const isReadRequest = READ_REQUEST_METHODS.has(request.method ?? '');
    if (!isReadRequest || pathname === undefined) return next();

    if (isCloudflareConfigFile(pathname)) {
      const notFoundPage = findExactFile({ root, files: getNotFoundPageFiles(pathname) });
      return sendNotFoundResponse({ response, root, notFoundPage, headers });
    }

    const servedFile = findExactFile({ root, files: getServedFiles(pathname) });
    const location =
      servedFile === undefined
        ? undefined
        : getRedirectLocation({ pathname, file: servedFile, url: request.url });
    if (location === undefined) return next();

    response.statusCode = CANONICAL_REDIRECT_STATUS;
    setResponseHeaders({ response, headers });
    response.setHeader(LOCATION_HEADER, location);
    response.end();
  };

/**
 * Vite plugin that makes `vite preview` answer, as Cloudflare Pages does, the paths that it
 * answers before serving a file (see {@link createCloudflareRoutesMiddleware}): `_headers` and
 * `_redirects` with the not found page and the status 404, and the other paths of a page with a
 * redirect 308 to its canonical path, where Vite would serve the page, or the home page through
 * its single page fallback. The browser tests then follow the redirects that a visitor follows.
 * It runs before the other middlewares, so a redirect carries no cache policy, as on Cloudflare
 * Pages, and changes neither the build nor the dev server.
 */
export const cloudflareRoutes = (): Plugin => ({
  name: CLOUDFLARE_ROUTES_PLUGIN_NAME,
  configurePreviewServer: server => {
    const buildRoot = getPreviewBuildRoot(server);
    const { headers } = server.config.preview;
    server.middlewares.use(createCloudflareRoutesMiddleware({ root: buildRoot, headers }));
  },
});
