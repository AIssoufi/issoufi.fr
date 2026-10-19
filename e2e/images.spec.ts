import { getImageEnlargement } from './images';

describe('getImageEnlargement', () => {
  it('scales a file wider than its box by its height, which it must cover', () => {
    expect(
      getImageEnlargement({
        box: { width: 325, height: 220 },
        file: { width: 720, height: 450 },
        deviceScaleFactor: 2,
      }),
    ).toBeCloseTo(0.978, 3);
  });

  it('scales a file taller than its box by its width, which it must cover', () => {
    expect(
      getImageEnlargement({
        box: { width: 452, height: 220 },
        file: { width: 960, height: 924 },
        deviceScaleFactor: 2,
      }),
    ).toBeCloseTo(0.942, 3);
  });

  it('gives exactly 1 for a file of twice the size of its box on a 2x screen', () => {
    expect(
      getImageEnlargement({
        box: { width: 54, height: 54 },
        file: { width: 108, height: 108 },
        deviceScaleFactor: 2,
      }),
    ).toBe(1);
  });

  it('enlarges a file narrower than its box times the density of the screen', () => {
    expect(
      getImageEnlargement({
        box: { width: 452, height: 220 },
        file: { width: 800, height: 688 },
        deviceScaleFactor: 2,
      }),
    ).toBeCloseTo(1.13, 3);
  });

  it('takes a screen of one device pixel per CSS pixel by default', () => {
    expect(
      getImageEnlargement({ box: { width: 54, height: 54 }, file: { width: 108, height: 108 } }),
    ).toBe(0.5);
  });

  it.each([
    ['no box', { file: { width: 108, height: 108 } }],
    ['a null box', { box: null, file: { width: 108, height: 108 } }],
    ['no file', { box: { width: 54, height: 54 } }],
    ['a file of no width', { box: { width: 54, height: 54 }, file: { width: 0, height: 108 } }],
    ['a box of no height', { box: { width: 54, height: 0 }, file: { width: 108, height: 108 } }],
    ['a negative size', { box: { width: -54, height: 54 }, file: { width: 108, height: 108 } }],
    ['a size of NaN', { box: { width: 54, height: 54 }, file: { width: NaN, height: 108 } }],
    [
      'an infinite size',
      { box: { width: 54, height: 54 }, file: { width: Infinity, height: 108 } },
    ],
    ['a size in text', { box: { width: '54', height: 54 }, file: { width: 108, height: 108 } }],
    ['a size that is a number', { box: 54, file: { width: 108, height: 108 } }],
    [
      'a scale of zero',
      { box: { width: 54, height: 54 }, file: { width: 108, height: 108 }, deviceScaleFactor: 0 },
    ],
    [
      'a scale of NaN',
      { box: { width: 54, height: 54 }, file: { width: 108, height: 108 }, deviceScaleFactor: NaN },
    ],
  ])('measures nothing with %s', (_case, params) => {
    expect(getImageEnlargement(params as Parameters<typeof getImageEnlargement>[0])).toBeNaN();
  });

  it('measures nothing without parameters', () => {
    expect(getImageEnlargement()).toBeNaN();
  });
});
