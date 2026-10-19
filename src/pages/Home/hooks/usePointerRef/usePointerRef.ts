import { type MutableRefObject, useEffect, useRef } from 'react';

import { isFingerPointer } from '../../../../utils/pointer.ts';
import { OFFSCREEN_POINTER } from '../../constants.ts';
import type { Point } from '../../types.ts';

/** Parameters of {@link usePointerRef}. */
interface UsePointerRefParams {
  /** Position before the first move of the pointer. Defaults to {@link OFFSCREEN_POINTER}. */
  initial?: Point;
  /**
   * Whether to park the pointer at {@link OFFSCREEN_POINTER} when the mouse leaves the window.
   * @default true
   */
  resetOnLeave?: boolean;
}

/**
 * Tracks the position of a mouse or a pen in a ref, for animation loops that read it on every
 * frame without re-rendering. Listens to `pointermove` on `window`, leaving out a finger, which
 * hovers nothing, and, with `resetOnLeave`, to `mouseleave` on `document`. Both listeners are
 * removed on unmount.
 *
 * @returns A ref whose `current` is the latest pointer position, which a tap does not move.
 */
export function usePointerRef({
  initial = OFFSCREEN_POINTER,
  resetOnLeave = true,
}: UsePointerRefParams = {}): MutableRefObject<Point> {
  const pointerRef = useRef<Point>(initial);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (isFingerPointer(event)) return;
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const handleLeave = () => {
      pointerRef.current = OFFSCREEN_POINTER;
    };

    window.addEventListener('pointermove', handleMove);
    if (resetOnLeave) document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [resetOnLeave]);

  return pointerRef;
}
