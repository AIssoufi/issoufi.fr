import { useEffect } from 'react';

/**
 * Overflow of the root element while the page is locked: the page no longer scrolls, but keeps its
 * scroll position.
 */
const LOCKED_OVERFLOW = 'hidden';

/** Parameters of {@link useScrollLock}. */
interface UseScrollLockParams {
  /** Whether the page is locked. @default true */
  isActive?: boolean;
}

/**
 * Stops the page from scrolling while active, as under a full-screen menu: the wheel, a swipe or
 * the keyboard no longer move it, while what scrolls inside the menu still does. Sets the overflow
 * of the root element to {@link LOCKED_OVERFLOW}, which keeps the scroll position of the page. Once
 * inactive, or on unmount, gives the root element back the inline overflow it had before, so the
 * page scrolls again from where it was.
 */
export function useScrollLock({ isActive = true }: UseScrollLockParams = {}): void {
  useEffect(() => {
    if (!isActive) return;

    const { style } = document.documentElement;
    const previousOverflow = style.overflow;
    style.overflow = LOCKED_OVERFLOW;

    return () => {
      style.overflow = previousOverflow;
    };
  }, [isActive]);
}
