/** Physics state of one word of `SplitWords`, relative to its resting place. */
export interface WordState {
  /** Horizontal offset, in pixels. */
  x: number;
  /** Vertical offset, in pixels. */
  y: number;
  /** Horizontal velocity, in pixels per frame. */
  vx: number;
  /** Vertical velocity, in pixels per frame. */
  vy: number;
  /** Rotation, in degrees. */
  rot: number;
  /** Rotation speed, in degrees per frame. */
  vrot: number;
  /** `performance.now()` time of the last mouse push, in milliseconds. */
  lastRepulsedAt: number;
}
