import { useEffect } from 'react';

/**
 * Overflow of the root element while the page is locked: the page no longer scrolls, but keeps its
 * scroll position.
 */
const LOCKED_OVERFLOW = 'hidden';

/** Number of active locks, shared by every caller: the page scrolls again after the last one. */
let activeLockCount = 0;

/** Inline overflow of the root element before the first active lock, given back after the last. */
let overflowBeforeLocks = '';

/** Parameters of {@link useScrollLock}. */
interface UseScrollLockParams {
  /** Whether the page is locked. @default true */
  isActive?: boolean;
}

/**
 * Stops the page from scrolling while active, as under a full-screen menu: the wheel, a swipe or
 * the keyboard no longer move it, while what scrolls inside the menu still does. Sets the overflow
 * of the root element to {@link LOCKED_OVERFLOW}, which keeps the scroll position of the page.
 * Several locks may be active at once, released in any order: once the last one is inactive or
 * unmounted, the root element gets back the inline overflow it had before the first, so the page
 * scrolls again from where it was.
 */
export function useScrollLock({ isActive = true }: UseScrollLockParams = {}): void {
  useEffect(() => {
    if (!isActive) return;

    const { style } = document.documentElement;
    const isFirstLock = activeLockCount === 0;
    if (isFirstLock) overflowBeforeLocks = style.overflow;
    activeLockCount += 1;
    style.overflow = LOCKED_OVERFLOW;

    return () => {
      activeLockCount -= 1;
      const wasLastLock = activeLockCount === 0;
      if (wasLastLock) style.overflow = overflowBeforeLocks;
    };
  }, [isActive]);
}
