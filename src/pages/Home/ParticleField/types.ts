/** State of one dot of the particle field. */
export interface Particle {
  /** Horizontal position, in CSS pixels. */
  x: number;
  /** Vertical position, in CSS pixels. */
  y: number;
  /** Horizontal velocity, in CSS pixels per frame. */
  vx: number;
  /** Vertical velocity, in CSS pixels per frame. */
  vy: number;
  /** Radius of the dot, in CSS pixels. */
  size: number;
}
