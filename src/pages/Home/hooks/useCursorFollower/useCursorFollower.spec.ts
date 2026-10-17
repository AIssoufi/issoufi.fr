import { fireEvent, renderHook } from '@testing-library/react';

import { useCursorFollower } from './useCursorFollower';

const FRAME_MS = 16;

describe('useCursorFollower', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('moves the element a fraction of the way to the pointer on each frame', () => {
    const element = document.createElement('div');
    renderHook(() => useCursorFollower({ current: element }));

    fireEvent.mouseMove(window, { clientX: 120, clientY: 220 });
    vi.advanceTimersByTime(FRAME_MS);

    expect(element.style.transform).toBe('translate(-98px, -88px)');
  });

  it('ends up centered on the pointer', () => {
    const element = document.createElement('div');
    renderHook(() => useCursorFollower({ current: element }));

    fireEvent.mouseMove(window, { clientX: 120, clientY: 220 });
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
    fireEvent.mouseMove(window, { clientX: 500, clientY: 500 });
    vi.advanceTimersByTime(FRAME_MS * 10);

    expect(element.style.transform).toBe(transformAfterUnmount);
  });
});
