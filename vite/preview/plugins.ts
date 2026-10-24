import { readFileSync } from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import { join, resolve } from 'node:path';

import type { Connect, Plugin } from 'vite';

import type { HeaderRule } from '../types.ts';
import {
  CACHE_CONTROL_HEADER,
  CACHE_HEADERS_PLUGIN_NAME,
  NOT_FOUND_PAGE_MEDIA_TYPE,
  NOT_FOUND_PAGES_PLUGIN_NAME,
  NOT_FOUND_STATUS,
  PAGE_REQUEST_METHODS,
} from './constants.ts';
import {
  findExactFile,
  getCacheControl,
  getNotFoundPageFiles,
  getRequestPathname,
  getServedFiles,
} from './utils.ts';

/** Parameters of {@link createNotFoundMiddleware}. */
interface CreateNotFoundMiddlewareParams {
  /** Absolute path of the build that the preview serves, `dist/`. */
  root: string;
  /** HTTP headers that the preview sends with every file, such as the security headers. */
  headers?: OutgoingHttpHeaders;
}

/**
 * Creates the middleware that answers, as Cloudflare Pages does, a `GET` or `HEAD` request whose
 * path names no file of the build, case included (see {@link getServedFiles}), with the closest
 * not found page up its folders (see {@link getNotFoundPageFiles}), the status 404 and the headers
 * of the preview. Every other request, and every request when the build has no not found page,
 * reaches the next middleware, the files and the single page fallback of Vite.
 *
 * @example
 * const middleware = createNotFoundMiddleware({ root: '/app/dist', headers: SECURITY_HEADERS });
 * server.middlewares.use(middleware);
 */
export const createNotFoundMiddleware =
  ({ root, headers = {} }: CreateNotFoundMiddlewareParams): Connect.NextHandleFunction =>
  (request, response, next) => {
    const pathname = getRequestPathname(request.url);
    const isPageRequest = PAGE_REQUEST_METHODS.has(request.method ?? '');
    if (!isPageRequest || pathname === undefined) return next();

    const servedFile = findExactFile({ root, files: getServedFiles(pathname) });
    if (servedFile) return next();

    const notFoundPage = findExactFile({ root, files: getNotFoundPageFiles(pathname) });
    if (!notFoundPage) return next();

    response.statusCode = NOT_FOUND_STATUS;
    Object.entries(headers).forEach(([name, value]) => {
      if (value !== undefined) response.setHeader(name, value);
    });
    response.setHeader('Content-Type', NOT_FOUND_PAGE_MEDIA_TYPE);
    // Node.js sends no body for a HEAD request, only its length
    response.end(readFileSync(join(root, notFoundPage)));
  };

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
    const { root, environments, preview } = server.config;
    // The folder that Vite previews
    const buildRoot = resolve(root, environments.client.build.outDir);
    server.middlewares.use(createNotFoundMiddleware({ root: buildRoot, headers: preview.headers }));
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
    const isFileRequest = PAGE_REQUEST_METHODS.has(request.method ?? '');
    if (!isFileRequest || pathname === undefined) return next();

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
    const { root, environments } = server.config;
    // The folder that Vite previews
    const buildRoot = resolve(root, environments.client.build.outDir);
    server.middlewares.use(createCacheHeadersMiddleware({ root: buildRoot }));
  },
});
