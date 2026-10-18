import { fireEvent, renderHook } from '@testing-library/react';

import { PARALLAX_RESET_DURATION_MS } from '../../constants';
import { useParallax } from './useParallax';

describe('useParallax', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    window.innerWidth = 1000;
    window.innerHeight = 800;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shifts the element away from the pointer', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));

    fireEvent.mouseMove(window, { clientX: 1000, clientY: 0 });

    expect(element.style.transform).toBe('translate(-10px, 7px)');
  });

  it('eases back to the center when the mouse leaves, then removes the transition', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));
    fireEvent.mouseMove(window, { clientX: 1000, clientY: 0 });

    fireEvent.mouseLeave(document);
    expect(element.style.transform).toBe('');
    expect(element.style.transition).toContain('transform 0.9s');

    vi.advanceTimersByTime(PARALLAX_RESET_DURATION_MS);
    expect(element.style.transition).toBe('');
  });

  it('does not fail without an element', () => {
    renderHook(() => useParallax({ current: null }));

    expect(() => {
      fireEvent.mouseMove(window, { clientX: 10, clientY: 10 });
      fireEvent.mouseLeave(document);
    }).not.toThrow();
  });

  it('does not fail when the element is gone before its transition is removed', () => {
    const element = document.createElement('div');
    const elementRef: { current: HTMLElement | null } = { current: element };
    renderHook(() => useParallax(elementRef));
    fireEvent.mouseLeave(document);

    elementRef.current = null;

    expect(() => vi.advanceTimersByTime(PARALLAX_RESET_DURATION_MS)).not.toThrow();
    expect(element.style.transition).toContain('transform 0.9s');
  });

  it('stops reacting and clears the pending reset on unmount', () => {
    const element = document.createElement('div');
    const { unmount } = renderHook(() => useParallax({ current: element }));
    fireEvent.mouseLeave(document);

    unmount();
    fireEvent.mouseMove(window, { clientX: 1000, clientY: 0 });
    vi.advanceTimersByTime(PARALLAX_RESET_DURATION_MS);

    expect(element.style.transform).toBe('');
    expect(element.style.transition).toContain('transform 0.9s');
  });
});
