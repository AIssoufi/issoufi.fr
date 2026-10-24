import type { Plugin } from 'vite';

import {
  CACHE_HEADERS_PLUGIN_NAME,
  CLOUDFLARE_ROUTES_PLUGIN_NAME,
  NOT_FOUND_PAGES_PLUGIN_NAME,
} from './constants.ts';
import { createCacheHeadersMiddleware } from './middlewares/cacheHeaders.ts';
import { createCloudflareRoutesMiddleware } from './middlewares/cloudflareRoutes.ts';
import { createNotFoundMiddleware } from './middlewares/notFoundPages.ts';
import { getPreviewBuildRoot } from './utils/files.ts';

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
