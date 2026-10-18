import { STALE_CHUNK_RELOAD_COOLDOWN_MS } from './constants';

/** Parameters of {@link isStaleChunkReloadAllowed}. */
interface IsStaleChunkReloadAllowedParams {
  /**
   * Time of the last reload for a missing chunk, in milliseconds since the epoch, as written to
   * session storage. `null`, missing or not a number when the page never reloaded for that.
   */
  lastReloadAt?: string | null;
  /** Current time, in milliseconds since the epoch. */
  now: number;
  /** Shortest time between two reloads. @default STALE_CHUNK_RELOAD_COOLDOWN_MS */
  cooldownMs?: number;
}

/**
 * Tells whether the page may reload to fetch the chunks of the current deployment, after a chunk
 * of the deployment it was opened with failed to load: only when it did not already reload for
 * that within the cooldown, so a chunk missing from the current deployment never causes a loop.
 *
 * @returns True when the page never reloaded for a missing chunk, when the last reload is older
 * than the cooldown, or when it is in the future (the clock was set back). False when `now` is
 * not a finite number, since the time since the last reload cannot be told.
 *
 * @example
 * isStaleChunkReloadAllowed({ lastReloadAt: null, now: 1_000_000 }); // true
 * isStaleChunkReloadAllowed({ lastReloadAt: '990000', now: 1_000_000 }); // false, 10 s ago
 * isStaleChunkReloadAllowed({ lastReloadAt: '900000', now: 1_000_000 }); // true, 100 s ago
 */
export function isStaleChunkReloadAllowed({
  lastReloadAt,
  now,
  cooldownMs = STALE_CHUNK_RELOAD_COOLDOWN_MS,
}: IsStaleChunkReloadAllowedParams): boolean {
  if (!Number.isFinite(now)) return false;

  const hasStoredTime = typeof lastReloadAt === 'string' && lastReloadAt.trim() !== '';
  const lastReloadTime = hasStoredTime ? Number(lastReloadAt) : NaN;
  if (!Number.isFinite(lastReloadTime)) return true;

  const elapsedMs = now - lastReloadTime;
  const isLastReloadInFuture = elapsedMs < 0;
  return isLastReloadInFuture || elapsedMs >= cooldownMs;
}

/**
 * Passes on the module of a lazily loaded page, or keeps the page loading when there is none.
 * When a chunk fails to load and `useReloadOnStaleChunk` reloads the page, Vite resolves the
 * dynamic import with `undefined` instead of rejecting it: rendering that as a page would throw
 * while the page reloads. A promise that never settles keeps `Suspense` waiting until the
 * reloaded page replaces this one. A failed import that does not reload still rejects,
 * since this only runs on success.
 *
 * @param module - What the dynamic import of the page resolved with.
 * @returns The module itself, or a promise that never settles when it is `undefined` or `null`.
 *
 * @example
 * const Projects = lazy(() => import('../pages/Projects').then(keepPendingWhileReloading));
 */
export function keepPendingWhileReloading<Module>(
  module: Module | null | undefined,
): Module | Promise<never> {
  return module ?? new Promise<never>(() => {});
}
