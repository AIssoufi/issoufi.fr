import { useCallback, useEffect, useEffectEvent, useSyncExternalStore } from 'react';

/** Parameters of {@link useMediaQuery}. */
interface UseMediaQueryParams {
  /** Media query to watch, such as `(min-width: 50em)`. */
  query?: string;
  /**
   * Called with the new result when the query starts or stops matching, from its `change`
   * event, so that a component can react to a resize without an effect of its own. Never called
   * for the first render, nor where the query cannot be watched.
   */
  onChange?: (matches: boolean) => void;
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
 * event of the query, calls `onChange` from it, and removes its listeners on unmount or when the
 * query changes.
 *
 * @returns `false` for an empty query and where `matchMedia` does not exist, as for an invalid
 * query, which the browser never matches.
 *
 * @example
 * const isDesktop = useMediaQuery({
 *   query: '(min-width: 50em)',
 *   onChange: matches => console.log(matches ? 'desktop' : 'mobile'),
 * });
 */
export function useMediaQuery({ query = '', onChange }: UseMediaQueryParams = {}): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = getMediaQueryList(query);
      mediaQueryList?.addEventListener('change', onStoreChange);

      return () => {
        mediaQueryList?.removeEventListener('change', onStoreChange);
      };
    },
    [query],
  );
  const getSnapshot = () => getMediaQueryList(query)?.matches ?? false;

  // An effect event calls the latest callback without listening again each time it changes
  const notifyChange = useEffectEvent((matches: boolean) => onChange?.(matches));

  useEffect(() => {
    const mediaQueryList = getMediaQueryList(query);
    if (!mediaQueryList) return;

    const handleChange = () => notifyChange(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
