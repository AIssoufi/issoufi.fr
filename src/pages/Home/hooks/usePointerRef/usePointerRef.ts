import { type MutableRefObject, useEffect, useRef } from 'react';

import { OFFSCREEN_POINTER } from '../../constants';
import type { Point } from '../../types';

/** Parameters of {@link usePointerRef}. */
interface UsePointerRefParams {
  /** Position before the first mouse move. Defaults to {@link OFFSCREEN_POINTER}. */
  initial?: Point;
  /**
   * Whether to park the pointer at {@link OFFSCREEN_POINTER} when the mouse leaves the window.
   * @default true
   */
  resetOnLeave?: boolean;
}

/**
 * Tracks the mouse position in a ref, for animation loops that read it on every frame without
 * re-rendering. Listens to `mousemove` on `window` and, with `resetOnLeave`, to `mouseleave` on
 * `document`. Both listeners are removed on unmount.
 *
 * @returns A ref whose `current` is the latest pointer position.
 */
export function usePointerRef({
  initial = OFFSCREEN_POINTER,
  resetOnLeave = true,
}: UsePointerRefParams = {}): MutableRefObject<Point> {
  const pointerRef = useRef<Point>(initial);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const handleLeave = () => {
      pointerRef.current = OFFSCREEN_POINTER;
    };

    window.addEventListener('mousemove', handleMove);
    if (resetOnLeave) document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [resetOnLeave]);

  return pointerRef;
}
