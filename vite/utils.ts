import { DEFAULT_DEV_PORT, MAX_PORT, MIN_PORT, PORT_PATTERN } from './constants';

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
 * Vite's default port. Vite still moves to the next free port when the chosen one is taken.
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
