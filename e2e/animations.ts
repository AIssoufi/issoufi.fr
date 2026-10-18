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
