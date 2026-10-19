import {
  PAGE_HEADING_SELECTOR,
  SCRIPT_ONLY_TAB_INDEX,
  STALE_CHUNK_RELOAD_COOLDOWN_MS,
} from './constants';

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

/** Parameters of {@link focusPageHeading}. */
interface FocusPageHeadingParams {
  /** Element or document holding the page. Nothing is focused when `null`. @default document */
  root?: ParentNode | null;
}

/**
 * Moves the focus to the main heading of the page, the first `h1` of `root`, so that keyboard and
 * screen reader users start on the new page after a navigation. A heading cannot take the focus
 * by itself: it gets `tabindex="-1"`, which lets this script focus it without adding it to the
 * `Tab` order, unless it already has a `tabindex`. Does nothing when `root` holds no `h1`.
 *
 * @example
 * focusPageHeading(); // the first h1 of the document has the focus
 */
export function focusPageHeading({ root = document }: FocusPageHeadingParams = {}): void {
  const heading = root?.querySelector<HTMLElement>(PAGE_HEADING_SELECTOR);
  if (!heading) return;

  const hasOwnTabIndex = heading.hasAttribute('tabindex');
  if (!hasOwnTabIndex) heading.tabIndex = SCRIPT_ONLY_TAB_INDEX;
  heading.focus();
}
