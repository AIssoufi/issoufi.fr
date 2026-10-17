import type { WordState } from './types';

/** State of a word at rest, before any interaction. */
export const RESTING_WORD: WordState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  rot: 0,
  vrot: 0,
  lastRepulsedAt: 0,
};

/** Distance under which the mouse pushes a word. */
export const REPEL_RADIUS_PX = 200;
/** Distance under which the push is skipped, to avoid dividing by a near-zero distance. */
export const MIN_REPEL_DISTANCE_PX = 1;
/** Push given to a word right under the mouse, in pixels per frame. */
export const REPEL_FORCE = 28;
/** How fast the push fades with distance: higher values keep it close to the mouse. */
export const REPEL_FALLOFF_EXPONENT = 1.8;
/** Share of the push turned into a random spin. */
export const SPIN_FACTOR = 0.25;

/** Delay after a push before the spring pulls the word back, so the motion reads as a bounce. */
export const RETURN_DELAY_MS = 900;
/** Share of the offset pulled back on each frame once the spring is active. */
export const SPRING_STIFFNESS = 0.055;
/** Share of the velocity kept from one frame to the next. */
export const VELOCITY_DAMPING = 0.75;
/** Share of the rotation speed kept from one frame to the next. */
export const ROTATION_DAMPING = 0.7;

/** Glow radius gained per pixel of displacement from the resting place. */
export const GLOW_PER_DISPLACEMENT_PX = 0.5;
/** Largest glow radius, reached by words pushed far away. */
export const MAX_GLOW_PX = 20;
/** Glow radius under which no glow is drawn. */
export const MIN_VISIBLE_GLOW_PX = 0.5;

/** Length of the shimmer animation cycle, in seconds; words start at staggered points of it. */
export const SHIMMER_CYCLE_S = 5;
/** Non-breaking space between words, so the title never wraps inside a word group. */
export const NON_BREAKING_SPACE = ' ';
