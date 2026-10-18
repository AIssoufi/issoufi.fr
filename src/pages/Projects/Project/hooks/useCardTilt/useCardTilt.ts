import { type MouseEvent, useCallback } from 'react';

import { usePrefersReducedMotion } from '../../../../../hooks/usePrefersReducedMotion';
import { CARD_HOVER_LIFT_PX, CARD_MAX_TILT_DEG, CARD_PERSPECTIVE_PX } from '../../constants';
import { getCardTilt } from '../../utils';

/** Mouse handlers returned by {@link useCardTilt}, to spread on the card. */
interface CardTiltHandlers {
  /**
   * Tilts the card toward the pointer and moves its light under it; with reduced motion, only
   * moves its light.
   */
  onMouseMove: (event: MouseEvent<HTMLElement>) => void;
  /** Flattens the card. */
  onMouseLeave: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Makes a project card tilt toward the pointer, up to {@link CARD_MAX_TILT_DEG} at its edges, and
 * rise a little while hovered, then flatten when the pointer leaves. It also writes the position
 * of the pointer in the card to its `--mouse-x` and `--mouse-y` properties, for the light of its
 * image. With reduced motion, the card neither tilts nor rises, and only its light follows the
 * pointer.
 *
 * @returns `onMouseMove` and `onMouseLeave` handlers to spread on the card, stable as long as the
 * preference stays the same.
 *
 * @example
 * const cardTilt = useCardTilt();
 * return <ProjectItem {...cardTilt}>…</ProjectItem>;
 */
export function useCardTilt(): CardTiltHandlers {
  const prefersReducedMotion = usePrefersReducedMotion();

  const onMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
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

  const onMouseLeave = useCallback((event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transform = '';
  }, []);

  return { onMouseMove, onMouseLeave };
}
