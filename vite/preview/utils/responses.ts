import { readFileSync } from 'node:fs';
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { join } from 'node:path';

import { LOCATION_HEADER, NOT_FOUND_PAGE_MEDIA_TYPE, NOT_FOUND_STATUS } from '../constants.ts';

/** Parameters of {@link setResponseHeaders}. */
interface SetResponseHeadersParams {
  /** Response to give the headers. */
  response: ServerResponse;
  /** Headers to give it, by name; an `undefined` value is left out. */
  headers: OutgoingHttpHeaders;
}

/**
 * Gives a response the headers of the preview, which Vite gives only the files it serves.
 *
 * @example
 * setResponseHeaders({ response, headers: { 'X-Frame-Options': 'DENY' } });
 */
export const setResponseHeaders = ({ response, headers }: SetResponseHeadersParams) => {
  Object.entries(headers).forEach(([name, value]) => {
    if (value !== undefined) response.setHeader(name, value);
  });
};

/** Parameters of {@link sendRedirectResponse}. */
interface SendRedirectResponseParams {
  /** Response to write and end. */
  response: ServerResponse;
  /** HTTP status of the redirect. */
  status: number;
  /** Value of the `Location` header. */
  location: string;
  /** HTTP headers that the preview sends with every file, such as the security headers. */
  headers?: OutgoingHttpHeaders;
}

/**
 * Answers a request with a redirect without a body, which carries the headers of the preview.
 *
 * @example
 * sendRedirectResponse({ response, status: 308, location: '/en/', headers });
 */
export const sendRedirectResponse = ({
  response,
  status,
  location,
  headers = {},
}: SendRedirectResponseParams) => {
  response.statusCode = status;
  setResponseHeaders({ response, headers });
  response.setHeader(LOCATION_HEADER, location);
  response.end();
};

/** Parameters of {@link sendNotFoundResponse}. */
interface SendNotFoundResponseParams {
  /** Response to write and end. */
  response: ServerResponse;
  /** Absolute path of the build that the preview serves, `dist/`. */
  root: string;
  /**
   * Path of the not found page from the root, without a leading `/`, e.g. `en/404.html`. Without
   * one, the response has no body.
   */
  notFoundPage?: string;
  /** HTTP headers that the preview sends with every file, such as the security headers. */
  headers?: OutgoingHttpHeaders;
}

/**
 * Answers a request as Cloudflare Pages answers a path that names no file: with the status 404,
 * the headers of the preview and the not found page as an HTML document, or no body when there is
 * no not found page. Node.js sends no body for a `HEAD` request, only its length.
 *
 * @throws The read error of Node.js when `notFoundPage` names no file of `root`, such as a missing
 * file or a folder, once the status and the headers are set: find the page with `findExactFile`
 * first.
 * @example
 * sendNotFoundResponse({ response, root: '/app/dist', notFoundPage: 'en/404.html', headers });
 */
export const sendNotFoundResponse = ({
  response,
  root,
  notFoundPage,
  headers = {},
}: SendNotFoundResponseParams) => {
  response.statusCode = NOT_FOUND_STATUS;
  setResponseHeaders({ response, headers });
  if (!notFoundPage) return response.end();

  response.setHeader('Content-Type', NOT_FOUND_PAGE_MEDIA_TYPE);
  response.end(readFileSync(join(root, notFoundPage)));
};
