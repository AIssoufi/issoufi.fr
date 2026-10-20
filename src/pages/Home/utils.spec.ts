import { CURSOR_GLOW_START, OFFSCREEN_POINTER } from './constants.ts';
import {
  easeTowards,
  getCursorGlowTransform,
  getMagneticOffset,
  getParallaxOffset,
  isPointerOnScreen,
  splitLastWord,
} from './utils.ts';

describe('easeTowards', () => {
  it('covers the given fraction of the distance', () => {
    expect(easeTowards({ from: { x: 0, y: 0 }, to: { x: 100, y: 50 }, factor: 0.1 })).toEqual({
      x: 10,
      y: 5,
    });
  });

  it.each([
    ['stays in place with a factor of 0', 0, { x: 10, y: 20 }],
    ['reaches the target with a factor of 1', 1, { x: 30, y: -40 }],
  ])('%s', (_, factor, expected) => {
    expect(easeTowards({ from: { x: 10, y: 20 }, to: { x: 30, y: -40 }, factor })).toEqual(
      expected,
    );
  });
});

describe('getCursorGlowTransform', () => {
  it.each([
    ['a point of the viewport', { x: 100, y: 50 }, 'translate(80px, 30px)'],
    ['the top-left corner', { x: 0, y: 0 }, 'translate(-20px, -20px)'],
    [
      'a point off the viewport, where the glow starts',
      CURSOR_GLOW_START,
      'translate(-120px, -120px)',
    ],
    ['a point between two pixels', { x: 10.5, y: 20.25 }, 'translate(-9.5px, 0.25px)'],
  ])('centers the glow on %s', (_, point, expected) => {
    expect(getCursorGlowTransform(point)).toBe(expected);
  });
});

describe('getParallaxOffset', () => {
  const viewport = { x: 1000, y: 800 };
  const maxOffset = { x: 10, y: 7 };

  it('does not shift at the center', () => {
    const offset = getParallaxOffset({ pointer: { x: 500, y: 400 }, viewport, maxOffset });
    expect(offset.x).toBeCloseTo(0);
    expect(offset.y).toBeCloseTo(0);
  });

  it('shifts by the maximum, away from the pointer, at the edges', () => {
    expect(getParallaxOffset({ pointer: { x: 1000, y: 0 }, viewport, maxOffset })).toEqual({
      x: -10,
      y: 7,
    });
  });

  it('does not shift for an empty viewport instead of returning NaN', () => {
    expect(
      getParallaxOffset({ pointer: { x: 0, y: 0 }, viewport: { x: 0, y: 0 }, maxOffset }),
    ).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('getMagneticOffset', () => {
  const rect = { left: 100, top: 100, width: 200, height: 50 };

  it('follows the pointer from the center with the given strength', () => {
    expect(getMagneticOffset({ pointer: { x: 250, y: 145 }, rect, strength: 0.4 })).toEqual({
      x: 20,
      y: 8,
    });
  });

  it('does not move when the pointer is on the center', () => {
    expect(getMagneticOffset({ pointer: { x: 200, y: 125 }, rect, strength: 0.4 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('isPointerOnScreen', () => {
  it('is false for the offscreen pointer', () => {
    expect(isPointerOnScreen(OFFSCREEN_POINTER)).toBe(false);
  });

  it.each([
    { x: 0, y: 0 },
    { x: 500, y: 300 },
    { x: -9999, y: 10 },
  ])('is true for %j', pointer => {
    expect(isPointerOnScreen(pointer)).toBe(true);
  });
});

describe('splitLastWord', () => {
  it.each([
    ['a French start of the title', 'passionné par l’', 'passionné par ', 'l’'],
    ['a French middle of the title', ' et l’', ' et ', 'l’'],
    ['an English start, ending with a space', 'passionate about ', 'passionate about ', ''],
    ['an English middle, between two spaces', ' and ', ' and ', ''],
    ['a word alone', 'l’', '', 'l’'],
    ['words joined by a no-break space', 'par l’UX\u00a0Design', 'par ', 'l’UX\u00a0Design'],
    ['a text of a single space', ' ', ' ', ''],
    ['an empty text', '', '', ''],
  ])('splits %s before its last word', (_case, text, leading, lastWord) => {
    expect(splitLastWord(text)).toEqual({ leading, lastWord });
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a number', 42],
    ['an object', { text: 'par l’' }],
  ])('gives two empty texts for %s', (_case, text) => {
    expect(splitLastWord(text)).toEqual({ leading: '', lastWord: '' });
  });
});
