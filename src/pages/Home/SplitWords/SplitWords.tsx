import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';
import { StrongWord } from './SplitWords.styled';
import { OFFSCREEN_POINTER } from '../constants';
import { usePointerRef } from '../hooks/usePointerRef';
import { NON_BREAKING_SPACE, RESTING_WORD, SHIMMER_CYCLE_S } from './constants';
import { usePointerOnControlRef } from './hooks/usePointerOnControlRef';
import type { WordState } from './types';
import { getGlowRadius, getTextShadow, stepWord } from './utils';

/** Props of {@link SplitWords}. */
interface SplitWordsProps {
  /** Text to split on spaces, one animated word per span. Renders nothing when missing. */
  children?: string;
  /**
   * Position of the first word in the whole title, so the shimmer delay and direction keep
   * alternating across several `SplitWords` of the same heading.
   * @default 0
   */
  startIndex?: number;
}

/**
 * Renders a text as separate words that the mouse pushes away and that spring back into place,
 * with a shimmering gradient. A mouse over a link or a button pushes no word, so aiming at one
 * never makes the title jump. Runs a `requestAnimationFrame` loop and mouse listeners while
 * mounted, and removes them on unmount. With reduced motion, the words stay in place, without the
 * shimmer that `GlobalStyle` stops, and those pushed before the visitor turned it on go back.
 *
 * @example
 * <SplitWords startIndex={0}>Full-stack JavaScript Developer</SplitWords>
 */
export const SplitWords = ({ children, startIndex = 0 }: SplitWordsProps) => {
  const words = children ? children.split(' ') : [];
  const wordElements = useRef<(HTMLSpanElement | null)[]>([]);
  const wordStates = useRef<WordState[]>(words.map(() => RESTING_WORD));
  const pointerRef = usePointerRef();
  const isPointerOnControlRef = usePointerOnControlRef();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      // Puts back the words pushed before the visitor turned reduced motion on
      wordStates.current = wordStates.current.map(() => RESTING_WORD);
      wordElements.current.forEach(element => {
        if (!element) return;
        element.style.transform = '';
        element.style.textShadow = '';
      });
      return;
    }

    let frame = 0;

    const tick = () => {
      const now = performance.now();
      // A mouse over a control counts as away, so the words it pushed go back to their place
      const pointer = isPointerOnControlRef.current ? OFFSCREEN_POINTER : pointerRef.current;

      wordElements.current.forEach((element, index) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const state = stepWord({
          state: wordStates.current[index] ?? RESTING_WORD,
          center,
          pointer,
          now,
        });
        wordStates.current[index] = state;

        element.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rot}deg)`;
        element.style.textShadow = getTextShadow(getGlowRadius(state));
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPointerOnControlRef, pointerRef, prefersReducedMotion]);

  return (
    <>
      {words.map((word, index) => {
        const titleIndex = startIndex + index;
        const isLastWord = index === words.length - 1;
        const isReversed = titleIndex % 2 === 1;

        return (
          <StrongWord
            key={index}
            ref={element => {
              wordElements.current[index] = element;
            }}
            $delay={`-${titleIndex % SHIMMER_CYCLE_S}s`}
            $reverse={isReversed}
          >
            {word}
            {isLastWord ? '' : NON_BREAKING_SPACE}
          </StrongWord>
        );
      })}
    </>
  );
};
