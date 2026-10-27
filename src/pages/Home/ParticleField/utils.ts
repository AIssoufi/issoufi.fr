import type { Point } from '../types.ts';
import {
  FRICTION,
  INITIAL_SPEED_RANGE_PX,
  MAX_PIXEL_RATIO,
  MIN_PARTICLE_RADIUS_PX,
  PARTICLE_AREA_PX2,
  PARTICLE_RADIUS_RANGE_PX,
  REPEL_DISTANCE_PX,
  REPEL_STRENGTH,
} from './constants.ts';
import type { Particle } from './types.ts';

/** Size of the drawing buffer of a canvas, and the scale from CSS pixels to its pixels. */
interface CanvasSize {
  /** Width of the buffer, in whole canvas pixels. */
  width: number;
  /** Height of the buffer, in whole canvas pixels. */
  height: number;
  /** Canvas pixels per CSS pixel, on each axis, to pass to `setTransform`. */
  scale: number;
}

/** Parameters of {@link getCanvasSize}. */
interface GetCanvasSizeParams {
  /** Width of the canvas on the screen, in CSS pixels. */
  cssWidth: number;
  /** Height of the canvas on the screen, in CSS pixels. */
  cssHeight: number;
  /** Device pixels per CSS pixel, as `window.devicePixelRatio` gives it. @default 1 */
  pixelRatio?: number;
}

/**
 * Sizes the drawing buffer of a canvas for the screen: its CSS size times the device pixel ratio,
 * capped at {@link MAX_PIXEL_RATIO}, so that the screen does not stretch it. A ratio that is not a
 * positive finite number counts as 1, and a CSS length that is not one gives an empty canvas.
 *
 * @returns The size of the buffer, in whole canvas pixels, and the scale from CSS pixels to them.
 *
 * @example
 * getCanvasSize({ cssWidth: 390, cssHeight: 664, pixelRatio: 3 });
 * // { width: 780, height: 1328, scale: 2 }
 */
export function getCanvasSize({
  cssWidth,
  cssHeight,
  pixelRatio = 1,
}: GetCanvasSizeParams): CanvasSize {
  const isValidRatio = Number.isFinite(pixelRatio) && pixelRatio > 0;
  const scale = isValidRatio ? Math.min(pixelRatio, MAX_PIXEL_RATIO) : 1;
  const toCanvasPixels = (cssLength: number) => {
    const isValidLength = Number.isFinite(cssLength) && cssLength > 0;
    return isValidLength ? Math.round(cssLength * scale) : 0;
  };

  return { width: toCanvasPixels(cssWidth), height: toCanvasPixels(cssHeight), scale };
}

/** Parameters of {@link createParticles}. */
interface CreateParticlesParams {
  /** Width of the canvas on the screen, in CSS pixels. */
  width: number;
  /** Height of the canvas on the screen, in CSS pixels. */
  height: number;
  /** Random number generator between 0 and 1, injectable for tests. @default Math.random */
  random?: () => number;
}

/**
 * Creates dots at random positions, speeds and sizes, one per {@link PARTICLE_AREA_PX2}.
 * Returns no dot for an empty or negative area.
 */
export function createParticles({
  width,
  height,
  random = Math.random,
}: CreateParticlesParams): Particle[] {
  const count = Math.max(0, Math.round((width * height) / PARTICLE_AREA_PX2));

  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    vx: (random() - 0.5) * INITIAL_SPEED_RANGE_PX,
    vy: (random() - 0.5) * INITIAL_SPEED_RANGE_PX,
    size: random() * PARTICLE_RADIUS_RANGE_PX + MIN_PARTICLE_RADIUS_PX,
  }));
}

/** Parameters of {@link wrapAround}. */
interface WrapAroundParams {
  /** Coordinate that may be outside the canvas. */
  value: number;
  /** Size of the canvas on that axis. */
  max: number;
}

/** Brings a coordinate back into `[0, max)`, so a dot leaving one edge comes in from the other. */
export function wrapAround({ value, max }: WrapAroundParams): number {
  if (max <= 0) return 0;
  return ((value % max) + max) % max;
}

/** Parameters of {@link stepParticle}. */
interface StepParticleParams {
  /** Dot to move. It is not modified. */
  particle: Particle;
  /** Mouse position, or far offscreen when the mouse is outside the window. */
  pointer: Point;
  /** Width of the canvas on the screen, in CSS pixels. */
  width: number;
  /** Height of the canvas on the screen, in CSS pixels. */
  height: number;
}

/**
 * Advances a dot by one frame: pushed away from the mouse when close, slowed by friction, then
 * moved and wrapped around the canvas edges.
 *
 * @returns The dot's new state.
 */
export function stepParticle({ particle, pointer, width, height }: StepParticleParams): Particle {
  let { vx, vy } = particle;
  const dx = particle.x - pointer.x;
  const dy = particle.y - pointer.y;
  const distanceSquared = dx * dx + dy * dy;
  const isInRepelZone = distanceSquared > 0 && distanceSquared < REPEL_DISTANCE_PX ** 2;

  if (isInRepelZone) {
    const distance = Math.sqrt(distanceSquared);
    const force = ((REPEL_DISTANCE_PX - distance) / REPEL_DISTANCE_PX) * REPEL_STRENGTH;
    vx += (dx / distance) * force;
    vy += (dy / distance) * force;
  }

  vx *= FRICTION;
  vy *= FRICTION;

  return {
    ...particle,
    vx,
    vy,
    x: wrapAround({ value: particle.x + vx, max: width }),
    y: wrapAround({ value: particle.y + vy, max: height }),
  };
}

/** Parameters of {@link getLinkStrength}. */
interface GetLinkStrengthParams {
  /** One end of the link. */
  from: Point;
  /** The other end of the link. */
  to: Point;
  /** Distance from which there is no link anymore. */
  maxDistance: number;
}

/**
 * Computes how strong the line between two points is: 1 when they touch, fading linearly to 0
 * at `maxDistance` and beyond. Used to scale the link's opacity and width.
 */
export function getLinkStrength({ from, to, maxDistance }: GetLinkStrengthParams): number {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const distanceSquared = dx * dx + dy * dy;
  const isTooFar = maxDistance <= 0 || distanceSquared >= maxDistance ** 2;
  if (isTooFar) return 0;

  return 1 - Math.sqrt(distanceSquared) / maxDistance;
}
