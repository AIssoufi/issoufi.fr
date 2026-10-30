import type { OutgoingHttpHeaders } from 'node:http';

import type { Connect } from 'vite';

import { CANONICAL_REDIRECT_STATUS, READ_REQUEST_METHODS } from '../constants.ts';
import {
  findRedirectRule,
  getRedirectLocation,
  getRuleLocation,
  isCloudflareConfigFile,
  readRedirectRules,
} from '../redirects.ts';
import { findExactFile } from '../utils/files.ts';
import { getNotFoundPageFiles, getRequestPathname, getServedFiles } from '../utils/paths.ts';
import { sendNotFoundResponse, sendRedirectResponse } from '../utils/responses.ts';

/** Parameters of {@link createCloudflareRoutesMiddleware}. */
interface CreateCloudflareRoutesMiddlewareParams {
  /** Absolute path of the build that the preview serves, `dist/`. */
  root: string;
  /** HTTP headers that the preview sends with every file, such as the security headers. */
  headers?: OutgoingHttpHeaders;
}

/**
 * Creates the middleware that answers, as Cloudflare Pages does, the requests that Cloudflare Pages
 * answers before serving a file:
 * - with any method, the source of a redirect of `_redirects` (see {@link findRedirectRule}) with
 *   its status and its target, the query of the request kept (see {@link getRuleLocation});
 * - with `GET` or `HEAD`, the path of one of its configuration files (see
 *   {@link isCloudflareConfigFile}) with the closest not found page up its folders and the status
 *   404, or no body when the build has none;
 * - with `GET` or `HEAD`, a path that names a file of the build, case included (see
 *   {@link getServedFiles}), other than its canonical path, with a redirect 308 to that path and
 *   the query of the request (see {@link getRedirectLocation}).
 *
 * These answers carry the headers of the preview. Every other request reaches the next middleware.
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
    const { url } = request;
    const rule = findRedirectRule({ rules: readRedirectRules(root), url });
    if (rule !== undefined) {
      const location = getRuleLocation({ target: rule.target, url });
      return sendRedirectResponse({ response, status: rule.status, location, headers });
    }

    const pathname = getRequestPathname(url);
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
        : getRedirectLocation({ pathname, file: servedFile, url });
    if (location === undefined) return next();

    sendRedirectResponse({ response, status: CANONICAL_REDIRECT_STATUS, location, headers });
  };
