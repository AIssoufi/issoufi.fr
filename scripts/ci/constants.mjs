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

/** Time zone whose local time the production deploy of `deploy-production.yml` follows. */
export const DEPLOY_TIME_ZONE = 'Europe/Paris';

/**
 * Schedule of `deploy-production.yml` that deploys for each offset of {@link DEPLOY_TIME_ZONE}
 * from UTC, in minutes: both run at 6:00 in Paris, at 4:00 UTC in summer (UTC+2) and at 5:00 UTC
 * in winter (UTC+1). The workflow runs both every day, and only the one of the day's offset goes
 * on. Keep them equal to the `cron` entries of the workflow, which a test checks.
 * @type {ReadonlyMap<number, string>}
 */
export const DEPLOY_CRON_BY_UTC_OFFSET_MINUTES = new Map([
  [120, '0 4 * * *'],
  [60, '0 5 * * *'],
]);

/**
 * Name of the offset from UTC that `Intl.DateTimeFormat` gives with `timeZoneName: 'longOffset'`:
 * `GMT+02:00`, `GMT-03:30`, and `GMT+00:00` or `GMT` alone for UTC itself, depending on the
 * version of ICU. Its groups capture the sign, the hours and the minutes. An offset with seconds,
 * such as the local mean time of Paris before 1911 (`GMT+00:09:21`), does not match.
 */
export const UTC_OFFSET_NAME_PATTERN = /^GMT(?:([+-])(\d{2}):(\d{2}))?$/;

/** Minutes per hour, to turn an offset from UTC into minutes. */
export const MINUTES_PER_HOUR = 60;

/** Event of a run started by a `schedule` of a workflow. */
export const SCHEDULE_EVENT = 'schedule';

/** Event of a run started by hand, from the Actions tab or `gh workflow run`. */
export const MANUAL_EVENT = 'workflow_dispatch';

/** Event of a run started by a push, the one whose CI run of develop must pass to deploy it. */
export const PUSH_EVENT = 'push';

/** Workflow whose run must pass on develop before a deploy, and that deploys main. */
export const CI_WORKFLOW_FILE = 'ci.yml';

/** Integration branch, deployed to production by `deploy-production.yml`. */
export const DEVELOP_BRANCH = 'develop';

/** Production branch, deployed to issoufi.fr by the CI on each push. */
export const MAIN_BRANCH = 'main';

/** REST API of GitHub, when the `GITHUB_API_URL` variable of GitHub Actions is unset. */
export const DEFAULT_GITHUB_API_URL = 'https://api.github.com';

/** Web address of GitHub, when the `GITHUB_SERVER_URL` environment variable is unset. */
export const DEFAULT_GITHUB_SERVER_URL = 'https://github.com';

/** Version of the GitHub REST API that the scripts are written for. */
export const GITHUB_API_VERSION = '2022-11-28';

/** Media type that the GitHub REST API recommends asking for, in the `Accept` header. */
export const GITHUB_API_MEDIA_TYPE = 'application/vnd.github+json';

/**
 * Number of runs that the deploy asks the REST API for: the latest only, since the API lists the
 * runs of a workflow newest first.
 */
export const LATEST_RUN_PAGE_SIZE = 1;

/** Repository named as `owner/name`, the format of the `GITHUB_REPOSITORY` variable. */
export const REPOSITORY_PATTERN = /^[\w.-]+\/[\w.-]+$/;

/** Full SHA-1 of a git commit: 40 hexadecimal digits. */
export const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

/** Number of digits of a commit SHA shown in the job summary and the notices, as git does. */
export const SHORT_SHA_LENGTH = 7;

/** Status of a workflow run that has finished, whatever its conclusion. */
export const RUN_COMPLETED_STATUS = 'completed';

/** Conclusion of a workflow run whose every job passed or was skipped on purpose. */
export const RUN_SUCCESS_CONCLUSION = 'success';

/**
 * Format of `git log` read by the deploy report: the full SHA and the subject of each commit,
 * separated by a tab. A line is split at its first tab, so a subject keeps any tab it holds.
 */
export const COMMIT_LOG_FORMAT = '%H%x09%s';

/** Separator of the SHA and the subject in each line of {@link COMMIT_LOG_FORMAT}. */
export const COMMIT_LOG_SEPARATOR = '\t';

/**
 * Number of times the deploy report looks for the CI run that the push to main started, which
 * GitHub creates a few seconds after the push.
 */
export const MAIN_CI_RUN_LOOKUP_ATTEMPTS = 6;

/** Pause between two lookups of the CI run of main, in milliseconds. */
export const MAIN_CI_RUN_LOOKUP_DELAY_MS = 5000;

/** Line break of any platform, which a step output of GitHub Actions cannot hold. */
export const LINE_BREAK_PATTERN = /[\r\n]/;

/** Slash at the end of a URL path, removed before another segment is added. */
export const TRAILING_SLASH_PATTERN = /\/$/;
