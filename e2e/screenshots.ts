/**
 * Replaces `Math.random` with a generator seeded by a number, so a page draws the same values on
 * every load, such as the places of the dots of the particle field of the home page. It is the
 * linear congruential generator of Numerical Recipes: poor in its low bits, but enough to scatter
 * dots. Runs in the browser before the scripts of the page, passed to `page.addInitScript`, so it
 * uses nothing from outside its own body.
 *
 * @param seed - Seed of the generator: the same seed gives the same values, in the same order. Any
 * value that is not a finite number counts as 0, and a number is wrapped to an unsigned 32-bit
 * integer.
 *
 * @example
 * await page.addInitScript(seedRandom, VISUAL_RANDOM_SEED);
 */
export const seedRandom = (seed?: unknown): void => {
  // Defined here rather than at the top of the module, which the page does not receive
  const MULTIPLIER = 1_664_525;
  const INCREMENT = 1_013_904_223;
  const UINT32_RANGE = 2 ** 32;

  let state = typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : 0;
  Math.random = () => {
    state = (Math.imul(state, MULTIPLIER) + INCREMENT) >>> 0;
    return state / UINT32_RANGE;
  };
};

/**
 * Loads every image of the page, the lazy ones out of the screen included, and waits until each
 * one is decoded, so that a full-page screenshot shows them all, without scrolling the page. An
 * image whose file fails to load is left as the browser shows it. Runs in the browser, passed to
 * `page.evaluate`, so it uses nothing from outside its own body.
 *
 * @example
 * await page.evaluate(loadAllImages);
 */
export const loadAllImages = async (): Promise<void> => {
  const images = [...document.images];
  // An eager image starts to download at once, wherever it stands
  for (const image of images) image.setAttribute('loading', 'eager');
  await Promise.all(images.map(image => image.decode().catch(() => undefined)));
};
