// @ts-check

/** Folder of the production build, relative to the project root. */
export const DIST_DIR = 'dist';

/**
 * Folder of the hashed scripts and style sheets, relative to {@link DIST_DIR}, where
 * `vite.config.ts` writes the chunks (`ASSETS_DIR` in `vite/constants.ts`): keep both equal.
 */
export const ASSETS_SUBDIR = 'assets';

/** Folder whose files Vite copies unchanged to the root of the build. */
export const PUBLIC_DIR = 'public';

/**
 * Maximum gzip size, in bytes, of all the scripts and style sheets of the build together, every
 * chunk included. In October 2026, once split per route (issue #27), they weighed 188.9 kB, of
 * which 131.3 kB in the main chunk, down from a single bundle of 225.3 kB. The margin leaves room
 * for React 19.3, which adds about 9.3 kB.
 */
export const SCRIPT_BUDGET_GZIP_BYTES = 210_000;

/**
 * Maximum gzip size, in bytes, of the scripts and style sheets that the home page loads before it
 * renders: those that its HTML file ({@link HOME_PAGE_FILE}) references. Tighter than
 * {@link SCRIPT_BUDGET_GZIP_BYTES}, so that code added to the main chunk fails the build even
 * when the total stays under its budget. In October 2026 the home page loaded the main chunk
 * alone, 131.9 kB; the margin leaves room for React 19.3, which adds about 9.3 kB.
 */
export const INITIAL_LOAD_BUDGET_GZIP_BYTES = 150_000;

/**
 * Why the initial load cannot be checked when the home page ({@link HOME_PAGE_FILE}) references
 * none of the scripts of the build, written after its file name in the job summary and in the
 * error annotation.
 */
export const MISSING_INITIAL_LOAD_REASON = 'references no script or style sheet of the build';

/**
 * Size, in bytes, above which a file of the build is reported as worth compressing: an image, the
 * CV or any other file that the script budgets leave out.
 */
export const LARGE_FILE_BYTES = 500_000;

/** Bytes per kilobyte: the decimal unit Vite uses in its build report. */
export const BYTES_PER_KILOBYTE = 1000;

/** Files counted in the script budget. */
export const SCRIPT_FILE_PATTERN = /\.(js|css)$/;

/** Images of the build: the warning about a large one also advises a lighter format. */
export const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/** Advice written after the size of an image of the build over {@link LARGE_FILE_BYTES}. */
export const LARGE_IMAGE_ADVICE = 'Compress it or convert it to WebP or AVIF.';

/**
 * Advice written after the size of another file of the build over {@link LARGE_FILE_BYTES}, such
 * as a PDF.
 */
export const LARGE_FILE_ADVICE = 'Compress it.';

/** Report written by the `json-summary` coverage reporter of Vitest. */
export const COVERAGE_SUMMARY_FILE = 'coverage/coverage-summary.json';

/** Coverage metrics shown in the job summary, in display order. */
export const COVERAGE_METRICS = ['lines', 'statements', 'branches', 'functions'];

/** HTML pages at the root of the build, one per route. */
export const HTML_FILE_PATTERN = /\.html$/;

/** Route of the home page. */
export const HOME_PAGE_ROUTE = '/';

/** Page of the build served at {@link HOME_PAGE_ROUTE}. */
export const HOME_PAGE_FILE = 'index.html';

/** Page of the build that Cloudflare Pages serves, with a 404, for any unknown path. */
export const NOT_FOUND_PAGE_FILE = '404.html';

/** Title tag of an HTML page. Its first group captures the title. */
export const TITLE_TAG_PATTERN = /<title>([^<]*)<\/title>/i;

/**
 * Canonical link tag of an HTML page, with its attributes in any order and on any number of
 * lines.
 */
export const CANONICAL_LINK_TAG_PATTERN = /<link\s[^>]*rel="canonical"[^>]*>/i;

/** `href` attribute of a tag. Its first group captures the URL, without the quotes. */
export const HREF_ATTRIBUTE_PATTERN = /\shref="([^"]*)"/i;

/** Comments of an HTML page, whose tags the browser ignores. */
export const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/**
 * Opening tags of the scripts of an HTML page, with their attributes in any order and on any
 * number of lines. A script without attributes, written inline, does not match.
 */
export const SCRIPT_TAG_PATTERN = /<script\s[^>]*>/gi;

/** Link tags of an HTML page, with their attributes in any order and on any number of lines. */
export const LINK_TAG_PATTERN = /<link\s[^>]*>/gi;

/** `src` attribute of a tag. Its first group captures the URL, without the quotes. */
export const SRC_ATTRIBUTE_PATTERN = /\ssrc="([^"]*)"/i;

/** `rel` attribute of a link tag. Its first group captures the relations, without the quotes. */
export const REL_ATTRIBUTE_PATTERN = /\srel="([^"]*)"/i;

/** Separator of the relations listed in a `rel` attribute: any run of spaces. */
export const LINK_RELATION_SEPARATOR_PATTERN = /\s+/;

/**
 * Relations of a link tag whose file the browser loads with the page, before it renders: the
 * modules that Vite preloads and the style sheets.
 */
export const INITIAL_LOAD_LINK_RELATIONS = ['modulepreload', 'stylesheet'];

/** Start of a URL served by another site: a scheme (`https:`, `data:`…) or `//`. */
export const EXTERNAL_URL_PATTERN = /^([a-z][a-z\d+.-]*:|\/\/)/i;

/** Query string and fragment at the end of a URL, which do not change the file it serves. */
export const URL_QUERY_AND_HASH_PATTERN = /[?#].*$/;

/** Start of a URL relative to the root of the site, `/` or `./`. */
export const ROOT_URL_PREFIX_PATTERN = /^\.?\//;

/** Path that no page uses, requested to check the not found page. */
export const MISSING_PAGE_ROUTE = '/smoke-test-page-that-does-not-exist';

/** HTTP status of a page served normally. */
export const HTTP_OK = 200;

/** HTTP status of the not found page. */
export const HTTP_NOT_FOUND = 404;

/** Number of times the smoke test checks the site before failing, while a deployment spreads. */
export const SMOKE_TEST_ATTEMPTS = 5;

/** Pause between two attempts of the smoke test, in milliseconds. */
export const SMOKE_TEST_RETRY_DELAY_MS = 5000;
