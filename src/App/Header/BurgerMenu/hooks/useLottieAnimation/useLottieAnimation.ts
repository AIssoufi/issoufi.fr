import type { AnimationItem } from 'lottie-web';
import { type RefObject, useEffect, useRef } from 'react';

/** Parameters of {@link useLottieAnimation}. */
interface UseLottieAnimationParams {
  /** Element the animation is drawn into. Nothing is loaded while it is not mounted. */
  containerRef: RefObject<HTMLElement | null>;
  /** Animation exported from After Effects, as JSON. Keep it stable: a new value draws it again. */
  animationData?: unknown;
}

/**
 * Draws a Lottie animation into an element as an SVG, paused on its first frame, and returns a
 * ref to it for playback. lottie-web, in its light build (SVG only, no expressions), is loaded
 * after the first render, from its own chunk, so it never delays the page. The ref stays `null`
 * until then, and for good if lottie-web fails to load. The animation is destroyed on unmount,
 * and never drawn when the component unmounts before lottie-web is loaded.
 *
 * @returns Ref to the animation, `null` while it is not drawn.
 */
export function useLottieAnimation({
  containerRef,
  animationData,
}: UseLottieAnimationParams): RefObject<AnimationItem | null> {
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isUnmounted = false;
    let animation: AnimationItem | undefined;

    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (isUnmounted) return;

        animation = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData,
        });
        animationRef.current = animation;
      })
      .catch(() => {
        // The icon stays empty, as the chunk may be gone after a deployment: the page still works
      });

    return () => {
      isUnmounted = true;
      animation?.destroy();
      animationRef.current = null;
    };
  }, [containerRef, animationData]);

  return animationRef;
}
