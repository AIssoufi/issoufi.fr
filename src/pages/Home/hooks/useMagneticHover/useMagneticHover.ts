import { type PointerEvent, useCallback } from 'react';

import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion/index.ts';
import { isFingerPointer } from '../../../../utils/pointer.ts';
import {
  MAGNET_FOLLOW_TRANSITION,
  MAGNET_RELEASE_TRANSITION,
  MAGNET_STRENGTH,
} from '../../constants.ts';
import { getMagneticOffset } from '../../utils.ts';

/** Pointer handlers returned by {@link useMagneticHover}, to spread on the element. */
interface MagneticHoverHandlers {
  /** Moves the element toward a mouse or a pen. Ignores a finger. */
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  /** Eases the element back to its place. */
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * Makes an element look magnetic: it follows the pointer a little while hovered (see
 * {@link MAGNET_STRENGTH}) and eases back to its place when the pointer leaves. A finger hovers
 * nothing: the element stays in its place under it, rather than moving toward a tap. With reduced
 * motion, it stays in its place.
 *
 * @returns `onPointerMove` and `onPointerLeave` handlers to spread on the element, stable as long
 * as the preference stays the same.
 *
 * @example
 * const magneticHover = useMagneticHover();
 * return <div {...magneticHover}><Button /></div>;
 */
export function useMagneticHover(): MagneticHoverHandlers {
  const prefersReducedMotion = usePrefersReducedMotion();

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const isStill = prefersReducedMotion || isFingerPointer(event);
      if (isStill) return;

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

  const onPointerLeave = useCallback((event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.transition = MAGNET_RELEASE_TRANSITION;
    event.currentTarget.style.transform = '';
  }, []);

  return { onPointerMove, onPointerLeave };
}
