import { type MutableRefObject, useEffect, useRef } from 'react';

import { isOnControl } from '../../utils';

/**
 * Tracks in a ref whether the mouse is over a link or a button (see `isOnControl`), for the
 * animation loop of `SplitWords`, which reads it on every frame without re-rendering. Listens to
 * `mousemove` on `window`, whose target is the element under the mouse, and to `mouseleave` on
 * `document`, which sets it back to `false`. Both listeners are removed on unmount.
 *
 * @returns A ref whose `current` is `true` while the mouse is over a control, `false` before the
 * first move.
 */
export function usePointerOnControlRef(): MutableRefObject<boolean> {
  const isOnControlRef = useRef(false);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      isOnControlRef.current = isOnControl(event.target);
    };
    const handleLeave = () => {
      isOnControlRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return isOnControlRef;
}
