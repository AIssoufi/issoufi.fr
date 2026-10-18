import { renderHook } from '@testing-library/react';
import type { MouseEvent } from 'react';

import { stubMatchMedia } from '../../../../../mediaQueryTestUtils';
import { CARD_HOVER_LIFT_PX, CARD_MAX_TILT_DEG, CARD_PERSPECTIVE_PX } from '../../constants';
import { useCardTilt } from './useCardTilt';

/** Box of the card in the viewport. */
const CARD_BOX = { left: 100, top: 100, width: 200, height: 100 };
/**
 * Pointer on the right edge of {@link CARD_BOX}, a quarter of the way down, from the card's
 * corner: the full tilt around the vertical axis and half of it around the horizontal one.
 */
const CARD_POINTER = { x: CARD_BOX.width, y: CARD_BOX.height / 4 };
/** Transform of the card under {@link CARD_POINTER}. */
const TILTED_TRANSFORM = `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(${CARD_MAX_TILT_DEG / 2}deg) rotateY(${CARD_MAX_TILT_DEG}deg) translateY(-${CARD_HOVER_LIFT_PX}px)`;

/** A card laid out at {@link CARD_BOX}, which jsdom would leave without a box. */
const createCard = () => {
  const card = document.createElement('li');
  card.getBoundingClientRect = () => CARD_BOX as DOMRect;
  return card;
};

/** Parameters of {@link mouseEventOn}. */
interface MouseEventOnParams {
  /** Card the event happens on. */
  card: HTMLElement;
  /** Pointer position from the card's top-left corner. @default CARD_POINTER */
  pointer?: { x: number; y: number };
}

/** A mouse event on the card, with the pointer at the given point of the card. */
const mouseEventOn = ({ card, pointer = CARD_POINTER }: MouseEventOnParams) =>
  ({
    currentTarget: card,
    clientX: CARD_BOX.left + pointer.x,
    clientY: CARD_BOX.top + pointer.y,
  }) as unknown as MouseEvent<HTMLElement>;

describe('useCardTilt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tilts the card toward the pointer, lifts it and moves its light under the pointer', () => {
    const { result } = renderHook(() => useCardTilt());
    const card = createCard();

    result.current.onMouseMove(mouseEventOn({ card }));

    expect(card.style.transform).toBe(TILTED_TRANSFORM);
    expect(card.style.getPropertyValue('--mouse-x')).toBe(`${CARD_POINTER.x}px`);
    expect(card.style.getPropertyValue('--mouse-y')).toBe(`${CARD_POINTER.y}px`);
  });

  it('only lifts the card with the pointer at its center', () => {
    const { result } = renderHook(() => useCardTilt());
    const card = createCard();

    result.current.onMouseMove(
      mouseEventOn({ card, pointer: { x: CARD_BOX.width / 2, y: CARD_BOX.height / 2 } }),
    );

    expect(card.style.transform).toBe(
      `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg) translateY(-${CARD_HOVER_LIFT_PX}px)`,
    );
  });

  it('does not tilt a card without a box, but still lifts it', () => {
    const { result } = renderHook(() => useCardTilt());
    const card = createCard();
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 }) as DOMRect;

    result.current.onMouseMove({
      currentTarget: card,
      clientX: 0,
      clientY: 0,
    } as unknown as MouseEvent<HTMLElement>);

    expect(card.style.transform).toBe(
      `perspective(${CARD_PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg) translateY(-${CARD_HOVER_LIFT_PX}px)`,
    );
  });

  it('flattens the card when the pointer leaves', () => {
    const { result } = renderHook(() => useCardTilt());
    const card = createCard();
    result.current.onMouseMove(mouseEventOn({ card }));

    result.current.onMouseLeave(mouseEventOn({ card }));

    expect(card.style.transform).toBe('');
  });

  it('returns the same handlers across renders while the preference stays the same', () => {
    const { result, rerender } = renderHook(() => useCardTilt());
    const first = result.current;

    rerender();

    expect(result.current.onMouseMove).toBe(first.onMouseMove);
    expect(result.current.onMouseLeave).toBe(first.onMouseLeave);
  });

  describe('with reduced motion', () => {
    it('neither tilts nor lifts the card, but still moves its light under the pointer', () => {
      stubMatchMedia({ matches: true });
      const { result } = renderHook(() => useCardTilt());
      const card = createCard();

      result.current.onMouseMove(mouseEventOn({ card }));

      expect(card.style.transform).toBe('');
      expect(card.style.getPropertyValue('--mouse-x')).toBe(`${CARD_POINTER.x}px`);
      expect(card.style.getPropertyValue('--mouse-y')).toBe(`${CARD_POINTER.y}px`);
    });

    it('stops tilting once the visitor turns it on, and still flattens a tilted card', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const { result } = renderHook(() => useCardTilt());
      const card = createCard();
      result.current.onMouseMove(mouseEventOn({ card }));

      setMatches(true);
      result.current.onMouseMove(mouseEventOn({ card, pointer: { x: 0, y: 0 } }));
      expect(card.style.transform).toBe(TILTED_TRANSFORM);

      result.current.onMouseLeave(mouseEventOn({ card }));
      expect(card.style.transform).toBe('');
    });

    it('tilts the card again once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      const { result } = renderHook(() => useCardTilt());
      const card = createCard();

      setMatches(false);
      result.current.onMouseMove(mouseEventOn({ card }));

      expect(card.style.transform).toBe(TILTED_TRANSFORM);
    });
  });
});
