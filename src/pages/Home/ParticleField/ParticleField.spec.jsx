import { fireEvent, render } from '@testing-library/react';

import { stubMatchMedia } from '../../../mediaQueryTestUtils';
import {
  CURSOR_LINK_DISTANCE_PX,
  CURSOR_LINK_MAX_OPACITY,
  CURSOR_LINK_MAX_WIDTH_PX,
  LINK_RGB,
  PARTICLE_AREA_PX2,
  REPEL_DISTANCE_PX,
} from './constants';
import { ParticleField } from './ParticleField';

const FRAME_MS = 16;

/**
 * Height of a thin window, so that the area of a single dot makes it wide enough to hold the
 * cursor out of reach of that dot, on the same row.
 */
const ONE_DOT_WINDOW_HEIGHT_PX = 10;
/** Window whose area holds exactly one dot, at its center while `Math.random` returns 0.5. */
const ONE_DOT_WINDOW = {
  width: PARTICLE_AREA_PX2 / ONE_DOT_WINDOW_HEIGHT_PX,
  height: ONE_DOT_WINDOW_HEIGHT_PX,
};
const DOT = { x: ONE_DOT_WINDOW.width / 2, y: ONE_DOT_WINDOW.height / 2 };
/** Distance between the cursor and the dot: beyond the push of the mouse, within a cursor link. */
const LINKED_DISTANCE_PX = (REPEL_DISTANCE_PX + CURSOR_LINK_DISTANCE_PX) / 2;
/** Strength of a cursor link at {@link LINKED_DISTANCE_PX}, fading linearly to 0 at its reach. */
const LINKED_STRENGTH = 1 - LINKED_DISTANCE_PX / CURSOR_LINK_DISTANCE_PX;
/** Distance between the cursor and the dot, beyond any cursor link. */
const UNLINKED_DISTANCE_PX = CURSOR_LINK_DISTANCE_PX * 2;

const DEFAULT_WINDOW = { width: window.innerWidth, height: window.innerHeight };

const resizeWindow = ({ width, height }) => {
  window.innerWidth = width;
  window.innerHeight = height;
};

const fakeContext = () => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
});

describe('ParticleField', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resizeWindow(DEFAULT_WINDOW);
  });

  it('renders a canvas and keeps it static without 2D canvas support', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container, unmount } = render(<ParticleField />);

    expect(container.querySelector('canvas')).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  it('draws frames when 2D canvas is available', async () => {
    const context = fakeContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    const { unmount } = render(<ParticleField />);

    await vi.waitFor(() => expect(context.clearRect).toHaveBeenCalled());
    unmount();
  });

  describe('cursor links', () => {
    let context;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      // Puts every dot at the center of the window, standing still
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      resizeWindow(ONE_DOT_WINDOW);
      context = fakeContext();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    });

    it('links the cursor to a dot close to it', () => {
      render(<ParticleField />);
      const pointer = { x: DOT.x - LINKED_DISTANCE_PX, y: DOT.y };

      fireEvent.mouseMove(window, { clientX: pointer.x, clientY: pointer.y });
      vi.advanceTimersByTime(FRAME_MS);

      expect(context.moveTo).toHaveBeenCalledWith(pointer.x, pointer.y);
      expect(context.lineTo).toHaveBeenCalledWith(DOT.x, DOT.y);
      expect(context.stroke).toHaveBeenCalledOnce();
    });

    it('fades and thins the cursor link linearly with the distance', () => {
      render(<ParticleField />);

      fireEvent.mouseMove(window, { clientX: DOT.x - LINKED_DISTANCE_PX, clientY: DOT.y });
      vi.advanceTimersByTime(FRAME_MS);

      const [, rgb, opacity] = context.strokeStyle.match(/^rgba\((.+),([\d.]+)\)$/) ?? [];
      expect(rgb).toBe(LINK_RGB);
      expect(Number(opacity)).toBeCloseTo(LINKED_STRENGTH * CURSOR_LINK_MAX_OPACITY);
      expect(context.lineWidth).toBeCloseTo(LINKED_STRENGTH * CURSOR_LINK_MAX_WIDTH_PX);
    });

    it('does not link the cursor to a dot out of reach', () => {
      render(<ParticleField />);

      fireEvent.mouseMove(window, { clientX: DOT.x - UNLINKED_DISTANCE_PX, clientY: DOT.y });
      vi.advanceTimersByTime(FRAME_MS);

      // One dot drawn on mount and one on the next frame, without any line
      expect(context.arc).toHaveBeenCalledTimes(2);
      expect(context.stroke).not.toHaveBeenCalled();
    });

    it('draws no cursor link once the mouse has left the window', () => {
      render(<ParticleField />);
      fireEvent.mouseMove(window, { clientX: DOT.x - LINKED_DISTANCE_PX, clientY: DOT.y });

      fireEvent.mouseLeave(document);
      vi.advanceTimersByTime(FRAME_MS);

      expect(context.arc).toHaveBeenCalledTimes(2);
      expect(context.stroke).not.toHaveBeenCalled();
    });
  });

  describe('with reduced motion', () => {
    let context;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      resizeWindow(ONE_DOT_WINDOW);
      context = fakeContext();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    });

    it('draws the dots once, and requests no animation frame', () => {
      stubMatchMedia({ matches: true });
      render(<ParticleField />);

      vi.advanceTimersByTime(FRAME_MS * 10);

      expect(context.clearRect).toHaveBeenCalledOnce();
      expect(context.arc).toHaveBeenCalledOnce();
      expect(context.arc).toHaveBeenCalledWith(DOT.x, DOT.y, expect.any(Number), 0, Math.PI * 2);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('ignores the mouse: no push and no cursor link', () => {
      stubMatchMedia({ matches: true });
      render(<ParticleField />);

      fireEvent.mouseMove(window, { clientX: DOT.x - LINKED_DISTANCE_PX, clientY: DOT.y });
      vi.advanceTimersByTime(FRAME_MS * 10);

      expect(context.arc).toHaveBeenCalledOnce();
      expect(context.stroke).not.toHaveBeenCalled();
    });

    it('draws the dots again, still, for a new size of the window', () => {
      stubMatchMedia({ matches: true });
      render(<ParticleField />);
      const resizedWindow = { width: ONE_DOT_WINDOW.width * 2, height: ONE_DOT_WINDOW.height };

      resizeWindow(resizedWindow);
      fireEvent(window, new Event('resize'));
      vi.advanceTimersByTime(FRAME_MS * 10);

      // One dot for the first size, then two for the window twice as large, all drawn once
      expect(context.clearRect).toHaveBeenCalledTimes(2);
      expect(context.arc).toHaveBeenCalledTimes(3);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('stops moving the dots once the visitor turns it on', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      render(<ParticleField />);
      vi.advanceTimersByTime(FRAME_MS);

      setMatches(true);
      const arcCallsOnceStill = context.arc.mock.calls.length;
      vi.advanceTimersByTime(FRAME_MS * 10);

      expect(context.arc).toHaveBeenCalledTimes(arcCallsOnceStill);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('moves the dots again once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      render(<ParticleField />);

      setMatches(false);
      const arcCallsBeforeFrames = context.arc.mock.calls.length;
      vi.advanceTimersByTime(FRAME_MS * 3);

      expect(context.arc.mock.calls.length).toBeGreaterThan(arcCallsBeforeFrames);
      expect(vi.getTimerCount()).toBe(1);
    });
  });
});
