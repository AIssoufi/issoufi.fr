/**
 * Event that Vite dispatches on `window` when a chunk loaded with a dynamic `import()` fails to
 * load, for example because a newer deployment removed it.
 * @see https://vite.dev/guide/build#load-error-handling
 */
export const PRELOAD_ERROR_EVENT = 'vite:preloadError';

/** Session storage key holding the time of the last reload for a missing chunk, in milliseconds. */
export const STALE_CHUNK_RELOAD_STORAGE_KEY = 'staleChunkReloadAt';

/**
 * Shortest time between two reloads for a missing chunk. A chunk that is still missing after a
 * reload is missing from the current deployment too: another reload would loop forever.
 */
export const STALE_CHUNK_RELOAD_COOLDOWN_MS = 60_000;

/**
 * Width of the small buttons of the floating controls: each button of the language toggle, the
 * indicator sliding under the active one, and the GitHub button of the site badge.
 */
export const BUTTON_WIDTH_PX = 36;
/**
 * Height of the small buttons of the floating controls: each button of the language toggle, the
 * indicator sliding under the active one, and the GitHub button of the site badge.
 */
export const BUTTON_HEIGHT_PX = 32;
