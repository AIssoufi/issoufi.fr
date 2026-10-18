import { REDUCED_MOTION_QUERY } from '../../theme/constants';
import { useMediaQuery } from '../useMediaQuery';

/**
 * Tells whether the visitor asked their system to reduce motion ({@link REDUCED_MOTION_QUERY}),
 * and renders again when they change the setting, so that the effects that move with the pointer
 * or loop in JavaScript can stand still. `GlobalStyle` stops the CSS animations itself.
 *
 * @returns `true` while the visitor prefers reduced motion; `false` otherwise, and where
 * `matchMedia` does not exist, as in jsdom.
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * useEffect(() => {
 *   if (prefersReducedMotion) return;
 *   // Start the animation loop
 * }, [prefersReducedMotion]);
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery({ query: REDUCED_MOTION_QUERY });
}
