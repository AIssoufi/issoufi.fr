import {
  DEFAULT_DEV_PORT,
  FALLBACK_CHUNK_NAME,
  INDEX_CHUNK_NAME,
  MAX_PORT,
  MIN_PORT,
  PATH_SEPARATOR_PATTERN,
  PORT_PATTERN,
} from './constants';

/** Environment variables, as Vite's `loadEnv` returns them. */
type Env = Record<string, string | undefined>;

/** Ports of the dev and preview servers. */
interface ServerPorts {
  /** Port of `pnpm dev`. */
  dev: number;
  /** Port of `pnpm preview`, or `undefined` to keep Vite's default preview port, 4173. */
  preview?: number;
}

/**
 * Reads a TCP port from the value of an environment variable.
 *
 * @param value - Raw value of the variable. Surrounding spaces are ignored.
 * @returns The port, or `undefined` when the value is missing, empty, not a whole number written
 * in digits, or outside 1–65535, so the caller falls back to its default port.
 *
 * @example
 * parsePort('12345'); // 12345
 * parsePort('abc'); // undefined
 */
export const parsePort = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;

  const digits = value.trim();
  const isWrittenInDigits = PORT_PATTERN.test(digits);
  if (!isWrittenInDigits) return undefined;

  const port = Number(digits);
  const isInRange = port >= MIN_PORT && port <= MAX_PORT;
  return isInRange ? port : undefined;
};

/**
 * Picks the ports of the dev and preview servers from the `PORT` variable, which the Worktrunk
 * hook of `.config/wt.toml` writes to the `.env.local` of each worktree. Without a valid `PORT`,
 * as in the main checkout, the dev server uses {@link DEFAULT_DEV_PORT} and the preview server
 * Vite's default port.
 *
 * @param env - Environment variables. Defaults to none.
 * @returns The port of each server.
 *
 * @example
 * getServerPorts({ PORT: '12345' }); // { dev: 12345, preview: 12345 }
 * getServerPorts({}); // { dev: 3000, preview: undefined }
 */
export const getServerPorts = (env: Env = {}): ServerPorts => {
  const port = parsePort(env?.PORT);
  return { dev: port ?? DEFAULT_DEV_PORT, preview: port };
};

/** Chunk of the build, as Rollup passes it to `output.chunkFileNames`: the fields that name it. */
interface ChunkNameInfo {
  /** Name Rollup gives the chunk: the file name of its main module, without the extension. */
  name?: string;
  /** Path of the main module of the chunk, `null` for a chunk of modules shared by others. */
  facadeModuleId?: string | null;
}

/**
 * Names a chunk of the build after the folder of its main module when that module is an `index`
 * file, so the chunk of a page loaded on its first visit, `src/pages/Projects/index.ts`, reads
 * `Projects` rather than `index` in the build and in the size report of the CI.
 *
 * @param chunk - Chunk to name. Defaults to none.
 * @returns The folder of the `index` module, the name Rollup gave otherwise, and
 * {@link FALLBACK_CHUNK_NAME} when the chunk has no name.
 *
 * @example
 * getChunkName({ name: 'index', facadeModuleId: '/app/src/pages/Projects/index.ts' }); // 'Projects'
 * getChunkName({ name: 'lottie_light', facadeModuleId: '/app/node_modules/lottie_light.js' }); // 'lottie_light'
 */
export const getChunkName = ({ name, facadeModuleId }: ChunkNameInfo = {}): string => {
  const hasName = typeof name === 'string' && name !== '';
  if (!hasName) return FALLBACK_CHUNK_NAME;

  const isIndexChunk = name === INDEX_CHUNK_NAME && typeof facadeModuleId === 'string';
  if (!isIndexChunk) return name;

  const folders = facadeModuleId.split(PATH_SEPARATOR_PATTERN).slice(0, -1);
  const parentFolder = folders[folders.length - 1];
  return parentFolder || name;
};
