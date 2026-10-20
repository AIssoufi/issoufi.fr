import { loadAllImages, seedRandom } from './screenshots.ts';

/** `Math.random` of the test environment, put back after each test. */
const nativeRandom = Math.random;

/** Draws a number of values from `Math.random`. */
const drawRandomValues = (count: number) => Array.from({ length: count }, () => Math.random());

afterEach(() => {
  Math.random = nativeRandom;
});

describe('seedRandom', () => {
  it('draws the same values, in the same order, from the same seed', () => {
    seedRandom(1);
    const firstValues = drawRandomValues(5);
    seedRandom(1);

    expect(drawRandomValues(5)).toEqual(firstValues);
  });

  it('draws the values of the linear congruential generator of Numerical Recipes', () => {
    seedRandom(0);

    // 1013904223, then 1013904223 × 1664525 + 1013904223 modulo 2³², over 2³²
    expect(drawRandomValues(2)).toEqual([1_013_904_223 / 2 ** 32, 1_196_435_762 / 2 ** 32]);
  });

  it('draws other values from another seed', () => {
    seedRandom(1);
    const firstValues = drawRandomValues(5);
    seedRandom(2);

    expect(drawRandomValues(5)).not.toEqual(firstValues);
  });

  it('draws values from 0 up to 1, 1 excluded', () => {
    seedRandom(42);
    const values = drawRandomValues(1000);

    expect(values.every(value => value >= 0 && value < 1)).toBe(true);
  });

  it('wraps a seed to an unsigned 32-bit integer', () => {
    seedRandom(2 ** 32 + 7);
    const wrappedValues = drawRandomValues(3);
    seedRandom(7);

    expect(drawRandomValues(3)).toEqual(wrappedValues);
  });

  it.each([
    { seed: -1, wrappedSeed: 2 ** 32 - 1 },
    { seed: 7.9, wrappedSeed: 7 },
    { seed: -0, wrappedSeed: 0 },
  ])('wraps the seed $seed to $wrappedSeed', ({ seed, wrappedSeed }) => {
    seedRandom(seed);
    const values = drawRandomValues(3);
    seedRandom(wrappedSeed);

    expect(drawRandomValues(3)).toEqual(values);
  });

  it.each([undefined, null, Number.NaN, Infinity, '7', {}])('counts the seed %j as 0', seed => {
    seedRandom(seed);
    const values = drawRandomValues(3);
    seedRandom(0);

    expect(drawRandomValues(3)).toEqual(values);
  });
});

describe('loadAllImages', () => {
  // jsdom loads no image, and its images have no decode()
  const decode = vi.fn<() => Promise<void>>();

  beforeEach(() => {
    decode.mockResolvedValue(undefined);
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      value: decode,
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    decode.mockReset();
    document.body.replaceChildren();
  });

  /** Adds an image to the page, lazy unless told otherwise. */
  const addImage = (loading = 'lazy') => {
    const image = document.createElement('img');
    image.setAttribute('loading', loading);
    document.body.append(image);
    return image;
  };

  it('makes every image eager, so that the lazy ones download at once', async () => {
    const lazyImage = addImage();
    const eagerImage = addImage('eager');

    await loadAllImages();

    expect(lazyImage.getAttribute('loading')).toBe('eager');
    expect(eagerImage.getAttribute('loading')).toBe('eager');
  });

  it('waits until every image is decoded', async () => {
    addImage();
    addImage();
    let resolveDecode: () => void = () => {};
    decode.mockReturnValueOnce(Promise.resolve()).mockReturnValueOnce(
      new Promise<void>(resolve => {
        resolveDecode = resolve;
      }),
    );
    let isLoaded = false;

    const loading = loadAllImages().then(() => {
      isLoaded = true;
    });
    await Promise.resolve();
    expect(decode).toHaveBeenCalledTimes(2);
    expect(isLoaded).toBe(false);

    resolveDecode();
    await loading;
    expect(isLoaded).toBe(true);
  });

  it('still resolves when an image fails to load', async () => {
    addImage();
    decode.mockRejectedValue(new Error('broken image'));

    await expect(loadAllImages()).resolves.toBeUndefined();
  });

  it('resolves at once on a page without any image', async () => {
    await expect(loadAllImages()).resolves.toBeUndefined();
    expect(decode).not.toHaveBeenCalled();
  });
});
