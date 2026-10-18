import { renderHook, waitFor } from '@testing-library/react';
import type { AnimationItem } from 'lottie-web';
import lottie from 'lottie-web/build/player/lottie_light';

import { useLottieAnimation } from './useLottieAnimation';

// Each test keeps one ref object for the whole render, as useRef does: a new ref draws the animation again

vi.mock('lottie-web/build/player/lottie_light', () => ({
  default: { loadAnimation: vi.fn() },
}));

const ANIMATION_DATA = { v: '5.7.4', layers: [] };

/** Waits for the pending dynamic import and its callbacks to settle. */
const flushImport = () => new Promise(resolve => setTimeout(resolve, 0));

describe('useLottieAnimation', () => {
  let animation: AnimationItem;

  beforeEach(() => {
    // Only destroy is called by the hook
    animation = { destroy: vi.fn() } as unknown as AnimationItem;
    vi.mocked(lottie.loadAnimation).mockReset().mockReturnValue(animation);
  });

  it('returns null until lottie-web is loaded, then the drawn animation', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const { result } = renderHook(() =>
      useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }),
    );

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toBe(animation));
  });

  it('draws the animation into the container as an SVG, paused', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    renderHook(() => useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }));

    await waitFor(() =>
      expect(lottie.loadAnimation).toHaveBeenCalledWith({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: ANIMATION_DATA,
      }),
    );
  });

  it('loads nothing without a container', async () => {
    const containerRef = { current: null };
    const { result } = renderHook(() =>
      useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }),
    );
    await flushImport();

    expect(lottie.loadAnimation).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('destroys the animation on unmount', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }),
    );
    await waitFor(() => expect(result.current).toBe(animation));

    unmount();

    expect(animation.destroy).toHaveBeenCalledTimes(1);
  });

  it('draws nothing when unmounted before lottie-web is loaded', async () => {
    const container = document.createElement('div');
    const containerRef = { current: container };
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }),
    );

    unmount();
    await flushImport();

    expect(lottie.loadAnimation).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('keeps the ref empty, without throwing, when the animation cannot be drawn', async () => {
    vi.mocked(lottie.loadAnimation).mockImplementation(() => {
      throw new Error('Invalid animation data');
    });
    const container = document.createElement('div');
    const containerRef = { current: container };
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef, animationData: 'not json' }),
    );
    await flushImport();

    expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();
    expect(() => unmount()).not.toThrow();
  });

  it('destroys the animation and draws it again when the container changes', async () => {
    const first = { current: document.createElement('div') };
    const second = { current: document.createElement('div') };
    const { result, rerender } = renderHook(
      ({ containerRef }) => useLottieAnimation({ containerRef, animationData: ANIMATION_DATA }),
      { initialProps: { containerRef: first } },
    );
    await waitFor(() => expect(result.current).toBe(animation));

    rerender({ containerRef: second });

    expect(animation.destroy).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(lottie.loadAnimation).toHaveBeenLastCalledWith(
        expect.objectContaining({ container: second.current }),
      ),
    );
  });
});
