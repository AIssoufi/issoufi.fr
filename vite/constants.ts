/** Port of the dev server when no `PORT` is set, as in the main checkout. */
export const DEFAULT_DEV_PORT = 3000;

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
 * counts the scripts of this folder (`ASSETS_SUBDIR` in `scripts/ci/constants.mjs`): keep both equal.
 */
export const ASSETS_DIR = 'assets';

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
