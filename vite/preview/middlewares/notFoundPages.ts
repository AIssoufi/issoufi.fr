import type { OutgoingHttpHeaders } from 'node:http';

import type { Connect } from 'vite';

import { READ_REQUEST_METHODS } from '../constants.ts';
import { findExactFile } from '../utils/files.ts';
import { getNotFoundPageFiles, getRequestPathname, getServedFiles } from '../utils/paths.ts';
import { sendNotFoundResponse } from '../utils/responses.ts';

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
    const isReadRequest = READ_REQUEST_METHODS.has(request.method ?? '');
    if (!isReadRequest || pathname === undefined) return next();

    const servedFile = findExactFile({ root, files: getServedFiles(pathname) });
    if (servedFile) return next();

    const notFoundPage = findExactFile({ root, files: getNotFoundPageFiles(pathname) });
    if (!notFoundPage) return next();

    sendNotFoundResponse({ response, root, notFoundPage, headers });
  };
