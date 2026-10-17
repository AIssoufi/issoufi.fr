import { renderHook, waitFor } from '@testing-library/react';
import type { AnimationItem } from 'lottie-web';
import lottie from 'lottie-web/build/player/lottie_light';

import { useLottieAnimation } from './useLottieAnimation';

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

  it('returns null until lottie-web is loaded, then the animation', async () => {
    const container = document.createElement('div');
    const { result } = renderHook(() =>
      useLottieAnimation({ containerRef: { current: container }, animationData: ANIMATION_DATA }),
    );

    expect(result.current.current).toBeNull();
    await waitFor(() => expect(result.current.current).toBe(animation));
  });

  it('draws the animation into the container as an SVG, paused', async () => {
    const container = document.createElement('div');
    renderHook(() =>
      useLottieAnimation({ containerRef: { current: container }, animationData: ANIMATION_DATA }),
    );

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
    const { result } = renderHook(() =>
      useLottieAnimation({ containerRef: { current: null }, animationData: ANIMATION_DATA }),
    );
    await flushImport();

    expect(lottie.loadAnimation).not.toHaveBeenCalled();
    expect(result.current.current).toBeNull();
  });

  it('destroys the animation on unmount', async () => {
    const container = document.createElement('div');
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef: { current: container }, animationData: ANIMATION_DATA }),
    );
    await waitFor(() => expect(result.current.current).toBe(animation));
    const animationRef = result.current;

    unmount();

    expect(animation.destroy).toHaveBeenCalledTimes(1);
    expect(animationRef.current).toBeNull();
  });

  it('draws nothing when unmounted before lottie-web is loaded', async () => {
    const container = document.createElement('div');
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef: { current: container }, animationData: ANIMATION_DATA }),
    );

    unmount();
    await flushImport();

    expect(lottie.loadAnimation).not.toHaveBeenCalled();
    expect(result.current.current).toBeNull();
  });

  it('keeps the ref empty, without throwing, when the animation cannot be drawn', async () => {
    vi.mocked(lottie.loadAnimation).mockImplementation(() => {
      throw new Error('Invalid animation data');
    });
    const container = document.createElement('div');
    const { result, unmount } = renderHook(() =>
      useLottieAnimation({ containerRef: { current: container }, animationData: 'not json' }),
    );
    await flushImport();

    expect(lottie.loadAnimation).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBeNull();
    expect(() => unmount()).not.toThrow();
  });
});
