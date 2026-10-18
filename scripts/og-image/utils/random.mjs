// @ts-check

/** Step added to the state of the generator on each draw, from the Mulberry32 algorithm. */
const MULBERRY32_INCREMENT = 0x6d2b79f5;

/** Number of values of an unsigned 32-bit integer, to turn one into a number in `[0, 1)`. */
const UINT32_RANGE = 2 ** 32;

/**
 * Creates a random number generator that always draws the same numbers for the same seed, so the
 * particles of the image stay in place from one generation to the next. It uses Mulberry32, a
 * small and fast generator, good enough for decoration.
 * @param {unknown} seed - Integer seed. A value that is not a finite number counts as 0, and the
 * fractional part is dropped.
 * @returns {() => number} Function returning a new number in `[0, 1)` on each call, like
 * `Math.random`.
 * @example
 * const random = createSeededRandom(2026);
 * random(); // the same number on every run
 */
export const createSeededRandom = seed => {
  const isUsableSeed = typeof seed === 'number' && Number.isFinite(seed);
  let state = isUsableSeed ? Math.trunc(seed) >>> 0 : 0;

  return () => {
    state = (state + MULBERRY32_INCREMENT) >>> 0;
    // Bit mixing of the published algorithm
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  };
};
