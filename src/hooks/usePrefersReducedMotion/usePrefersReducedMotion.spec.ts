import { renderHook } from '@testing-library/react';

import { stubMatchMedia } from '../../mediaQueryTestUtils.ts';
import { REDUCED_MOTION_QUERY } from '../../theme/constants.ts';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.ts';

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('watches the reduced motion preference', () => {
    const { matchMedia } = stubMatchMedia();

    renderHook(() => usePrefersReducedMotion());

    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it.each([
    ['prefers reduced motion', true],
    ['has no preference', false],
  ])('tells whether the visitor %s', (_preference, matches) => {
    stubMatchMedia({ matches });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(matches);
  });

  it('follows the visitor changing the setting, both ways', () => {
    const { setMatches } = stubMatchMedia({ matches: false });
    const { result } = renderHook(() => usePrefersReducedMotion());

    setMatches(true);
    expect(result.current).toBe(true);

    setMatches(false);
    expect(result.current).toBe(false);
  });

  it('stops listening on unmount', () => {
    const { mediaQueryList } = stubMatchMedia();
    const { unmount } = renderHook(() => usePrefersReducedMotion());

    unmount();

    const added = mediaQueryList.addEventListener.mock.calls.map(([, listener]) => listener);
    const removed = mediaQueryList.removeEventListener.mock.calls.map(([, listener]) => listener);
    expect(added).not.toHaveLength(0);
    expect(removed).toEqual(expect.arrayContaining(added));
  });

  it('returns false where matchMedia does not exist, as in jsdom', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});
