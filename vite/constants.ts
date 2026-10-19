import type { HeaderRule } from './types';

/** Port of the dev server when no `PORT` is set, as in the main checkout. */
export const DEFAULT_DEV_PORT = 3000;

/** Port of the preview server when no `PORT` is set: Vite's own default preview port. */
export const DEFAULT_PREVIEW_PORT = 4173;

/** Lowest TCP port a server can listen on. `0` would let the system pick a random one. */
export const MIN_PORT = 1;

/** Highest TCP port. */
export const MAX_PORT = 65_535;

/** A port written in decimal digits only: no sign, decimal point or exponent. */
export const PORT_PATTERN = /^\d+$/;

/**
 * Prefix given to Vite's `loadEnv` so it returns every variable of the environment and of the
 * `.env` files, not only the `VITE_` ones exposed to the app.
 */
export const ALL_ENV_VARIABLES_PREFIX = '';

/**
 * Folder of the hashed scripts in the build: Vite's default `build.assetsDir`. `pnpm size` only
 * counts the scripts of this folder (`ASSETS_SUBDIR` in `scripts/ci/constants.mjs`): keep both
 * equal. Browsers keep its files a year ({@link HEADER_RULES}), so each one needs a hash of its
 * content in its name, and `public/` no folder of this name, whose files Vite would copy into it
 * as they are: `vite.config.spec.ts` checks both.
 */
export const ASSETS_DIR = 'assets';

/**
 * File of the build that sets the HTTP headers that Cloudflare Pages adds to the files it serves,
 * by path. Cloudflare Pages reads it and does not serve it.
 * @see https://developers.cloudflare.com/pages/configuration/headers/
 */
export const HEADERS_FILE_NAME = '_headers';

/**
 * How long a browser keeps a file of {@link ASSETS_DIR} without asking the server again: a year of
 * 365 days, the usual lifetime of a file that never changes.
 */
export const HASHED_ASSET_MAX_AGE_SECONDS = 31_536_000;

/**
 * Directives of the Content Security Policy of the site, which lists where a page may load each
 * kind of resource from: its own origin only, the scripts with no inline script nor `eval`. Every
 * file of the site is served by its own origin, and the site sends nothing to another one.
 * @see https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP
 */
export const CONTENT_SECURITY_POLICY_DIRECTIVES: readonly string[] = [
  "default-src 'self'",
  "script-src 'self'",
  // styled-components writes its rules in <style> elements, as the font-faces plugin of
  // vite.config.ts does for the @font-face rules
  "style-src 'self' 'unsafe-inline'",
  // Lets a style draw an image written in the code as a data URL, which needs no request, as the
  // placeholder of each background photo is (placeholderUrl, src/utils/pages.ts)
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  // No site may show a page in a frame, which would let it trick a visitor into clicking it
  "frame-ancestors 'none'",
];

/**
 * How long a browser keeps opening the site over HTTPS only, after a response that asked it to:
 * a year of 365 days, the shortest lifetime that the HSTS preload list accepts.
 * @see https://hstspreload.org/#deployment-recommendations
 */
export const HSTS_MAX_AGE_SECONDS = 31_536_000;

/**
 * Security headers of every response of the site, which {@link HEADER_RULES} give to Cloudflare
 * Pages and `vite preview` sends too, so the browser tests run under the same policy:
 * - `Content-Security-Policy`: the directives of {@link CONTENT_SECURITY_POLICY_DIRECTIVES};
 * - `Strict-Transport-Security`: HTTPS only, for this host alone, not its subdomains, which the
 * site owner may add later for the whole domain, with the preload list;
 * - `Permissions-Policy`: no camera, microphone, location nor advertising topics, which the site
 * never uses;
 * - `X-Frame-Options`: no frame, for the browsers that do not read `frame-ancestors`;
 * - `Cross-Origin-Opener-Policy`: a page opened from another site gets no handle on the window of
 * the site, nor the other way round.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY_DIRECTIVES.join('; '),
  'Strict-Transport-Security': `max-age=${HSTS_MAX_AGE_SECONDS}`,
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/**
 * Rules of {@link HEADERS_FILE_NAME}. Cloudflare Pages gives a response the headers of every rule
 * whose path matches it. Every file gets the {@link SECURITY_HEADERS}. The files of
 * {@link ASSETS_DIR} have a hash of their content in their name, so a new content gets a new URL:
 * browsers keep them a year without revalidating them (`immutable`). Every other file keeps the
 * default cache policy of Cloudflare Pages, which revalidates it: the HTML pages, `robots.txt` and
 * `sitemap.xml`, whose URL never changes, and the files copied from `public/`, whose name stays
 * the same when their content changes, the web fonts of `public/fonts/` included, since other
 * scripts read them there.
 */
export const HEADER_RULES: readonly HeaderRule[] = [
  { path: '/*', headers: SECURITY_HEADERS },
  {
    path: `/${ASSETS_DIR}/*`,
    headers: { 'Cache-Control': `public, max-age=${HASHED_ASSET_MAX_AGE_SECONDS}, immutable` },
  },
];

/** Path pattern of a rule of {@link HEADERS_FILE_NAME}: a path that starts with `/`, no space. */
export const HEADER_PATH_PATTERN = /^\/\S*$/;

/** Name of an HTTP header: a token of RFC 9110, such as `Cache-Control`. */
export const HEADER_NAME_PATTERN = /^[\w!#$%&'*+.^`|~-]+$/;

/** A line break, which would end a line of {@link HEADERS_FILE_NAME} early. */
export const LINE_BREAK_PATTERN = /[\r\n]/;

/** Indent of each header under the path of its rule, in {@link HEADERS_FILE_NAME}. */
export const HEADER_INDENT = '  ';

/** Name that Rollup gives to the chunk of an `index` module, after its file name. */
export const INDEX_CHUNK_NAME = 'index';

/** Name of a chunk when Rollup gives it none. */
export const FALLBACK_CHUNK_NAME = 'chunk';

/** Separators of the folders in a module path, on every system. */
export const PATH_SEPARATOR_PATTERN = /[\\/]/;

/** Folder of the pages, from the root of the project, with `/` separators. */
export const PAGES_DIR = 'src/pages';

/** File of a page folder that `App.tsx` imports lazily, so the module of the page chunk. */
export const PAGE_ENTRY_FILE = 'index.ts';
