import { fireEvent, renderHook } from '@testing-library/react';

import { stubMatchMedia } from '../../../../mediaQueryTestUtils.ts';
import { PARALLAX_RESET_DURATION_MS } from '../../constants.ts';
import { useParallax } from './useParallax.ts';

describe('useParallax', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    window.innerWidth = 1000;
    window.innerHeight = 800;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shifts the element away from the pointer', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));

    fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });

    expect(element.style.transform).toBe('translate(-10px, 7px)');
  });

  it('shifts the element away from a pen too', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));

    fireEvent.pointerMove(window, { pointerType: 'pen', clientX: 1000, clientY: 0 });

    expect(element.style.transform).toBe('translate(-10px, 7px)');
  });

  it('leaves the element in its place under a finger, which would leave it shifted after a tap', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));

    fireEvent.pointerMove(window, { pointerType: 'touch', clientX: 1000, clientY: 0 });
    // The mouse events that a browser sends after a tap
    fireEvent.mouseMove(window, { clientX: 1000, clientY: 0 });

    expect(element.style.transform).toBe('');
  });

  it('eases back to the center when the mouse leaves, then removes the transition', () => {
    const element = document.createElement('div');
    renderHook(() => useParallax({ current: element }));
    fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });

    fireEvent.mouseLeave(document);
    expect(element.style.transform).toBe('');
    expect(element.style.transition).toContain('transform 0.9s');

    vi.advanceTimersByTime(PARALLAX_RESET_DURATION_MS);
    expect(element.style.transition).toBe('');
  });

  it('does not fail without an element', () => {
    renderHook(() => useParallax({ current: null }));

    expect(() => {
      fireEvent.pointerMove(window, { clientX: 10, clientY: 10 });
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
    fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });
    vi.advanceTimersByTime(PARALLAX_RESET_DURATION_MS);

    expect(element.style.transform).toBe('');
    expect(element.style.transition).toContain('transform 0.9s');
  });

  describe('with reduced motion', () => {
    it('does not shift the element, nor ease it back', () => {
      stubMatchMedia({ matches: true });
      const element = document.createElement('div');
      renderHook(() => useParallax({ current: element }));

      fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });
      fireEvent.mouseLeave(document);

      expect(element.style.transform).toBe('');
      expect(element.style.transition).toBe('');
    });

    it('puts the element back once the visitor turns it on, then stops shifting it', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const element = document.createElement('div');
      renderHook(() => useParallax({ current: element }));
      fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });

      setMatches(true);
      expect(element.style.transform).toBe('');

      fireEvent.pointerMove(window, { clientX: 0, clientY: 800 });
      expect(element.style.transform).toBe('');
    });

    it('does not fail without an element when the visitor turns it on', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      renderHook(() => useParallax({ current: null }));

      expect(() => setMatches(true)).not.toThrow();
    });

    it('shifts the element again once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      const element = document.createElement('div');
      renderHook(() => useParallax({ current: element }));

      setMatches(false);
      fireEvent.pointerMove(window, { clientX: 1000, clientY: 0 });

      expect(element.style.transform).toBe('translate(-10px, 7px)');
    });
  });
});
