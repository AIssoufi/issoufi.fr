import { createSeededRandom } from './random.mjs';

/** Draws the first numbers of a generator. */
const draw = ({ random, count = 5 }) => Array.from({ length: count }, () => random());

describe('createSeededRandom', () => {
  it('draws the same numbers for the same seed', () => {
    expect(draw({ random: createSeededRandom(2026) })).toEqual(
      draw({ random: createSeededRandom(2026) }),
    );
  });

  it('draws other numbers for another seed', () => {
    expect(draw({ random: createSeededRandom(2026) })).not.toEqual(
      draw({ random: createSeededRandom(2027) }),
    );
  });

  it('draws a new number on each call', () => {
    const numbers = draw({ random: createSeededRandom(1), count: 100 });

    expect(new Set(numbers).size).toBe(100);
  });

  it('draws numbers from 0 included to 1 excluded', () => {
    const numbers = draw({ random: createSeededRandom(42), count: 10_000 });

    expect(numbers.every(number => number >= 0 && number < 1)).toBe(true);
  });

  it.each([-1, 0, Number.MAX_SAFE_INTEGER, 2 ** 32])('accepts the seed %s', seed => {
    expect(draw({ random: createSeededRandom(seed) }).every(Number.isFinite)).toBe(true);
  });

  it('drops the fractional part of the seed', () => {
    expect(draw({ random: createSeededRandom(2026.7) })).toEqual(
      draw({ random: createSeededRandom(2026) }),
    );
  });

  it.each([NaN, Infinity, -Infinity, undefined, null, '2026', {}])(
    'uses the seed 0 for the invalid seed %s',
    seed => {
      expect(draw({ random: createSeededRandom(seed) })).toEqual(
        draw({ random: createSeededRandom(0) }),
      );
    },
  );
});
