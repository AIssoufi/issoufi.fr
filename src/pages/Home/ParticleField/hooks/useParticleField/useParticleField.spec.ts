import { fireEvent, renderHook } from '@testing-library/react';

import { OFFSCREEN_POINTER } from '../../../constants.ts';
import type { Point } from '../../../types.ts';
import {
  CURSOR_LINK_DISTANCE_PX,
  FULL_CIRCLE_RAD,
  MAX_PIXEL_RATIO,
  PARTICLE_AREA_PX2,
  REPEL_DISTANCE_PX,
} from '../../constants.ts';
import { useParticleField } from './useParticleField.ts';

const FRAME_MS = 16;
const FRAMES = 10;

/** Width of a canvas that nothing has sized yet, in pixels. */
const DEFAULT_CANVAS_WIDTH_PX = 300;

/** Height of a thin window, wide enough to hold the cursor away from its only dot. */
const ONE_DOT_WINDOW_HEIGHT_PX = 10;
/** Window whose area holds exactly one dot, at its center while `Math.random` returns 0.5. */
const ONE_DOT_WINDOW = {
  width: PARTICLE_AREA_PX2 / ONE_DOT_WINDOW_HEIGHT_PX,
  height: ONE_DOT_WINDOW_HEIGHT_PX,
};
/** Window whose area holds exactly two dots, both at its center. */
const TWO_DOTS_WINDOW = { width: ONE_DOT_WINDOW.width * 2, height: ONE_DOT_WINDOW.height };
const NO_AREA_WINDOW = { width: 0, height: 0 };
const DOT = { x: ONE_DOT_WINDOW.width / 2, y: ONE_DOT_WINDOW.height / 2 };
/** Position beyond the push of the mouse, within a cursor link of the dot. */
const LINKED_POINTER = {
  x: DOT.x - (REPEL_DISTANCE_PX + CURSOR_LINK_DISTANCE_PX) / 2,
  y: DOT.y,
};

/** Sets the size of the window; `vi.unstubAllGlobals()` undoes it. */
const setWindowSize = ({ width, height }: { width: number; height: number }) => {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
};

const fakeContext = () => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
});

/** Parameters of {@link renderField}. */
interface RenderFieldParams {
  /** Whether the dots stand still at first. @default false */
  prefersReducedMotion?: boolean;
  /** Position of the pointer at first. @default OFFSCREEN_POINTER */
  pointer?: Point;
  /** Canvas to draw on, `null` for none. */
  canvas?: HTMLCanvasElement | null;
}

/** Renders the hook on a canvas that has a fake 2D context unless the test gives its own. */
const renderField = ({
  prefersReducedMotion = false,
  pointer = OFFSCREEN_POINTER,
  canvas = document.createElement('canvas'),
}: RenderFieldParams = {}) => {
  const context = fakeContext();
  if (canvas) {
    const fake = context as unknown as CanvasRenderingContext2D;
    vi.spyOn(canvas, 'getContext').mockReturnValue(fake);
  }
  const canvasRef = { current: canvas };
  const pointerRef = { current: pointer };
  const view = renderHook(
    (props: { prefersReducedMotion: boolean }) =>
      useParticleField({ canvasRef, pointerRef, ...props }),
    { initialProps: { prefersReducedMotion } },
  );

  return { ...view, canvas, context, pointerRef };
};

describe('useParticleField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    // Puts every dot at the center of the window, standing still
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setWindowSize(ONE_DOT_WINDOW);
    vi.stubGlobal('devicePixelRatio', 1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('without anything to draw on', () => {
    it('listens to nothing and requests no frame without a canvas', () => {
      const addListener = vi.spyOn(window, 'addEventListener');

      const { unmount } = renderField({ canvas: null });

      expect(addListener).not.toHaveBeenCalledWith('resize', expect.anything());
      expect(vi.getTimerCount()).toBe(0);
      expect(() => unmount()).not.toThrow();
    });

    it('leaves the canvas as it is without 2D canvas support', () => {
      const canvas = document.createElement('canvas');
      const addListener = vi.spyOn(window, 'addEventListener');
      const canvasRef = { current: canvas };
      const pointerRef = { current: OFFSCREEN_POINTER };

      renderHook(() => useParticleField({ canvasRef, pointerRef, prefersReducedMotion: false }));

      expect(canvas.width).toBe(DEFAULT_CANVAS_WIDTH_PX);
      expect(addListener).not.toHaveBeenCalledWith('resize', expect.anything());
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('on mount', () => {
    it('sizes the canvas to the window and starts the frames', () => {
      const { canvas, context } = renderField();

      expect(canvas).toHaveProperty('width', ONE_DOT_WINDOW.width);
      expect(canvas).toHaveProperty('height', ONE_DOT_WINDOW.height);
      expect(context.arc).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(1);
    });

    it('caps the canvas pixels per CSS pixel at the largest ratio', () => {
      vi.stubGlobal('devicePixelRatio', MAX_PIXEL_RATIO + 1);

      const { canvas, context } = renderField();

      expect(canvas).toHaveProperty('width', ONE_DOT_WINDOW.width * MAX_PIXEL_RATIO);
      expect(canvas?.style.width).toBe(`${ONE_DOT_WINDOW.width}px`);
      expect(context.setTransform).toHaveBeenCalledWith(
        MAX_PIXEL_RATIO,
        0,
        0,
        MAX_PIXEL_RATIO,
        0,
        0,
      );
    });

    it('moves on with no dot in a window without area', () => {
      setWindowSize(NO_AREA_WINDOW);

      const { canvas, context } = renderField();
      vi.advanceTimersByTime(FRAME_MS);

      expect(canvas).toHaveProperty('width', 0);
      expect(canvas).toHaveProperty('height', 0);
      expect(context.clearRect).toHaveBeenLastCalledWith(0, 0, 0, 0);
      expect(context.arc).not.toHaveBeenCalled();
    });
  });

  describe('on each frame', () => {
    it('draws the dots again', () => {
      const { context } = renderField();

      vi.advanceTimersByTime(FRAME_MS);

      expect(context.arc).toHaveBeenCalledTimes(2);
      expect(context.arc).toHaveBeenLastCalledWith(
        DOT.x,
        DOT.y,
        expect.any(Number),
        0,
        FULL_CIRCLE_RAD,
      );
    });

    it('reads the latest pointer, with no render', () => {
      const { context, pointerRef } = renderField();

      pointerRef.current = LINKED_POINTER;
      vi.advanceTimersByTime(FRAME_MS);

      expect(context.moveTo).toHaveBeenCalledWith(LINKED_POINTER.x, LINKED_POINTER.y);
      expect(context.lineTo).toHaveBeenCalledWith(DOT.x, DOT.y);
    });
  });

  describe('on a resize', () => {
    it('sizes the canvas to the new window and spreads the dots for its area', () => {
      const { canvas, context } = renderField();

      setWindowSize(TWO_DOTS_WINDOW);
      fireEvent(window, new Event('resize'));

      expect(canvas).toHaveProperty('width', TWO_DOTS_WINDOW.width);
      expect(canvas?.style.width).toBe(`${TWO_DOTS_WINDOW.width}px`);
      context.arc.mockClear();
      vi.advanceTimersByTime(FRAME_MS);
      expect(context.arc).toHaveBeenCalledTimes(2);
    });

    it('keeps a single loop of frames', () => {
      renderField();

      fireEvent(window, new Event('resize'));

      expect(vi.getTimerCount()).toBe(1);
    });
  });

  describe('on unmount', () => {
    it('cancels the pending frame', () => {
      const { context, unmount } = renderField();

      unmount();
      context.arc.mockClear();
      vi.advanceTimersByTime(FRAME_MS * FRAMES);

      expect(vi.getTimerCount()).toBe(0);
      expect(context.arc).not.toHaveBeenCalled();
    });

    it('stops following the window', () => {
      const { canvas, unmount } = renderField();

      unmount();
      setWindowSize(TWO_DOTS_WINDOW);
      fireEvent(window, new Event('resize'));

      expect(canvas).toHaveProperty('width', ONE_DOT_WINDOW.width);
    });
  });

  describe('with reduced motion', () => {
    it('draws the dots once and requests no frame', () => {
      const { context } = renderField({ prefersReducedMotion: true });

      vi.advanceTimersByTime(FRAME_MS * FRAMES);

      expect(context.clearRect).toHaveBeenCalledOnce();
      expect(context.arc).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('draws no link to a pointer close to a dot', () => {
      const { context } = renderField({ prefersReducedMotion: true, pointer: LINKED_POINTER });

      vi.advanceTimersByTime(FRAME_MS * FRAMES);

      expect(context.arc).toHaveBeenCalledOnce();
      expect(context.stroke).not.toHaveBeenCalled();
    });

    it('draws the dots once more for a new size of the window, without a frame', () => {
      const { canvas, context } = renderField({ prefersReducedMotion: true });

      setWindowSize(TWO_DOTS_WINDOW);
      fireEvent(window, new Event('resize'));
      vi.advanceTimersByTime(FRAME_MS * FRAMES);

      expect(canvas).toHaveProperty('width', TWO_DOTS_WINDOW.width);
      expect(context.clearRect).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('stops the frames once it turns on, keeping the dots drawn', () => {
      const { context, rerender } = renderField();
      context.arc.mockClear();

      rerender({ prefersReducedMotion: true });
      vi.advanceTimersByTime(FRAME_MS * FRAMES);

      expect(context.arc).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('starts the frames once it turns off', () => {
      const { rerender } = renderField({ prefersReducedMotion: true });

      rerender({ prefersReducedMotion: false });

      expect(vi.getTimerCount()).toBe(1);
    });

    it('listens to a single resize after it changes', () => {
      const { context, rerender } = renderField();
      rerender({ prefersReducedMotion: true });
      context.clearRect.mockClear();

      fireEvent(window, new Event('resize'));

      expect(context.clearRect).toHaveBeenCalledOnce();
    });
  });
});
