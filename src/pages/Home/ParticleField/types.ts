/** State of one dot of the particle field. */
export interface Particle {
  /** Horizontal position, in canvas pixels. */
  x: number;
  /** Vertical position, in canvas pixels. */
  y: number;
  /** Horizontal velocity, in pixels per frame. */
  vx: number;
  /** Vertical velocity, in pixels per frame. */
  vy: number;
  /** Radius of the dot, in pixels. */
  size: number;
}
