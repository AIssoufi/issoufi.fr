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
 * which 131.3 kB in the main chunk, down from a single bundle of 225.3 kB. Drawing the burger icon
 * in CSS (issue #191) then took them from 195.1 kB to 145.9 kB: the 48.4 kB chunk of lottie-web
 * went, and the main chunk lost the animation and its hook, from 137.1 kB to 136.3 kB. The margin
 * leaves room for React 19.3, which adds about 9.3 kB, and about 15 kB more: a library as heavy
 * as lottie-web fails the build.
 */
export const SCRIPT_BUDGET_GZIP_BYTES = 170_000;

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

/**
 * HTML pages of the build, one per route: at its root for the default language, and in the folder
 * of the prefix of each other language, such as `en/projects.html`.
 */
export const HTML_FILE_PATTERN = /\.html$/;

/** Separator of the folders in a path of the build and in a route. */
export const PATH_SEPARATOR = '/';

/** Separators of the folders in a path that Node.js lists on Windows. */
export const WINDOWS_PATH_SEPARATOR_PATTERN = /\\/g;

/** Route of the home page. */
export const HOME_PAGE_ROUTE = '/';

/** Page of the build served at {@link HOME_PAGE_ROUTE}. */
export const HOME_PAGE_FILE = 'index.html';

/**
 * Page of the build that Cloudflare Pages serves, with a 404, for any unknown path: the one of the
 * closest folder up the path, such as `en/404.html` for an unknown path under `/en/`.
 */
export const NOT_FOUND_PAGE_FILE = '404.html';

/**
 * A file of the build, other than a page, that a deployed site must serve unchanged.
 * @typedef {object} ServedAsBuiltFile
 * @property {string} name - Name of the file, e.g. `sitemap.xml`.
 * @property {boolean} [isInEveryFolder] - Whether the site serves the copy of the file of each
 * folder of the build, such as `en/`, rather than the one of its root only, which it does when
 * this is left out.
 * @property {string} [mediaType] - Media type that the site must send it with, the `Content-Type`
 * of the response without its parameters. Left out, any media type passes.
 */

/**
 * Files of the build, other than its pages, that a deployed site must serve unchanged: at its
 * root, where search engines look for them, `robots.txt` and the `sitemap.xml` that it declares;
 * and the web app manifest of each language, at the root and in the folder of each other language
 * (`en/manifest.webmanifest`), with the media type that browsers expect of a manifest, as
 * `WEB_MANIFEST_FILE_NAME` and `WEB_MANIFEST_MEDIA_TYPE` of `src/utils/webManifest.ts` name them.
 * The smoke test compares each one with the build.
 * @type {readonly ServedAsBuiltFile[]}
 */
export const SERVED_AS_BUILT_FILES = [
  { name: 'robots.txt' },
  { name: 'sitemap.xml' },
  { name: 'manifest.webmanifest', isInEveryFolder: true, mediaType: 'application/manifest+json' },
];

/** Parameters of the `Content-Type` of a response, after its media type, e.g. `; charset=utf-8`. */
export const MEDIA_TYPE_PARAMETERS_PATTERN = /;.*$/s;

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

/**
 * Path that no page uses, requested to check the not found page, behind the folder of the page for
 * a not found page in a folder, such as `/en/smoke-test-page-that-does-not-exist`.
 */
export const MISSING_PAGE_ROUTE = '/smoke-test-page-that-does-not-exist';

/** HTTP status of a page served normally. */
export const HTTP_OK = 200;

/** HTTP status of the not found page. */
export const HTTP_NOT_FOUND = 404;

/** HTTP statuses of a redirect, whose `Location` header gives the new address. */
export const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

/**
 * Address of the production site, normalized as `URL` writes it: the site that the smoke test
 * checks when it gets no URL, and that {@link REDIRECTED_SITE_URLS} must redirect to. The app
 * builds its canonical URLs from its own `SITE_URL` (`src/utils/pages.ts`), written without the
 * trailing slash, and `public/robots.txt` declares its sitemap at the same address: the
 * `production address` tests of `scripts/ci/utils/pages.spec.js` fail when one of the three
 * changes alone.
 */
export const SITE_URL = 'https://issoufi.fr/';

/**
 * Other addresses of the production site, without HTTPS and with `www`, which must redirect to
 * {@link SITE_URL}. The redirects are set in Cloudflare, so the CI checks them on `main` only.
 */
export const REDIRECTED_SITE_URLS = ['http://issoufi.fr/', 'https://www.issoufi.fr/'];

/** Number of times the smoke test checks the site before failing, while a deployment spreads. */
export const SMOKE_TEST_ATTEMPTS = 5;

/** Pause between two attempts of the smoke test, in milliseconds. */
export const SMOKE_TEST_RETRY_DELAY_MS = 5000;

/** Time zone whose local time the production deploy of `deploy-production.yml` follows. */
export const DEPLOY_TIME_ZONE = 'Europe/Paris';

/** Workflow of the daily production deploy, which reads its own scheduled runs. */
export const DEPLOY_WORKFLOW_FILE = 'deploy-production.yml';

/**
 * Earliest local time of the daily deploy in {@link DEPLOY_TIME_ZONE}, in minutes after midnight:
 * 6:00. The crons of `deploy-production.yml` start a run every 30 minutes from 4:07 to 6:37 UTC,
 * which is 6:07 to 8:37 in Paris in summer (UTC+2) and 5:07 to 7:37 in winter (UTC+1): the runs
 * before 6:00 stop, and the first of the others that passes deploys.
 */
export const DEPLOY_START_MINUTES = 360;

/**
 * Number of scheduled runs of {@link DEPLOY_WORKFLOW_FILE} that the schedule check reads, newest
 * first: the six of a day at most, and the last ones of the days before, whose gap it checks.
 */
export const DEPLOY_RUNS_PAGE_SIZE = 20;

/**
 * Longest gap between two scheduled runs of {@link DEPLOY_WORKFLOW_FILE}, in hours, before the
 * schedule check warns that GitHub skipped every run of a day: a day and the 2 h 30 of the
 * window of the crons, from the first run of a day to the last run of the next, plus 9 h 30 for
 * the delays of GitHub's scheduler, which started the run of 4:00 UTC at 9:29 UTC on
 * 2026-10-19. A day without any run leaves at least 45 h 30 when the runs keep their time.
 */
export const SCHEDULE_GAP_WARNING_HOURS = 36;

/** Milliseconds per minute, to shift a moment by an offset from UTC and to measure a gap. */
export const MS_PER_MINUTE = 60_000;

/** Length of the date at the start of an ISO 8601 timestamp, `YYYY-MM-DD`. */
export const ISO_DATE_LENGTH = 10;

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

/**
 * Event of a run started by a pull request: the only run of the CI whose checks GitHub links to
 * the pull request, so the only one that the required checks of a ruleset count.
 */
export const PULL_REQUEST_EVENT = 'pull_request';

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
 * Number of runs that the deploy and the schedule-gap check of the CI ask the REST API for: the
 * latest only, since the API lists the runs of a workflow newest first.
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
 * Conclusion of a completed workflow run that GitHub holds until someone with write access
 * approves it, as it does for the pull request runs of a pull request that GitHub Actions opened.
 * Approving it starts the same run again, as a new attempt.
 */
export const RUN_ACTION_REQUIRED_CONCLUSION = 'action_required';

/**
 * Number of times the daily release reads a run of the CI before giving up, every
 * {@link RUN_WAIT_DELAY_MS}: the pull request run of the release pull request, which it may have
 * approved, then the run it starts on develop. 20 minutes in all, while a run of `ci.yml`, its
 * preview deployment and smoke test included, took about 5 minutes in October 2026.
 */
export const RUN_WAIT_ATTEMPTS = 40;

/** Pause between two reads of a run of the CI that the daily release waits for, in milliseconds. */
export const RUN_WAIT_DELAY_MS = 30_000;

/**
 * Workflow that keeps the release pull request open and publishes the release once it is merged,
 * which the daily release starts by hand after merging it.
 */
export const RELEASE_WORKFLOW_FILE = 'release.yml';

/** Label that release-please gives its release pull request until the release is published. */
export const RELEASE_PENDING_LABEL = 'autorelease: pending';

/**
 * Start of the branch of the release pull request that release-please keeps open against
 * {@link DEVELOP_BRANCH}, such as `release-please--branches--develop--components--issoufi-v3`.
 */
export const RELEASE_BRANCH_PREFIX = 'release-please--branches--develop--';

/**
 * Merge method of the release pull request: a merge commit, like every pull request merged into
 * {@link DEVELOP_BRANCH}.
 */
export const RELEASE_MERGE_METHOD = 'merge';

/**
 * Number of open pull requests into {@link DEVELOP_BRANCH} that the daily release reads to find
 * the release pull request: the most the REST API gives in one page.
 */
export const OPEN_PULL_REQUESTS_PAGE_SIZE = 100;

/**
 * Values of the `mergeable_state` of a pull request of the REST API that let it merge:
 * `clean`, every check passed; `unstable`, a check that no rule requires did not pass, such as
 * the one of the Cloudflare Pages app; `has_hooks`, a pre-receive hook will check the push.
 */
export const MERGEABLE_STATES = ['clean', 'unstable', 'has_hooks'];

/**
 * Why a pull request cannot merge, for each other value of its `mergeable_state`, written after
 * its number in a message. A value missing here gives `cannot merge`.
 * @type {Readonly<Record<string, string>>}
 */
export const UNMERGEABLE_STATE_REASONS = {
  blocked: 'is blocked by a rule of the base branch',
  behind: 'is behind its base branch, which a rule requires to be up to date',
  dirty: 'conflicts with its base branch',
  draft: 'is a draft',
  unknown: 'has not been checked by GitHub yet',
};

/**
 * Number of times the daily release reads the release pull request, once its CI passed, until
 * GitHub says it can merge, every {@link MERGEABLE_WAIT_DELAY_MS}: 5 minutes in all, while GitHub
 * takes a few seconds to count the checks of a run that just ended.
 */
export const MERGEABLE_WAIT_ATTEMPTS = 30;

/** Pause between two reads of the release pull request that waits to merge, in milliseconds. */
export const MERGEABLE_WAIT_DELAY_MS = 10_000;

/**
 * Number of times the daily release tries to merge the release pull request: release-please
 * rewrites its branch on each push to develop, which cancels the CI of the old head or makes
 * GitHub refuse its merge (409, _Head branch was modified_), as on 2026-10-19. The next attempt
 * starts again from the new head. Each attempt waits up to 26 minutes, which the timeout of the
 * release job of `deploy-production.yml` covers.
 */
export const RELEASE_MERGE_ATTEMPTS = 2;

/**
 * Number of times the daily release looks for the run of the CI that the pull request event
 * started on the head of the release pull request, every
 * {@link PULL_REQUEST_RUN_LOOKUP_DELAY_MS}: GitHub creates it a few seconds after release-please
 * pushed.
 */
export const PULL_REQUEST_RUN_LOOKUP_ATTEMPTS = 6;

/** Pause between two lookups of the run of the CI of the release pull request, in milliseconds. */
export const PULL_REQUEST_RUN_LOOKUP_DELAY_MS = 10_000;

/** Type of the rule of a ruleset that names the status checks required to merge. */
export const REQUIRED_STATUS_CHECKS_RULE = 'required_status_checks';

/**
 * Number of check runs of a commit that the daily release reads to name the required checks that
 * did not pass: the most the REST API gives in one page, while a run of the CI makes 15.
 */
export const CHECK_RUNS_PAGE_SIZE = 100;

/**
 * Conclusions of a completed check run that a required status check accepts, as GitHub counts
 * them.
 */
export const PASSING_CHECK_CONCLUSIONS = ['success', 'neutral', 'skipped'];

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

/**
 * Levels of the annotations that the scripts write to the log of GitHub Actions with a workflow
 * command, such as `::warning::<message>`. Each one has its own icon and color in GitHub.
 */
export const ANNOTATION_LEVELS = /** @type {const} */ (['error', 'warning', 'notice']);

/**
 * Name of a property of an annotation, written as is: a word, like the names that GitHub reads
 * (`file`, `line`, `endLine`, `col`, `endColumn`, `title`).
 */
export const ANNOTATION_PROPERTY_NAME_PATTERN = /^[a-z]+$/i;

/**
 * Characters that GitHub Actions reads as part of a workflow command, and the percent-encoding
 * that writes each one as text, which GitHub decodes when it shows the annotation: a line break
 * would end the command, `%` would start an encoding, and `:` or `,` would end a property, such
 * as the `file` of an annotation. Each character of {@link WORKFLOW_DATA_ESCAPE_PATTERN} and
 * {@link WORKFLOW_PROPERTY_ESCAPE_PATTERN} needs its encoding here, which a test checks.
 */
export const WORKFLOW_COMMAND_ESCAPES = {
  '%': '%25',
  '\r': '%0D',
  '\n': '%0A',
  ':': '%3A',
  ',': '%2C',
};

/** Characters to escape in the message of a workflow command: `%` and the line breaks. */
export const WORKFLOW_DATA_ESCAPE_PATTERN = /[%\r\n]/g;

/**
 * Characters to escape in a property of a workflow command: those of the message, plus `:` and
 * `,`, which end the properties.
 */
export const WORKFLOW_PROPERTY_ESCAPE_PATTERN = /[%\r\n:,]/g;

/** Slash at the end of a URL path, removed before another segment is added. */
export const TRAILING_SLASH_PATTERN = /\/$/;
