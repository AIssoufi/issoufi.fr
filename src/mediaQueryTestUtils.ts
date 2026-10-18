import { act } from '@testing-library/react';

/** Parameters of {@link stubMatchMedia}. */
interface StubMatchMediaParams {
  /** Whether every media query matches at first. @default false */
  matches?: boolean;
}

/**
 * Replaces `window.matchMedia`, which jsdom lacks, with a stub whose queries all match while
 * `matches` is true, such as the reduced motion preference of `usePrefersReducedMotion`. Specs
 * undo it with `vi.unstubAllGlobals()`.
 *
 * @returns The stub, to check the queries it was called with, its media query list, and
 * `setMatches`, which changes the result and notifies the listeners in `act`, as a resize or a
 * change of the system settings would.
 *
 * @example
 * const { setMatches } = stubMatchMedia({ matches: true });
 * renderHook(() => usePrefersReducedMotion());
 * setMatches(false);
 */
export const stubMatchMedia = ({ matches = false }: StubMatchMediaParams = {}) => {
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
