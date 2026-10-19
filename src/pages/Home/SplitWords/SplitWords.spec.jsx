import { fireEvent, render, screen } from '@testing-library/react';

import { stubMatchMedia } from '../../../mediaQueryTestUtils';
import { RETURN_DELAY_MS } from './constants';
import { SplitWords } from './SplitWords';

const FRAME_MS = 16;
/** Pointer distance from a word close enough to push it, since jsdom puts every word at 0,0. */
const PUSHING_POINTER = { clientX: 50, clientY: 0 };
const RESTING_TRANSFORM = 'translate(0px, 0px) rotate(0deg)';
/** Transform of a word pushed to the left, away from {@link PUSHING_POINTER}, without spin. */
const PUSHED_LEFT_TRANSFORM = /^translate\(-[\d.]+px, 0px\) rotate\(0deg\)$/;

const getWords = container => [...container.querySelectorAll('span')];

/** Distance in pixels of a word from its place, read from the transform the animation writes. */
const getShift = word => {
  const [, x, y] = word.style.transform.match(/translate\((\S+)px, (\S+)px\)/);
  return Math.hypot(Number(x), Number(y));
};

/** Largest distance in pixels of a word back in its place once its spring has settled. */
const SETTLED_SHIFT_PX = 0.5;
/** Time for a spring to settle once it pulls a word back, in milliseconds. */
const SPRING_SETTLING_MS = 2000;

describe('SplitWords', () => {
  it('renders nothing without children', () => {
    const { container } = render(<SplitWords />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders one span per word', () => {
    const { container } = render(<SplitWords>Full-stack JavaScript Developer</SplitWords>);

    expect(container.querySelectorAll('span')).toHaveLength(3);
    expect(container).toHaveTextContent('Full-stack JavaScript Developer');
  });

  describe('animation', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      // Gives a push no random spin
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('leaves the words at rest while the mouse is outside the window', () => {
      const { container } = render(<SplitWords>Full-stack Developer</SplitWords>);

      vi.advanceTimersByTime(FRAME_MS);

      getWords(container).forEach(word => {
        expect(word.style.transform).toBe(RESTING_TRANSFORM);
        expect(word.style.textShadow).toBe('');
      });
    });

    it('pushes a word away from a close pointer and makes it glow', () => {
      const { container } = render(<SplitWords>Developer</SplitWords>);

      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);

      const [word] = getWords(container);
      expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM);
      expect(word.style.textShadow).not.toBe('');
    });

    it.each([
      ['a link', <a href="/projects">Voir mes projets</a>],
      ['a button', <button type="button">Menu</button>],
    ])(
      'leaves the words in place while the mouse is over %s, and pushes them once it leaves',
      (_control, control) => {
        const { container } = render(
          <>
            <SplitWords>Developer</SplitWords>
            {control}
          </>,
        );
        const [word] = getWords(container);

        fireEvent.mouseMove(screen.getByText(control.props.children), PUSHING_POINTER);
        vi.advanceTimersByTime(FRAME_MS * 10);
        expect(word.style.transform).toBe(RESTING_TRANSFORM);

        fireEvent.mouseMove(window, PUSHING_POINTER);
        vi.advanceTimersByTime(FRAME_MS);
        expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM);
      },
    );

    it('puts back a pushed word once the mouse moves onto a link', () => {
      // performance.now() dates each push, after which the spring waits RETURN_DELAY_MS
      vi.useFakeTimers({
        toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      });
      const { container } = render(
        <>
          <SplitWords>Developer</SplitWords>
          <a href="/projects">Voir mes projets</a>
        </>,
      );
      const [word] = getWords(container);
      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);
      expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM);

      fireEvent.mouseMove(screen.getByRole('link'), PUSHING_POINTER);
      vi.advanceTimersByTime(RETURN_DELAY_MS + SPRING_SETTLING_MS);

      expect(getShift(word)).toBeLessThan(SETTLED_SHIFT_PX);
    });

    it('keeps animating the remaining words after some are removed', () => {
      const { container, rerender } = render(
        <SplitWords>Full-stack JavaScript Developer</SplitWords>,
      );
      rerender(<SplitWords>Full-stack JavaScript</SplitWords>);

      fireEvent.mouseMove(window, PUSHING_POINTER);
      expect(() => vi.advanceTimersByTime(FRAME_MS)).not.toThrow();

      const words = getWords(container);
      expect(words).toHaveLength(2);
      words.forEach(word => expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM));
    });

    it('animates a word added after the first render', () => {
      const { container, rerender } = render(<SplitWords>Full-stack JavaScript</SplitWords>);
      rerender(<SplitWords>Full-stack JavaScript Developer</SplitWords>);

      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);

      const words = getWords(container);
      expect(words).toHaveLength(3);
      words.forEach(word => expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM));
    });

    it('leaves the words in place with reduced motion, and requests no animation frame', () => {
      stubMatchMedia({ matches: true });
      const { container } = render(<SplitWords>Full-stack Developer</SplitWords>);

      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS * 10);

      getWords(container).forEach(word => {
        expect(word.style.transform).toBe('');
        expect(word.style.textShadow).toBe('');
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('puts back the pushed words once the visitor turns reduced motion on', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const { container } = render(<SplitWords>Full-stack Developer</SplitWords>);
      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);
      getWords(container).forEach(word =>
        expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM),
      );

      setMatches(true);
      vi.advanceTimersByTime(FRAME_MS * 10);

      getWords(container).forEach(word => {
        expect(word.style.transform).toBe('');
        expect(word.style.textShadow).toBe('');
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('puts back the remaining words once the visitor turns reduced motion on after some are removed', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const { container, rerender } = render(
        <SplitWords>Full-stack JavaScript Developer</SplitWords>,
      );
      // The removed word leaves an empty slot among the elements of the words
      rerender(<SplitWords>Full-stack JavaScript</SplitWords>);
      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);
      getWords(container).forEach(word =>
        expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM),
      );

      expect(() => setMatches(true)).not.toThrow();

      const words = getWords(container);
      expect(words).toHaveLength(2);
      words.forEach(word => {
        expect(word.style.transform).toBe('');
        expect(word.style.textShadow).toBe('');
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('pushes the words again, from their place, once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      const { container } = render(<SplitWords>Developer</SplitWords>);

      setMatches(false);
      fireEvent.mouseMove(window, PUSHING_POINTER);
      vi.advanceTimersByTime(FRAME_MS);

      const [word] = getWords(container);
      expect(word.style.transform).toMatch(PUSHED_LEFT_TRANSFORM);
    });

    it('cancels its next animation frame on unmount', () => {
      const { unmount } = render(<SplitWords>Developer</SplitWords>);
      vi.advanceTimersByTime(FRAME_MS);
      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
