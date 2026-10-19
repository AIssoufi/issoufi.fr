import { useEffect } from 'react';

import { PRELOAD_ERROR_EVENT, STALE_CHUNK_RELOAD_STORAGE_KEY } from '../../constants.ts';
import { isStaleChunkReloadAllowed } from '../../utils.ts';

/**
 * Reloads the page when a lazily loaded chunk fails to load. Each deployment replaces the hashed
 * chunks of the previous one, so a page opened before a deployment cannot load the pages it has
 * not visited yet; the reload fetches the HTML and the chunks of the current deployment. It
 * reloads at most once a minute (`STALE_CHUNK_RELOAD_COOLDOWN_MS`, see
 * {@link isStaleChunkReloadAllowed}), and not at all without session storage to remember it, so a
 * chunk missing from the current deployment never causes a loop: the error is then left to the
 * app. The listener is removed on unmount.
 */
export function useReloadOnStaleChunk(): void {
  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      try {
        const now = Date.now();
        const lastReloadAt = window.sessionStorage.getItem(STALE_CHUNK_RELOAD_STORAGE_KEY);
        if (!isStaleChunkReloadAllowed({ lastReloadAt, now })) return;

        window.sessionStorage.setItem(STALE_CHUNK_RELOAD_STORAGE_KEY, String(now));
      } catch {
        // Without session storage, the next page could not tell that it was a reload
        return;
      }

      // Stops Vite from throwing the error, since the page is about to reload
      event.preventDefault();
      window.location.reload();
    };

    window.addEventListener(PRELOAD_ERROR_EVENT, handlePreloadError);

    return () => {
      window.removeEventListener(PRELOAD_ERROR_EVENT, handlePreloadError);
    };
  }, []);
}
