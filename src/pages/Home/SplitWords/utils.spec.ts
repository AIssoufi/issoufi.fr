import { OFFSCREEN_POINTER } from '../constants';
import { MAX_GLOW_PX, RESTING_WORD, RETURN_DELAY_MS } from './constants';
import { getGlowRadius, getTextShadow, stepWord } from './utils';

const center = { x: 500, y: 300 };

describe('stepWord', () => {
  it('leaves a resting word in place when the mouse is far away', () => {
    expect(
      stepWord({ state: RESTING_WORD, center, pointer: OFFSCREEN_POINTER, now: 5000 }),
    ).toEqual(RESTING_WORD);
  });

  it('pushes the word away from a close mouse and records the time', () => {
    const next = stepWord({
      state: RESTING_WORD,
      center,
      pointer: { x: 450, y: 300 },
      now: 1000,
      random: () => 0.5,
    });

    expect(next.x).toBeGreaterThan(0);
    expect(next.y).toBeCloseTo(0);
    expect(next.rot).toBe(0);
    expect(next.lastRepulsedAt).toBe(1000);
  });

  it('does not pull a recently pushed word back yet', () => {
    const pushed = { ...RESTING_WORD, x: 40, lastRepulsedAt: 1000 };
    const next = stepWord({
      state: pushed,
      center,
      pointer: OFFSCREEN_POINTER,
      now: 1000 + RETURN_DELAY_MS,
    });

    expect(next.x).toBe(40);
  });

  it('pulls the word back toward its place once the delay has passed', () => {
    const pushed = { ...RESTING_WORD, x: 40, lastRepulsedAt: 1000 };
    const next = stepWord({
      state: pushed,
      center,
      pointer: OFFSCREEN_POINTER,
      now: 1001 + RETURN_DELAY_MS,
    });

    expect(next.x).toBeLessThan(40);
    expect(next.x).toBeGreaterThan(0);
  });

  it('does not push a word whose center is exactly under the mouse instead of returning NaN', () => {
    const next = stepWord({ state: RESTING_WORD, center, pointer: center, now: 5000 });
    expect(next).toEqual(RESTING_WORD);
  });

  it('does not modify the given state', () => {
    const state = { ...RESTING_WORD };
    stepWord({ state, center, pointer: { x: 450, y: 300 }, now: 1000 });
    expect(state).toEqual(RESTING_WORD);
  });
});

describe('getGlowRadius', () => {
  it.each([
    [{ x: 0, y: 0 }, 0],
    [{ x: 6, y: 8 }, 5],
    [{ x: 300, y: 400 }, MAX_GLOW_PX],
  ])('is %j → %i', (offset, expected) => {
    expect(getGlowRadius(offset)).toBe(expected);
  });
});

describe('getTextShadow', () => {
  it('draws a two-layer halo for a visible glow', () => {
    expect(getTextShadow(10)).toBe(
      '0 0 10px rgba(212, 160, 192, 0.85), 0 0 20px rgba(139, 49, 104, 0.4)',
    );
  });

  it.each([0, 0.5, -3])('draws nothing for a glow of %i', glow => {
    expect(getTextShadow(glow)).toBe('');
  });
});
