import { useSyncExternalStore } from 'react';

/** Nothing to listen to: the value only changes once, after the hydration, which React handles. */
const subscribe = () => () => {};

/** In the browser, once the page is hydrated or when the app renders from scratch. */
const getSnapshot = () => true;

/**
 * In the render of a page at build time (`src/prerender.tsx`), and while the browser hydrates it.
 */
const getServerSnapshot = () => false;

/**
 * Tells whether the app renders in the browser on its own, rather than at build time, where it
 * knows nothing of the visitor, or while the browser hydrates the page rendered then, which must
 * render the same elements. A component shows what depends on the visitor, such as their likes or
 * today's date, only once it returns `true`, and the page rendered at build time otherwise: React
 * renders it again with `true` right after the hydration.
 *
 * @returns `false` at build time and during the hydration, `true` after it, and from the first
 * render when the browser renders the app from scratch, as in the dev server or on a not found
 * page.
 *
 * @example
 * const isHydrated = useIsHydrated();
 * const likedIds = isHydrated ? getStoredLikedIds() : new Set();
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
