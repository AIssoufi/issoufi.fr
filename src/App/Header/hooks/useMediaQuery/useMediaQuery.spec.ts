import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useMediaQuery } from './useMediaQuery';

const DESKTOP_QUERY = '(min-width: 50em)';
const WIDE_QUERY = '(min-width: 100em)';

/**
 * Replaces `window.matchMedia`, which jsdom lacks, with a stub whose queries match while
 * `matches` is true. `setMatches` changes it and notifies the listeners, as a resize would.
 */
const stubMatchMedia = ({ matches }: { matches: boolean }) => {
  const listeners = new Set<() => void>();
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
  };
  const matchMedia = vi.fn(() => mediaQueryList);
  vi.stubGlobal('matchMedia', matchMedia);

  const setMatches = (nextMatches: boolean) => {
    mediaQueryList.matches = nextMatches;
    act(() => listeners.forEach(listener => listener()));
  };

  return { matchMedia, mediaQueryList, setMatches };
};

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([true, false])('returns %s when the query matches it', matches => {
    const { matchMedia } = stubMatchMedia({ matches });

    const { result } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY }));

    expect(result.current).toBe(matches);
    expect(matchMedia).toHaveBeenCalledWith(DESKTOP_QUERY);
  });

  it('follows the query when it starts or stops matching', () => {
    const { setMatches } = stubMatchMedia({ matches: false });
    const { result } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY }));

    setMatches(true);
    expect(result.current).toBe(true);

    setMatches(false);
    expect(result.current).toBe(false);
  });

  it('watches the new query when the query changes', () => {
    const { matchMedia } = stubMatchMedia({ matches: false });
    const { rerender } = renderHook(props => useMediaQuery(props), {
      initialProps: { query: DESKTOP_QUERY },
    });

    rerender({ query: WIDE_QUERY });

    expect(matchMedia).toHaveBeenLastCalledWith(WIDE_QUERY);
  });

  it('stops listening on unmount', () => {
    const { mediaQueryList } = stubMatchMedia({ matches: false });
    const { unmount } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY }));

    unmount();

    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('returns false where matchMedia does not exist, as in jsdom', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result, unmount } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY }));

    expect(result.current).toBe(false);
    expect(() => unmount()).not.toThrow();
  });

  it.each([
    ['an empty query', ''],
    ['a blank query', '   '],
    ['no query', undefined],
  ])('returns false without asking the browser for %s', (_case, query) => {
    const { matchMedia } = stubMatchMedia({ matches: true });

    const { result } = renderHook(() => useMediaQuery({ query }));

    expect(result.current).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it('returns false on the server, where no screen is known', () => {
    stubMatchMedia({ matches: true });
    const Probe = () => String(useMediaQuery({ query: DESKTOP_QUERY }));

    expect(renderToString(createElement(Probe))).toBe('false');
  });

  describe('onChange', () => {
    it('is called with the new result when the query starts or stops matching', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const onChange = vi.fn();
      renderHook(() => useMediaQuery({ query: DESKTOP_QUERY, onChange }));

      setMatches(true);
      setMatches(false);

      expect(onChange.mock.calls).toEqual([[true], [false]]);
    });

    it('is not called for the first render', () => {
      stubMatchMedia({ matches: true });
      const onChange = vi.fn();

      renderHook(() => useMediaQuery({ query: DESKTOP_QUERY, onChange }));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('calls the latest callback, without listening again', () => {
      const { mediaQueryList, setMatches } = stubMatchMedia({ matches: false });
      const firstOnChange = vi.fn();
      const latestOnChange = vi.fn();
      const { rerender } = renderHook(props => useMediaQuery(props), {
        initialProps: { query: DESKTOP_QUERY, onChange: firstOnChange },
      });
      const listenerCount = mediaQueryList.addEventListener.mock.calls.length;

      rerender({ query: DESKTOP_QUERY, onChange: latestOnChange });
      setMatches(true);

      expect(firstOnChange).not.toHaveBeenCalled();
      expect(latestOnChange).toHaveBeenCalledWith(true);
      expect(mediaQueryList.addEventListener).toHaveBeenCalledTimes(listenerCount);
    });

    it('listens to the new query only when the query changes', () => {
      // One list of listeners per query, so that a change of one query reaches only its own
      const listenersByQuery = new Map<string, Set<() => void>>();
      vi.stubGlobal('matchMedia', (query: string) => {
        const listeners = listenersByQuery.get(query) ?? new Set<() => void>();
        listenersByQuery.set(query, listeners);
        return {
          matches: false,
          addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
          removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
        };
      });
      const fireChange = (query: string) =>
        act(() => listenersByQuery.get(query)?.forEach(listener => listener()));
      const onChange = vi.fn();
      const { rerender } = renderHook(props => useMediaQuery(props), {
        initialProps: { query: DESKTOP_QUERY, onChange },
      });

      rerender({ query: WIDE_QUERY, onChange });
      fireChange(DESKTOP_QUERY);
      expect(onChange).not.toHaveBeenCalled();

      fireChange(WIDE_QUERY);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('is no longer called after unmount', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const onChange = vi.fn();
      const { unmount } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY, onChange }));

      unmount();
      setMatches(true);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('is optional', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const { result } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY }));

      expect(() => setMatches(true)).not.toThrow();
      expect(result.current).toBe(true);
    });

    it('is never called where matchMedia does not exist', () => {
      vi.stubGlobal('matchMedia', undefined);
      const onChange = vi.fn();

      const { unmount } = renderHook(() => useMediaQuery({ query: DESKTOP_QUERY, onChange }));

      expect(() => unmount()).not.toThrow();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not listen to an empty query', () => {
      const { matchMedia } = stubMatchMedia({ matches: true });

      renderHook(() => useMediaQuery({ query: '', onChange: vi.fn() }));

      expect(matchMedia).not.toHaveBeenCalled();
    });
  });

  it('returns false without any parameter', () => {
    stubMatchMedia({ matches: true });

    const { result } = renderHook(() => useMediaQuery());

    expect(result.current).toBe(false);
  });
});
