import { type RefObject, useEffect } from 'react';

import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion';
import {
  PARALLAX_MAX_OFFSET_PX,
  PARALLAX_RESET_DURATION_MS,
  RELEASE_EASING,
} from '../../constants';
import { getParallaxOffset } from '../../utils';

/**
 * Shifts an element slightly away from the mouse, for a depth effect, and eases it back to the
 * center when the mouse leaves the window. With reduced motion, it does nothing, and puts back an
 * element it shifted before the visitor turned it on. Listeners and the pending reset timer are
 * removed on unmount.
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

    const handleMove = (event: MouseEvent) => {
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

    window.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      clearTimeout(resetTimer);
    };
  }, [elementRef, prefersReducedMotion]);
}
