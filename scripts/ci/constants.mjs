// @ts-check

/** Folder of the production build, relative to the project root. */
export const DIST_DIR = 'dist';

/** Folder of the hashed scripts and style sheets, relative to {@link DIST_DIR}. */
export const ASSETS_SUBDIR = 'assets';

/** Folder whose files Vite copies unchanged to the root of the build. */
export const PUBLIC_DIR = 'public';

/**
 * Maximum gzip size, in bytes, of all the scripts and style sheets of the build together.
 * The single bundle weighed 225 kB in October 2026. Lower the budget once it is split per route
 * (issue #27).
 */
export const SCRIPT_BUDGET_GZIP_BYTES = 250_000;

/** Size, in bytes, above which an image of the build is reported as worth compressing. */
export const LARGE_IMAGE_BYTES = 500_000;

/** Bytes per kilobyte: the decimal unit Vite uses in its build report. */
export const BYTES_PER_KILOBYTE = 1000;

/** Files counted in the script budget. */
export const SCRIPT_FILE_PATTERN = /\.(js|css)$/;

/** Files whose size is checked as images. */
export const IMAGE_FILE_PATTERN = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

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
export const HREF_ATTRIBUTE_PATTERN = /href="([^"]*)"/i;

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
