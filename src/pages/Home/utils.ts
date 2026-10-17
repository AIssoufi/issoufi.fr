import { OFFSCREEN_POINTER } from './constants';
import type { Point } from './types';

/** Parameters of {@link easeTowards}. */
interface EaseTowardsParams {
  /** Current position. */
  from: Point;
  /** Position to move toward. */
  to: Point;
  /** Fraction of the remaining distance covered by this step, between 0 and 1. */
  factor: number;
}

/**
 * Moves a point a fraction of the way toward a target, for smooth following animations.
 *
 * @example
 * easeTowards({ from: { x: 0, y: 0 }, to: { x: 100, y: 50 }, factor: 0.1 }); // { x: 10, y: 5 }
 */
export function easeTowards({ from, to, factor }: EaseTowardsParams): Point {
  return { x: from.x + (to.x - from.x) * factor, y: from.y + (to.y - from.y) * factor };
}

/** Parameters of {@link getParallaxOffset}. */
interface GetParallaxOffsetParams {
  /** Pointer position in the viewport. */
  pointer: Point;
  /** Viewport size, as `{ x: width, y: height }`. */
  viewport: Point;
  /** Largest shift, reached when the pointer is at an edge. */
  maxOffset: Point;
}

/**
 * Computes how far to shift content away from the pointer: nothing at the viewport center, up to
 * `maxOffset` in the opposite direction at the edges. Returns no shift for an empty viewport.
 */
export function getParallaxOffset({
  pointer,
  viewport,
  maxOffset,
}: GetParallaxOffsetParams): Point {
  const center = { x: viewport.x / 2, y: viewport.y / 2 };
  const hasArea = center.x > 0 && center.y > 0;
  if (!hasArea) return { x: 0, y: 0 };

  const ratio = { x: (pointer.x - center.x) / center.x, y: (pointer.y - center.y) / center.y };
  return { x: ratio.x * -maxOffset.x, y: ratio.y * -maxOffset.y };
}

/** Parameters of {@link getMagneticOffset}. */
interface GetMagneticOffsetParams {
  /** Pointer position in the viewport. */
  pointer: Point;
  /** Bounding box of the element, as returned by `getBoundingClientRect()`. */
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
  /** Fraction of the pointer's distance from the element's center that the element follows. */
  strength: number;
}

/** Computes how far an element should move toward the pointer, from the element's center. */
export function getMagneticOffset({ pointer, rect, strength }: GetMagneticOffsetParams): Point {
  const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  return { x: (pointer.x - center.x) * strength, y: (pointer.y - center.y) * strength };
}

/**
 * Whether the pointer is inside the window, that is not parked at {@link OFFSCREEN_POINTER}.
 *
 * @param pointer - Latest pointer position, e.g. from `usePointerRef`.
 */
export function isPointerOnScreen(pointer: Point): boolean {
  const isParkedOffscreen = pointer.x === OFFSCREEN_POINTER.x && pointer.y === OFFSCREEN_POINTER.y;
  return !isParkedOffscreen;
}
