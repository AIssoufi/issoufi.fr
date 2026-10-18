import type { AnimationItem } from 'lottie-web';
import { type RefObject, useEffect, useState } from 'react';

/** Parameters of {@link useLottieAnimation}. */
interface UseLottieAnimationParams {
  /** Element the animation is drawn into. Nothing is loaded while it is not mounted. */
  containerRef: RefObject<HTMLElement | null>;
  /** Animation exported from After Effects, as JSON. Keep it stable: a new value draws it again. */
  animationData?: unknown;
}

/**
 * Draws a Lottie animation into an element as an SVG, paused on its first frame, and returns it
 * for playback. lottie-web, in its light build (SVG only, no expressions), is loaded after the
 * first render, from its own chunk, so it never delays the page. The component renders again
 * once the animation is drawn. The animation is destroyed on unmount, and never drawn when the
 * component unmounts before lottie-web is loaded.
 *
 * @returns The animation, `null` until it is drawn, and for good if lottie-web fails to load.
 */
export function useLottieAnimation({
  containerRef,
  animationData,
}: UseLottieAnimationParams): AnimationItem | null {
  const [animation, setAnimation] = useState<AnimationItem | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isUnmounted = false;
    let loadedAnimation: AnimationItem | undefined;

    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (isUnmounted) return;

        loadedAnimation = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData,
        });
        setAnimation(loadedAnimation);
      })
      .catch(() => {
        // The icon stays empty, as the chunk may be gone after a deployment: the page still works
      });

    return () => {
      isUnmounted = true;
      loadedAnimation?.destroy();
      setAnimation(null);
    };
  }, [containerRef, animationData]);

  return animation;
}
