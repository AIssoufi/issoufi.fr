import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useMediaQuery } from './useMediaQuery';

const DESKTOP_QUERY = '(min-width: 50em)';

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

    rerender({ query: '(min-width: 100em)' });

    expect(matchMedia).toHaveBeenLastCalledWith('(min-width: 100em)');
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

  it('returns false without any parameter', () => {
    stubMatchMedia({ matches: true });

    const { result } = renderHook(() => useMediaQuery());

    expect(result.current).toBe(false);
  });
});
