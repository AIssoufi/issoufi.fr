/**
 * Folder of the standalone build, next to `dist`: the site in one HTML file that a visitor opens
 * from the disk. Gitignored, like `dist`.
 */
export const STANDALONE_OUT_DIR = 'dist-standalone';

/** Only page of the standalone build, which shows every route through the hash of its URL. */
export const STANDALONE_PAGE_FILE_NAME = 'index.html';

/** File of the standalone build that tells a visitor how to open it. */
export const STANDALONE_README_FILE_NAME = 'README.txt';

/** Source of {@link STANDALONE_README_FILE_NAME}, from the root of the project. */
export const STANDALONE_README_SOURCE = 'vite/standalone/README.txt';

/** Module of the router that the app imports. */
export const ROUTER_MODULE = 'react-router';

/**
 * Module that replaces {@link ROUTER_MODULE} for the app in the standalone build, from the root
 * of the project: the same exports, with a router that reads the hash of the URL.
 */
export const HASH_ROUTER_MODULE = 'vite/standalone/react-router.ts';

/** Folder of the code of the app, from the root of the project. */
export const APP_DIR = 'src';

/** Name of an HTML file of the build. */
export const HTML_FILE_PATTERN = /\.html$/;

/** A quote that opens or closes a string in JavaScript: single, double or back quote. */
export const QUOTE_PATTERN = '["\'`]';

/** Optional backslash before a quote, as in a JSON module that Vite turns into a string. */
export const OPTIONAL_ESCAPE_PATTERN = '\\\\?';

/** Characters that have a meaning in a regular expression. */
export const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

/** Trailing slashes of a folder path. */
export const TRAILING_SLASHES_PATTERN = /\/+$/;
