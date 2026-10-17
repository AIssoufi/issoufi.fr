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
