import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useIsHydrated } from './useIsHydrated.ts';

describe('useIsHydrated', () => {
  it('returns true when the browser renders the app from scratch', () => {
    const { result } = renderHook(() => useIsHydrated());

    expect(result.current).toBe(true);
  });

  it('returns false when the app renders at build time', () => {
    const values: boolean[] = [];
    const Probe = () => {
      values.push(useIsHydrated());
      return null;
    };

    renderToString(createElement(Probe));

    expect(values).toEqual([false]);
  });

  it('returns false while the browser hydrates the page, then true', () => {
    const values: boolean[] = [];
    const container = document.body.appendChild(document.createElement('div'));

    const { result } = renderHook(
      () => {
        const isHydrated = useIsHydrated();
        values.push(isHydrated);
        return isHydrated;
      },
      { container, hydrate: true },
    );

    expect(values[0]).toBe(false);
    expect(result.current).toBe(true);
  });

  it('keeps returning true across renders, without listening to anything', () => {
    const { result, rerender, unmount } = renderHook(() => useIsHydrated());

    rerender();

    expect(result.current).toBe(true);
    expect(unmount).not.toThrow();
  });
});
