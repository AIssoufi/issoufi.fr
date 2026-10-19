import type { CDPSession } from '@playwright/test';

import { SCROLL_GESTURE_DISTANCE_PX, SCROLL_GESTURE_SPEED_PX_PER_S } from './constants.ts';

/**
 * DevTools protocol session of a page, from `page.context().newCDPSession(page)`. Only its `send`
 * is used, so the tests can pass a fake one.
 */
type ProtocolSession = Pick<CDPSession, 'send'>;

/**
 * Device that scrolls: the wheel of a mouse, or a finger on a touch screen, which needs a browser
 * context created with `hasTouch`.
 */
export type ScrollGestureSource = 'mouse' | 'touch';

/** Parameters of {@link scrollDownWithGesture}. */
interface ScrollDownWithGestureParams {
  /** Session of the page to scroll. */
  session: ProtocolSession;
  /** Distance from the left edge of the screen to the point where the gesture starts, in pixels. */
  x: number;
  /** Distance from the top edge of the screen to the point where the gesture starts, in pixels. */
  y: number;
  /** Device of the gesture: a wheel scroll with `mouse`, a swipe with `touch`. */
  source: ScrollGestureSource;
  /**
   * Distance to scroll down, in pixels. A negative distance scrolls up.
   * @default SCROLL_GESTURE_DISTANCE_PX
   */
  distancePx?: number;
}

/**
 * Scrolls down at a point of the screen as a visitor would, with the wheel of a mouse or a swipe,
 * through the DevTools protocol (`Input.synthesizeScrollGesture`): whatever is under that point
 * scrolls, or the page when it does not, unless something stops it. Unlike `mouse.wheel` of
 * Playwright, which returns before the page scrolls, it resolves once the gesture has ended and
 * its scrolling is done, so that a test can check at once that nothing moved.
 *
 * @returns A promise that resolves once the gesture has ended.
 * @throws Rejects with a `RangeError`, without sending anything, when the point or the distance is
 * not a finite number, and with the error of the protocol when it refuses the gesture, as for a
 * swipe in a browser context without touch.
 *
 * @example
 * const session = await page.context().newCDPSession(page);
 * await scrollDownWithGesture({ session, x: 187, y: 333, source: 'touch' });
 */
export const scrollDownWithGesture = async ({
  session,
  x,
  y,
  source,
  distancePx = SCROLL_GESTURE_DISTANCE_PX,
}: ScrollDownWithGestureParams): Promise<void> => {
  // The protocol would refuse them with a vaguer error, or scroll by a wrong distance
  const invalidValues = Object.entries({ x, y, distancePx })
    .filter(([, value]) => !Number.isFinite(value))
    .map(([name, value]) => `${name}: ${String(value)}`);
  if (invalidValues.length > 0) {
    throw new RangeError(`Scroll gesture with invalid values (${invalidValues.join(', ')})`);
  }

  await session.send('Input.synthesizeScrollGesture', {
    x,
    y,
    // The content follows the finger: moving it up by the distance scrolls the page down
    yDistance: -distancePx,
    gestureSourceType: source,
    speed: SCROLL_GESTURE_SPEED_PX_PER_S,
  });
};
