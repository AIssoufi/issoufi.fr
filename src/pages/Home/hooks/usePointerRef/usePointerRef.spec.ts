import { fireEvent, renderHook } from '@testing-library/react';

import { OFFSCREEN_POINTER } from '../../constants';
import { usePointerRef } from './usePointerRef';

describe('usePointerRef', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts offscreen by default', () => {
    const { result } = renderHook(() => usePointerRef());
    expect(result.current.current).toEqual(OFFSCREEN_POINTER);
  });

  it('starts at the given initial position', () => {
    const { result } = renderHook(() => usePointerRef({ initial: { x: -100, y: -100 } }));
    expect(result.current.current).toEqual({ x: -100, y: -100 });
  });

  it('follows the mouse and parks offscreen when it leaves the window', () => {
    const { result } = renderHook(() => usePointerRef());

    fireEvent.mouseMove(window, { clientX: 120, clientY: 80 });
    expect(result.current.current).toEqual({ x: 120, y: 80 });

    fireEvent.mouseLeave(document);
    expect(result.current.current).toEqual(OFFSCREEN_POINTER);
  });

  it('keeps the last position on leave when resetOnLeave is false', () => {
    const { result } = renderHook(() => usePointerRef({ resetOnLeave: false }));

    fireEvent.mouseMove(window, { clientX: 120, clientY: 80 });
    fireEvent.mouseLeave(document);

    expect(result.current.current).toEqual({ x: 120, y: 80 });
  });

  it('stops listening on unmount', () => {
    const removeFromWindow = vi.spyOn(window, 'removeEventListener');
    const removeFromDocument = vi.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() => usePointerRef());

    unmount();
    fireEvent.mouseMove(window, { clientX: 5, clientY: 5 });

    expect(removeFromWindow).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeFromDocument).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(result.current.current).toEqual(OFFSCREEN_POINTER);
  });
});
