import { type RefObject, useEffect } from 'react';

import { CURSOR_GLOW_EASING, CURSOR_GLOW_RADIUS_PX, CURSOR_GLOW_START } from '../../constants';
import { easeTowards } from '../../utils';
import { usePointerRef } from '../usePointerRef';

/**
 * Makes an element trail the mouse: on every animation frame it moves a fraction of the way to
 * the pointer (see {@link CURSOR_GLOW_EASING}), centered on it. The element keeps its last
 * position when the mouse leaves the window. The animation frame is cancelled on unmount.
 *
 * @param elementRef - Ref to the element to move, positioned at the top-left of the viewport.
 */
export function useCursorFollower(elementRef: RefObject<HTMLElement | null>): void {
  const pointerRef = usePointerRef({ initial: CURSOR_GLOW_START, resetOnLeave: false });

  useEffect(() => {
    let position = CURSOR_GLOW_START;
    let frame = 0;

    const animate = () => {
      position = easeTowards({
        from: position,
        to: pointerRef.current,
        factor: CURSOR_GLOW_EASING,
      });
      const element = elementRef.current;
      if (element) {
        const x = position.x - CURSOR_GLOW_RADIUS_PX;
        const y = position.y - CURSOR_GLOW_RADIUS_PX;
        element.style.transform = `translate(${x}px, ${y}px)`;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [elementRef, pointerRef]);
}
