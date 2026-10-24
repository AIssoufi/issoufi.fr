import type { Connect } from 'vite';

import type { HeaderRule } from '../../types.ts';
import { CACHE_CONTROL_HEADER, READ_REQUEST_METHODS } from '../constants.ts';
import { findExactFile } from '../utils/files.ts';
import { getCacheControl } from '../utils/headers.ts';
import { getRequestPathname, getServedFiles } from '../utils/paths.ts';

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
