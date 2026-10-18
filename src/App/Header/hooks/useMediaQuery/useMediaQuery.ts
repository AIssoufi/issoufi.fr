import { useCallback, useSyncExternalStore } from 'react';

/** Parameters of {@link useMediaQuery}. */
interface UseMediaQueryParams {
  /** Media query to watch, such as `(min-width: 50em)`. */
  query?: string;
}

/**
 * Returns the media query list of a query, or `null` when it cannot be watched: an empty query,
 * which browsers treat as matching everything, or a browser without `matchMedia`, such as jsdom.
 */
const getMediaQueryList = (query: string) => {
  const canMatchMedia = typeof window.matchMedia === 'function';
  const isBlankQuery = !query.trim();
  if (!canMatchMedia || isBlankQuery) return null;

  return window.matchMedia(query);
};

/** Server render, where no screen is known: the query does not match. */
const getServerSnapshot = () => false;

/**
 * Tells whether the page matches a media query, and renders again when it starts or stops
 * matching, for instance when the window is resized or the phone rotated. Listens to the `change`
 * event of the query, and removes the listener on unmount or when the query changes.
 *
 * @returns `false` for an empty query and where `matchMedia` does not exist, as for an invalid
 * query, which the browser never matches.
 */
export function useMediaQuery({ query = '' }: UseMediaQueryParams = {}): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = getMediaQueryList(query);
      mediaQueryList?.addEventListener('change', onChange);

      return () => {
        mediaQueryList?.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  const getSnapshot = () => getMediaQueryList(query)?.matches ?? false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
