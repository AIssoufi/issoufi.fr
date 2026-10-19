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

/** Options of {@link listLastingAnimations}, the argument that `locator.evaluate` passes to it. */
interface ListLastingAnimationsOptions {
  /** Longest time an animation may last, from its start to its end, its delay included, in ms. */
  maxDurationMs: number;
}

/**
 * Describes each animation and transition of an element and its content, pseudo-elements
 * included, that lasts longer than the given time, its delay included, such as one that loops
 * forever: its name, the keyframes of a CSS animation or the property of a CSS transition, the tag
 * of the element it moves, and when it ends. Runs in the browser, passed to `locator.evaluate`, so
 * it uses nothing from outside its own body.
 *
 * @param root - Element whose animations and those of its descendants are listed, such as `html`.
 * @param options - The argument that `locator.evaluate` passes after the element.
 * @returns One description per animation that ends later, in the order of the document; empty
 * when every animation ends in time, as with reduced motion.
 *
 * @example
 * await page.locator('html').evaluate(listLastingAnimations, { maxDurationMs: 1 });
 * // ['textFlow on <span>, ends after Infinity ms']
 */
export const listLastingAnimations = (
  root: Element,
  { maxDurationMs }: ListLastingAnimationsOptions,
): string[] =>
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

/** Options of {@link recordLargestShift}, the argument that `locator.evaluateAll` passes to it. */
interface RecordLargestShiftOptions {
  /** Number of animation frames to wait, at the end of each of which the elements are measured. */
  frameCount: number;
}

/**
 * Waits a number of animation frames and returns the largest distance that an element stood from
 * its place at the end of any of them: the offset of the translation of its inline `transform`,
 * such as the `translate()` that `SplitWords` writes on each word of the home title, without the
 * animations of its parents. Counting frames rather than milliseconds measures as many steps of a
 * `requestAnimationFrame` loop on a loaded machine, which draws fewer frames per second. Runs in
 * the browser, passed to `locator.evaluateAll`, so it uses nothing from outside its own body.
 *
 * @param elements - Elements to measure, such as the words of a title.
 * @param options - The argument that `locator.evaluateAll` passes after the elements.
 * @returns The largest shift, in px; `0` without any element, without any frame, or when no
 * element has a translation.
 *
 * @example
 * await page.getByRole('heading', { level: 1 }).locator(HERO_WORD_SELECTOR)
 *   .evaluateAll(recordLargestShift, { frameCount: 4 });
 * // 0
 */
export const recordLargestShift = async (
  elements: Element[],
  { frameCount }: RecordLargestShiftOptions,
): Promise<number> => {
  let largestShift = 0;
  for (let frame = 0; frame < frameCount; frame += 1) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    for (const element of elements) {
      const transform = (element as HTMLElement).style?.transform ?? '';
      const { e: x, f: y } = new DOMMatrixReadOnly(transform);
      largestShift = Math.max(largestShift, Math.hypot(x, y));
    }
  }
  return largestShift;
};
