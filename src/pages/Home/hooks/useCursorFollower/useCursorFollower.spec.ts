import { fireEvent, renderHook } from '@testing-library/react';

import { stubMatchMedia } from '../../../../mediaQueryTestUtils.ts';
import { useCursorFollower } from './useCursorFollower.ts';

const FRAME_MS = 16;

describe('useCursorFollower', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('moves the element a fraction of the way to the pointer on each frame', () => {
    const element = document.createElement('div');
    renderHook(() => useCursorFollower({ current: element }));

    fireEvent.pointerMove(window, { clientX: 120, clientY: 220 });
    vi.advanceTimersByTime(FRAME_MS);

    expect(element.style.transform).toBe('translate(-98px, -88px)');
  });

  it('ends up centered on the pointer', () => {
    const element = document.createElement('div');
    renderHook(() => useCursorFollower({ current: element }));

    fireEvent.pointerMove(window, { clientX: 120, clientY: 220 });
    vi.advanceTimersByTime(FRAME_MS * 300);

    const [, x, y] = element.style.transform.match(/translate\((.+)px, (.+)px\)/) ?? [];
    expect(Number(x)).toBeCloseTo(100);
    expect(Number(y)).toBeCloseTo(200);
  });

  it('does not fail without an element', () => {
    renderHook(() => useCursorFollower({ current: null }));
    expect(() => vi.advanceTimersByTime(FRAME_MS * 3)).not.toThrow();
  });

  it('cancels the animation on unmount', () => {
    const element = document.createElement('div');
    const { unmount } = renderHook(() => useCursorFollower({ current: element }));
    vi.advanceTimersByTime(FRAME_MS);

    unmount();
    const transformAfterUnmount = element.style.transform;
    fireEvent.pointerMove(window, { clientX: 500, clientY: 500 });
    vi.advanceTimersByTime(FRAME_MS * 10);

    expect(element.style.transform).toBe(transformAfterUnmount);
  });

  describe('with reduced motion', () => {
    it('leaves the element where it is, and requests no animation frame', () => {
      stubMatchMedia({ matches: true });
      const element = document.createElement('div');
      renderHook(() => useCursorFollower({ current: element }));

      fireEvent.pointerMove(window, { clientX: 120, clientY: 220 });
      vi.advanceTimersByTime(FRAME_MS * 10);

      expect(element.style.transform).toBe('');
      expect(vi.getTimerCount()).toBe(0);
    });

    it('stops following the pointer once the visitor turns it on', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const element = document.createElement('div');
      renderHook(() => useCursorFollower({ current: element }));
      fireEvent.pointerMove(window, { clientX: 120, clientY: 220 });
      vi.advanceTimersByTime(FRAME_MS);
      const transformBeforeReducedMotion = element.style.transform;

      setMatches(true);
      fireEvent.pointerMove(window, { clientX: 500, clientY: 500 });
      vi.advanceTimersByTime(FRAME_MS * 10);

      expect(element.style.transform).toBe(transformBeforeReducedMotion);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('follows the pointer again once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      const element = document.createElement('div');
      renderHook(() => useCursorFollower({ current: element }));

      setMatches(false);
      fireEvent.pointerMove(window, { clientX: 120, clientY: 220 });
      vi.advanceTimersByTime(FRAME_MS);

      expect(element.style.transform).toBe('translate(-98px, -88px)');
    });
  });
});
