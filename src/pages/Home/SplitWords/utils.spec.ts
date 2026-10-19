import { OFFSCREEN_POINTER } from '../constants';
import { MAX_GLOW_PX, REPEL_RADIUS_PX, RESTING_WORD, RETURN_DELAY_MS } from './constants';
import type { WordState } from './types';
import { getGlowRadius, getTextShadow, isOnControl, stepWord } from './utils';

const center = { x: 500, y: 300 };

const FRAME_MS = 16;
/** Frames of a pointer held still for two seconds, longer than a push and its return. */
const STILL_POINTER_FRAMES = 120;
/**
 * Smallest distance from the center of a title word to a button of the home page, measured in
 * Chromium at 1280 × 800 px, the closest of 1280, 1440 and 1920 px wide screens: from "UX" to the
 * top edge of "Voir mes projets".
 */
const WORD_TO_BUTTON_DISTANCE_PX = 130;

/**
 * Runs {@link stepWord} on every frame of a pointer held still near a word resting at
 * {@link center}, which moves with its offset as on the screen, and returns its last state.
 */
const holdPointer = (pointer: { x: number; y: number }) => {
  let state: WordState = RESTING_WORD;
  for (let frame = 1; frame <= STILL_POINTER_FRAMES; frame += 1) {
    const shownCenter = { x: center.x + state.x, y: center.y + state.y };
    state = stepWord({
      state,
      center: shownCenter,
      pointer,
      now: frame * FRAME_MS,
      random: () => 0.5,
    });
  }
  return state;
};

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

  it('pushes a word from a mouse just inside the repel radius, and not from one on its edge', () => {
    const pointerAt = (distance: number) => ({ x: center.x, y: center.y + distance });

    expect(
      stepWord({ state: RESTING_WORD, center, pointer: pointerAt(REPEL_RADIUS_PX - 1), now: 1000 })
        .y,
    ).toBeLessThan(0);
    expect(
      stepWord({ state: RESTING_WORD, center, pointer: pointerAt(REPEL_RADIUS_PX), now: 1000 }),
    ).toEqual(RESTING_WORD);
  });

  it.each([
    ['right under the word', { x: center.x, y: center.y + WORD_TO_BUTTON_DISTANCE_PX }],
    ['aside', { x: center.x - REPEL_RADIUS_PX, y: center.y + WORD_TO_BUTTON_DISTANCE_PX }],
  ])('leaves a word in place while the mouse rests on a home button, %s', (_place, pointer) => {
    expect(holdPointer(pointer)).toEqual(RESTING_WORD);
  });

  it('keeps pushing a word under a mouse held still inside the repel radius', () => {
    expect(holdPointer({ x: center.x, y: center.y + REPEL_RADIUS_PX / 2 }).y).toBeLessThan(0);
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

describe('isOnControl', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    ['a link', '<a href="/projects">Voir mes projets</a>', 'a'],
    ['the text of a link', '<a href="/projects"><span>Voir</span></a>', 'span'],
    ['a button', '<button type="button">Menu</button>', 'button'],
    ['the icon of a button', '<button type="button"><svg></svg></button>', 'svg'],
  ])('is true on %s', (_case, html, selector) => {
    document.body.innerHTML = html;
    expect(isOnControl(document.querySelector(selector))).toBe(true);
  });

  it.each([
    ['a paragraph', '<p>Text</p>', 'p'],
    ['a word of the title', '<h1><span>UX</span></h1>', 'span'],
  ])('is false on %s', (_case, html, selector) => {
    document.body.innerHTML = html;
    expect(isOnControl(document.querySelector(selector))).toBe(false);
  });

  it.each([
    ['the window', window],
    ['the document', document],
    ['a text node', document.createTextNode('Voir')],
    ['null', null],
    ['undefined', undefined],
  ])('is false on %s, which is no element', (_case, target) => {
    expect(isOnControl(target)).toBe(false);
  });
});
