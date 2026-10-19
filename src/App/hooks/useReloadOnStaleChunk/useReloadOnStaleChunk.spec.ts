import { renderHook } from '@testing-library/react';

import {
  PRELOAD_ERROR_EVENT,
  STALE_CHUNK_RELOAD_COOLDOWN_MS,
  STALE_CHUNK_RELOAD_STORAGE_KEY,
} from '../../constants.ts';
import { useReloadOnStaleChunk } from './useReloadOnStaleChunk.ts';

const NOW = 1_800_000_000_000;

/** Dispatches the event of a failed dynamic import, as Vite does, and returns it. */
const dispatchPreloadError = () => {
  const event = new Event(PRELOAD_ERROR_EVENT, { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('useReloadOnStaleChunk', () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    // jsdom does not let tests replace location.reload itself
    vi.stubGlobal('location', { ...window.location, reload });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reloads the page and remembers when, the first time a chunk fails to load', () => {
    renderHook(() => useReloadOnStaleChunk());

    const event = dispatchPreloadError();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(window.sessionStorage.getItem(STALE_CHUNK_RELOAD_STORAGE_KEY)).toBe(String(NOW));
  });

  it('does not reload again within the cooldown, and leaves the error to the app', () => {
    window.sessionStorage.setItem(STALE_CHUNK_RELOAD_STORAGE_KEY, String(NOW - 1000));
    renderHook(() => useReloadOnStaleChunk());

    const event = dispatchPreloadError();

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('reloads again once the cooldown is over', () => {
    const lastReloadAt = String(NOW - STALE_CHUNK_RELOAD_COOLDOWN_MS);
    window.sessionStorage.setItem(STALE_CHUNK_RELOAD_STORAGE_KEY, lastReloadAt);
    renderHook(() => useReloadOnStaleChunk());

    dispatchPreloadError();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads only once when chunks fail one after the other', () => {
    renderHook(() => useReloadOnStaleChunk());

    dispatchPreloadError();
    dispatchPreloadError();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['read', 'getItem'],
    ['written', 'setItem'],
  ] as const)('does not reload when session storage cannot be %s', (_, method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    renderHook(() => useReloadOnStaleChunk());

    const event = dispatchPreloadError();

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores other events', () => {
    renderHook(() => useReloadOnStaleChunk());

    window.dispatchEvent(new Event('error'));

    expect(reload).not.toHaveBeenCalled();
  });

  it('stops listening on unmount', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useReloadOnStaleChunk());

    unmount();
    dispatchPreloadError();

    expect(removeListener).toHaveBeenCalledWith(PRELOAD_ERROR_EVENT, expect.any(Function));
    expect(reload).not.toHaveBeenCalled();
  });
});
