import { type RefObject, useEffect, useRef } from 'react';

import { isFingerPointer } from '../../../../../utils/pointer';
import { isOnControl } from '../../utils';

/**
 * Tracks in a ref whether a mouse or a pen is over a link or a button (see `isOnControl`), for
 * the animation loop of `SplitWords`, which reads it on every frame without re-rendering. Listens
 * to `pointermove` on `window`, whose target is the element under the pointer, leaving out a
 * finger, which hovers nothing, and to `mouseleave` on `document`, which sets it back to `false`.
 * Both listeners are removed on unmount.
 *
 * @returns A ref whose `current` is `true` while the pointer is over a control, `false` before
 * the first move.
 */
export function usePointerOnControlRef(): RefObject<boolean> {
  const isOnControlRef = useRef(false);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (isFingerPointer(event)) return;
      isOnControlRef.current = isOnControl(event.target);
    };
    const handleLeave = () => {
      isOnControlRef.current = false;
    };

    window.addEventListener('pointermove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return isOnControlRef;
}
