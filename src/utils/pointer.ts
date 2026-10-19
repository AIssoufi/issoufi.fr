import { FINGER_POINTER_TYPE } from '../constants/pointer';

/**
 * Tells whether a pointer event comes from a finger on a touch screen, which hovers nothing. The
 * effects that follow the pointer leave it out, and listen to pointer events rather than to the
 * mouse events that a browser also sends after a tap: those moved the effects to the point tapped
 * and left them there, as a hover that sticks, until the next tap elsewhere.
 *
 * @param event - Pointer event, from the DOM or from React.
 * @returns `false` for a mouse, a pen, and an event without a `pointerType`.
 *
 * @example
 * window.addEventListener('pointermove', event => {
 *   if (isFingerPointer(event)) return;
 *   follow({ x: event.clientX, y: event.clientY });
 * });
 */
export const isFingerPointer = (event?: Pick<PointerEvent, 'pointerType'> | null): boolean =>
  event?.pointerType === FINGER_POINTER_TYPE;
