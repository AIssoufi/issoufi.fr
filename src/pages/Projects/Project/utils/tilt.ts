/** Tilt of a card toward the pointer, computed by {@link getCardTilt}. */
export interface CardTilt {
  /** Rotation around the horizontal axis, in degrees. */
  rotateX: number;
  /** Rotation around the vertical axis, in degrees. */
  rotateY: number;
  /** Pointer position inside the card, from its left edge, in pixels. */
  x: number;
  /** Pointer position inside the card, from its top edge, in pixels. */
  y: number;
}

/** Parameters of {@link getCardTilt}. */
interface GetCardTiltParams {
  /** Pointer position in the viewport (`clientX`, `clientY`). */
  pointer: { x: number; y: number };
  /** Bounding box of the card. */
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
  /** Tilt at the card's edges, in degrees. */
  maxTilt: number;
}

/**
 * Computes how much a card tilts so that the side under the pointer goes down: no tilt at the
 * center, `maxTilt` at the edges. Returns no tilt for an empty card.
 */
export function getCardTilt({ pointer, rect, maxTilt }: GetCardTiltParams): CardTilt {
  const x = pointer.x - rect.left;
  const y = pointer.y - rect.top;
  const center = { x: rect.width / 2, y: rect.height / 2 };
  const hasArea = center.x > 0 && center.y > 0;
  if (!hasArea) return { rotateX: 0, rotateY: 0, x, y };

  return {
    rotateX: ((y - center.y) / center.y) * -maxTilt,
    rotateY: ((x - center.x) / center.x) * maxTilt,
    x,
    y,
  };
}
