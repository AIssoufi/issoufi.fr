import { type MouseEvent, useCallback } from 'react';

import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion';
import {
  MAGNET_FOLLOW_TRANSITION,
  MAGNET_RELEASE_TRANSITION,
  MAGNET_STRENGTH,
} from '../../constants';
import { getMagneticOffset } from '../../utils';

/** Mouse handlers returned by {@link useMagneticHover}, to spread on the element. */
interface MagneticHoverHandlers {
  /** Moves the element toward the pointer. */
  onMouseMove: (event: MouseEvent<HTMLElement>) => void;
  /** Eases the element back to its place. */
  onMouseLeave: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Makes an element look magnetic: it follows the pointer a little while hovered (see
 * {@link MAGNET_STRENGTH}) and eases back to its place when the pointer leaves. With reduced
 * motion, it stays in its place.
 *
 * @returns `onMouseMove` and `onMouseLeave` handlers to spread on the element, stable as long as
 * the preference stays the same.
 *
 * @example
 * const magneticHover = useMagneticHover();
 * return <div {...magneticHover}><Button /></div>;
 */
export function useMagneticHover(): MagneticHoverHandlers {
  const prefersReducedMotion = usePrefersReducedMotion();

  const onMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (prefersReducedMotion) return;

      const element = event.currentTarget;
      const offset = getMagneticOffset({
        pointer: { x: event.clientX, y: event.clientY },
        rect: element.getBoundingClientRect(),
        strength: MAGNET_STRENGTH,
      });
      element.style.transition = MAGNET_FOLLOW_TRANSITION;
      element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    },
    [prefersReducedMotion],
  );

  const onMouseLeave = useCallback((event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transition = MAGNET_RELEASE_TRANSITION;
    event.currentTarget.style.transform = '';
  }, []);

  return { onMouseMove, onMouseLeave };
}
