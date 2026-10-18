/**
 * Waits for the animations and transitions of an element and its content that come to an end, such
 * as the cards of a row shown whole or the links of the mobile menu sliding in, leaving out those
 * that loop forever, such as the particle field of the home page. A cancelled animation rejects its
 * promise: it has ended all the same. Runs in the browser, passed to `locator.evaluate`, so it uses
 * nothing from outside its own body.
 *
 * @param container - Element whose animations and those of its descendants are awaited.
 * @returns A promise that resolves once each ending animation has finished or been cancelled.
 *
 * @example
 * await page.getByRole('navigation').evaluate(waitForEndingAnimations);
 */
export const waitForEndingAnimations = async (container: Element): Promise<void> => {
  const animations = container.getAnimations({ subtree: true });
  const isEnding = (animation: Animation) =>
    animation.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY;
  await Promise.all(animations.filter(isEnding).map(({ finished }) => finished.catch(() => {})));
};

/**
 * Describes each animation and transition of an element and its content, pseudo-elements
 * included, that lasts longer than the given time, its delay included, such as one that loops
 * forever: its name, the keyframes of a CSS animation or the property of a CSS transition, the tag
 * of the element it moves, and when it ends. Runs in the browser, passed to `locator.evaluate`, so
 * it uses nothing from outside its own body.
 *
 * @param root - Element whose animations and those of its descendants are listed, such as `html`.
 * @param maxDurationMs - Longest time an animation may last, from its start to its end, in ms.
 * @returns One description per animation that ends later, in the order of the document; empty
 * when every animation ends in time, as with reduced motion.
 *
 * @example
 * await page.locator('html').evaluate(listLastingAnimations, 1);
 * // ['textFlow on <span>, ends after Infinity ms']
 */
export const listLastingAnimations = (root: Element, maxDurationMs: number): string[] =>
  root.getAnimations({ subtree: true }).flatMap(animation => {
    const effect = animation.effect as KeyframeEffect | null;
    const endTime = Number(effect?.getComputedTiming().endTime ?? 0);
    const endsInTime = endTime <= maxDurationMs;
    if (endsInTime) return [];

    // A CSS animation is named after its keyframes, a CSS transition after the property it changes
    const { animationName, transitionProperty } = animation as Partial<
      CSSAnimation & CSSTransition
    >;
    const name = animationName || transitionProperty || 'animation';
    const tag = effect?.target?.tagName.toLowerCase() ?? 'no element';
    const pseudoElement = effect?.pseudoElement ?? '';
    return [`${name} on <${tag}>${pseudoElement}, ends after ${endTime} ms`];
  });
