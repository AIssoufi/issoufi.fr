import { type RefObject, useEffect } from 'react';

import { INERT_ATTRIBUTE } from '../../constants';
import { getAncestorsInBody, getElementsOutside } from '../../utils';

/** Parameters of {@link useInertOutside}. */
interface UseInertOutsideParams {
  /** Element that stays reachable. Nothing is made inert while it is not mounted. */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether the rest of the page is inert. @default true */
  isActive?: boolean;
}

/**
 * Makes the whole page but a container inert while active, as a modal dialog does: `Tab` and
 * `Shift+Tab` only reach the elements of the container, clicks and screen readers ignore the
 * rest. Every element around the container gets the `inert` attribute (see
 * {@link getElementsOutside}), including the ones added meanwhile, such as a page loaded after the
 * container opened. Once inactive, or on unmount, the attribute is removed from the elements it
 * was added to; the elements that were already inert stay inert.
 */
export function useInertOutside({ containerRef, isActive = true }: UseInertOutsideParams): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!isActive || !container) return;

    const madeInert = new Set<Element>();
    const makeOutsideInert = () => {
      const reachableOutside = getElementsOutside(container).filter(
        element => !element.hasAttribute(INERT_ATTRIBUTE),
      );
      for (const element of reachableOutside) {
        element.setAttribute(INERT_ATTRIBUTE, '');
        madeInert.add(element);
      }
    };

    makeOutsideInert();
    const observer = new MutationObserver(makeOutsideInert);
    for (const ancestor of getAncestorsInBody(container)) {
      observer.observe(ancestor, { childList: true });
    }

    return () => {
      observer.disconnect();
      for (const element of madeInert) element.removeAttribute(INERT_ATTRIBUTE);
    };
  }, [containerRef, isActive]);
}
