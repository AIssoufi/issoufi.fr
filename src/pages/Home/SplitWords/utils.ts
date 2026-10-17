import type { Point } from '../types';
import {
  GLOW_PER_DISPLACEMENT_PX,
  MAX_GLOW_PX,
  MIN_REPEL_DISTANCE_PX,
  MIN_VISIBLE_GLOW_PX,
  REPEL_FALLOFF_EXPONENT,
  REPEL_FORCE,
  REPEL_RADIUS_PX,
  RETURN_DELAY_MS,
  ROTATION_DAMPING,
  SPIN_FACTOR,
  SPRING_STIFFNESS,
  VELOCITY_DAMPING,
} from './constants';
import type { WordState } from './types';

/** Parameters of {@link stepWord}. */
interface StepWordParams {
  /** Current state of the word. It is not modified. */
  state: WordState;
  /** Center of the word on screen, in viewport pixels. */
  center: Point;
  /** Mouse position, or far offscreen when the mouse is outside the window. */
  pointer: Point;
  /** Current time from `performance.now()`, in milliseconds. */
  now: number;
  /** Random number generator between 0 and 1, injectable for tests. @default Math.random */
  random?: () => number;
}

/**
 * Advances a word by one frame: pushed and spun by a close mouse, pulled back to its resting
 * place by a spring once {@link RETURN_DELAY_MS} has passed since the last push, and damped.
 *
 * @returns The word's new state.
 */
export function stepWord({
  state,
  center,
  pointer,
  now,
  random = Math.random,
}: StepWordParams): WordState {
  let { vx, vy, vrot, lastRepulsedAt } = state;
  const dx = center.x - pointer.x;
  const dy = center.y - pointer.y;
  const distance = Math.hypot(dx, dy);
  const isInRepelZone = distance > MIN_REPEL_DISTANCE_PX && distance < REPEL_RADIUS_PX;

  if (isInRepelZone) {
    const strength = Math.pow(1 - distance / REPEL_RADIUS_PX, REPEL_FALLOFF_EXPONENT) * REPEL_FORCE;
    vx += (dx / distance) * strength;
    vy += (dy / distance) * strength;
    vrot += (random() - 0.5) * strength * SPIN_FACTOR;
    lastRepulsedAt = now;
  }

  const isSpringActive = now - lastRepulsedAt > RETURN_DELAY_MS;
  if (isSpringActive) {
    vx -= state.x * SPRING_STIFFNESS;
    vy -= state.y * SPRING_STIFFNESS;
    vrot -= state.rot * SPRING_STIFFNESS;
  }

  vx *= VELOCITY_DAMPING;
  vy *= VELOCITY_DAMPING;
  vrot *= ROTATION_DAMPING;

  return { x: state.x + vx, y: state.y + vy, rot: state.rot + vrot, vx, vy, vrot, lastRepulsedAt };
}

/**
 * Glow radius of a word moved away from its resting place, growing with the distance up to
 * {@link MAX_GLOW_PX}.
 */
export function getGlowRadius({ x, y }: Pick<WordState, 'x' | 'y'>): number {
  return Math.min(Math.hypot(x, y) * GLOW_PER_DISPLACEMENT_PX, MAX_GLOW_PX);
}

/**
 * Builds the CSS `text-shadow` of a glowing word: a soft pink halo, or none below
 * {@link MIN_VISIBLE_GLOW_PX}.
 *
 * @param glowRadius - Radius of the inner halo, in pixels, from {@link getGlowRadius}.
 */
export function getTextShadow(glowRadius: number): string {
  const isGlowVisible = glowRadius > MIN_VISIBLE_GLOW_PX;
  if (!isGlowVisible) return '';

  return `0 0 ${glowRadius}px rgba(212, 160, 192, 0.85), 0 0 ${glowRadius * 2}px rgba(139, 49, 104, 0.4)`;
}
