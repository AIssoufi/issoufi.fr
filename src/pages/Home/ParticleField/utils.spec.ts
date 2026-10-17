import { OFFSCREEN_POINTER } from '../constants';
import { FRICTION, MIN_PARTICLE_RADIUS_PX, PARTICLE_AREA_PX2 } from './constants';
import { createParticles, getLinkStrength, stepParticle, wrapAround } from './utils';

const still = { x: 100, y: 100, vx: 0, vy: 0, size: 1 };

describe('createParticles', () => {
  it('creates one particle per area unit, inside the canvas', () => {
    const particles = createParticles({ width: 1100, height: 100 });

    expect(particles).toHaveLength(Math.round((1100 * 100) / PARTICLE_AREA_PX2));
    particles.forEach(({ x, y, size }) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1100);
      expect(y).toBeLessThan(100);
      expect(size).toBeGreaterThanOrEqual(MIN_PARTICLE_RADIUS_PX);
    });
  });

  it('uses the injected random generator', () => {
    const [particle] = createParticles({ width: 110, height: 100, random: () => 0.5 });
    expect(particle).toEqual({ x: 55, y: 50, vx: 0, vy: 0, size: 1.1 });
  });

  it.each([
    [0, 1000],
    [1000, 0],
    [-500, 500],
  ])('creates no particle for a %i x %i canvas', (width, height) => {
    expect(createParticles({ width, height })).toEqual([]);
  });
});

describe('wrapAround', () => {
  it.each([
    [50, 100, 50],
    [105, 100, 5],
    [-5, 100, 95],
    [100, 100, 0],
  ])('wraps %i into [0, %i) as %i', (value, max, expected) => {
    expect(wrapAround({ value, max })).toBe(expected);
  });

  it('returns 0 instead of NaN for an empty axis', () => {
    expect(wrapAround({ value: 12, max: 0 })).toBe(0);
  });
});

describe('stepParticle', () => {
  it('only applies friction when the mouse is far away', () => {
    const particle = { ...still, vx: 1, vy: -1 };
    const next = stepParticle({ particle, pointer: OFFSCREEN_POINTER, width: 500, height: 500 });

    expect(next.vx).toBeCloseTo(FRICTION);
    expect(next.vy).toBeCloseTo(-FRICTION);
    expect(next.x).toBeCloseTo(100 + FRICTION);
  });

  it('pushes the particle away from a close mouse', () => {
    const next = stepParticle({
      particle: still,
      pointer: { x: 50, y: 100 },
      width: 500,
      height: 500,
    });

    expect(next.vx).toBeGreaterThan(0);
    expect(next.vy).toBeCloseTo(0);
  });

  it('does not push a particle exactly under the mouse instead of returning NaN', () => {
    const next = stepParticle({
      particle: still,
      pointer: { x: 100, y: 100 },
      width: 500,
      height: 500,
    });
    expect(next).toEqual(still);
  });

  it('wraps around the edges', () => {
    const particle = { ...still, x: 499.9, vx: 1 };
    const next = stepParticle({ particle, pointer: OFFSCREEN_POINTER, width: 500, height: 500 });
    expect(next.x).toBeLessThan(1);
  });

  it('does not modify the given particle', () => {
    const particle = { ...still, vx: 1 };
    stepParticle({ particle, pointer: { x: 90, y: 100 }, width: 500, height: 500 });
    expect(particle).toEqual({ ...still, vx: 1 });
  });
});

describe('getLinkStrength', () => {
  it('is 1 for touching points and 0.5 at half the distance', () => {
    expect(getLinkStrength({ from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, maxDistance: 100 })).toBe(1);
    expect(getLinkStrength({ from: { x: 0, y: 0 }, to: { x: 30, y: 40 }, maxDistance: 100 })).toBe(
      0.5,
    );
  });

  it.each([
    [{ x: 100, y: 0 }, 100],
    [{ x: 300, y: 400 }, 100],
    [{ x: 1, y: 1 }, 0],
  ])('is 0 for %j with a max distance of %i', (to, maxDistance) => {
    expect(getLinkStrength({ from: { x: 0, y: 0 }, to, maxDistance })).toBe(0);
  });
});
