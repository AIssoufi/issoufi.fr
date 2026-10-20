import { type RefObject, useEffect } from 'react';

import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion/index.ts';
import { isFingerPointer } from '../../../../utils/pointer.ts';
import {
  PARALLAX_MAX_OFFSET_PX,
  PARALLAX_RESET_DURATION_MS,
  RELEASE_EASING,
} from '../../constants.ts';
import { getParallaxOffset } from '../../utils.ts';

/**
 * Shifts an element slightly away from a mouse or a pen, for a depth effect, and eases it back to
 * the center when the mouse leaves the window. A finger hovers nothing: a tap leaves the element
 * where it is. With reduced motion, it does nothing, and puts back an element it shifted before
 * the visitor turned it on. Listeners and the pending reset timer are removed on unmount.
 *
 * @param elementRef - Ref to the element to shift.
 */
export function useParallax(elementRef: RefObject<HTMLElement | null>): void {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      const element = elementRef.current;
      if (element) element.style.transform = '';
      return;
    }

    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const handleMove = (event: PointerEvent) => {
      if (isFingerPointer(event)) return;
      const element = elementRef.current;
      if (!element) return;

      const offset = getParallaxOffset({
        pointer: { x: event.clientX, y: event.clientY },
        viewport: { x: window.innerWidth, y: window.innerHeight },
        maxOffset: PARALLAX_MAX_OFFSET_PX,
      });
      element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    };

    const handleLeave = () => {
      const element = elementRef.current;
      if (!element) return;

      element.style.transition = `transform ${PARALLAX_RESET_DURATION_MS / 1000}s ${RELEASE_EASING}`;
      element.style.transform = '';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (elementRef.current) elementRef.current.style.transition = '';
      }, PARALLAX_RESET_DURATION_MS);
    };

    window.addEventListener('pointermove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      clearTimeout(resetTimer);
    };
  }, [elementRef, prefersReducedMotion]);
}
