import { type PointerEvent, useCallback } from 'react';

import { usePrefersReducedMotion } from '../../../../../hooks/usePrefersReducedMotion/index.ts';
import { isFingerPointer } from '../../../../../utils/pointer.ts';
import { CARD_HOVER_LIFT_PX, CARD_MAX_TILT_DEG, CARD_PERSPECTIVE_PX } from '../../constants.ts';
import { getCardTilt } from '../../utils/tilt.ts';

/** Pointer handlers returned by {@link useCardTilt}, to spread on the card. */
interface CardTiltHandlers {
  /**
   * Tilts the card toward a mouse or a pen and moves its light under it; with reduced motion,
   * only moves its light. Ignores a finger.
   */
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  /** Flattens the card. */
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * Makes a project card tilt toward the pointer, up to {@link CARD_MAX_TILT_DEG} at its edges, and
 * rise a little while hovered, then flatten when the pointer leaves. It also writes the position
 * of the pointer in the card to its `--mouse-x` and `--mouse-y` properties, for the light of its
 * image. With reduced motion, the card neither tilts nor rises, and only its light follows the
 * pointer. A finger hovers nothing: the card stays as it is under it, rather than tilting toward
 * a tap, as on its like button, and staying so until the next tap elsewhere, as it did when it
 * followed the mouse events that a browser sends after a tap.
 *
 * @returns `onPointerMove` and `onPointerLeave` handlers to spread on the card, stable as long as
 * the preference stays the same.
 *
 * @example
 * const cardTilt = useCardTilt();
 * return <ProjectItem {...cardTilt}>…</ProjectItem>;
 */
export function useCardTilt(): CardTiltHandlers {
  const prefersReducedMotion = usePrefersReducedMotion();

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (isFingerPointer(event)) return;

      const card = event.currentTarget;
      const { rotateX, rotateY, x, y } = getCardTilt({
        pointer: { x: event.clientX, y: event.clientY },
        rect: card.getBoundingClientRect(),
        maxTilt: CARD_MAX_TILT_DEG,
      });
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      if (prefersReducedMotion) return;

      card.style.transform = `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${CARD_HOVER_LIFT_PX}px)`;
    },
    [prefersReducedMotion],
  );

  const onPointerLeave = useCallback((event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.transform = '';
  }, []);

  return { onPointerMove, onPointerLeave };
}
