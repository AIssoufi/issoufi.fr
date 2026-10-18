import { fireEvent, renderHook } from '@testing-library/react';

import { useEscapeKey } from './useEscapeKey';

/** Presses a key on the focused element, or on the body without one, as a user would. */
const pressKey = (key: string) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key });

describe('useEscapeKey', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey({ onEscape }));

    pressKey('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls onEscape each time Escape is pressed', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey({ onEscape }));

    pressKey('Escape');
    pressKey('Escape');

    expect(onEscape).toHaveBeenCalledTimes(2);
  });

  it('calls onEscape wherever the focus is in the page', () => {
    const onEscape = vi.fn();
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    renderHook(() => useEscapeKey({ onEscape }));

    pressKey('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', 'Tab', ' ', 'Esc', 'escape', ''])('ignores the key %j', key => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey({ onEscape }));

    pressKey(key);

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('ignores Escape while inactive', () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey({ isActive: false, onEscape }));

    pressKey('Escape');

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('listens once active, and stops once inactive', () => {
    const onEscape = vi.fn();
    const { rerender } = renderHook(props => useEscapeKey(props), {
      initialProps: { isActive: false, onEscape },
    });

    rerender({ isActive: true, onEscape });
    pressKey('Escape');
    expect(onEscape).toHaveBeenCalledTimes(1);

    rerender({ isActive: false, onEscape });
    pressKey('Escape');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onEscape', () => {
    const firstOnEscape = vi.fn();
    const latestOnEscape = vi.fn();
    const { rerender } = renderHook(props => useEscapeKey(props), {
      initialProps: { onEscape: firstOnEscape },
    });

    rerender({ onEscape: latestOnEscape });
    pressKey('Escape');

    expect(firstOnEscape).not.toHaveBeenCalled();
    expect(latestOnEscape).toHaveBeenCalledTimes(1);
  });

  it('does not crash without onEscape', () => {
    renderHook(() => useEscapeKey({}));

    expect(() => pressKey('Escape')).not.toThrow();
  });

  it('stops listening on unmount', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey({ onEscape }));

    unmount();
    pressKey('Escape');

    expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), {
      capture: false,
    });
    expect(onEscape).not.toHaveBeenCalled();
  });

  describe('top layer', () => {
    it('keeps the Escape it handles from reaching the layers under it', () => {
      const onTopEscape = vi.fn();
      const onUnderEscape = vi.fn();
      // The layer under it listens first, as the open menu does before its tooltip shows
      renderHook(() => useEscapeKey({ onEscape: onUnderEscape }));
      renderHook(() => useEscapeKey({ onEscape: onTopEscape, isTopLayer: true }));

      pressKey('Escape');

      expect(onTopEscape).toHaveBeenCalledTimes(1);
      expect(onUnderEscape).not.toHaveBeenCalled();
    });

    it('lets Escape reach the layers under it while inactive', () => {
      const onUnderEscape = vi.fn();
      renderHook(() => useEscapeKey({ onEscape: onUnderEscape }));
      renderHook(() => useEscapeKey({ isActive: false, isTopLayer: true }));

      pressKey('Escape');

      expect(onUnderEscape).toHaveBeenCalledTimes(1);
    });

    it('lets the other keys reach the page', () => {
      const onKeyDown = vi.fn();
      document.addEventListener('keydown', onKeyDown);
      renderHook(() => useEscapeKey({ isTopLayer: true }));

      pressKey('Enter');

      document.removeEventListener('keydown', onKeyDown);
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('lets Escape reach the other listeners without isTopLayer', () => {
      const onOtherEscape = vi.fn();
      document.addEventListener('keydown', onOtherEscape);
      renderHook(() => useEscapeKey({ isTopLayer: undefined }));

      pressKey('Escape');

      document.removeEventListener('keydown', onOtherEscape);
      expect(onOtherEscape).toHaveBeenCalledTimes(1);
    });

    it('listens in the capture phase, until unmount', () => {
      const addEventListener = vi.spyOn(document, 'addEventListener');
      const removeEventListener = vi.spyOn(document, 'removeEventListener');
      const onEscape = vi.fn();
      const { unmount } = renderHook(() => useEscapeKey({ onEscape, isTopLayer: true }));
      expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), {
        capture: true,
      });

      unmount();
      pressKey('Escape');

      expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), {
        capture: true,
      });
      expect(onEscape).not.toHaveBeenCalled();
    });
  });
});
