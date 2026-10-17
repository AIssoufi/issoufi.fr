import { theme } from '../../theme';
import type { Point } from './types';

/** Absolute URL of the home page's background photo, served from `public/`. */
export const BACKGROUND_IMAGE_URL = '/home.webp';

/** Pointer position used while the mouse is outside the window, far from every element. */
export const OFFSCREEN_POINTER: Point = { x: -9999, y: -9999 };

/** Initial position of the cursor glow, just outside the top-left corner until the mouse moves. */
export const CURSOR_GLOW_START: Point = { x: -100, y: -100 };
/** Fraction of the remaining distance to the pointer that the glow covers on each frame. */
export const CURSOR_GLOW_EASING = 0.1;
/** Half the size of the glow element, to center it on the pointer. */
export const CURSOR_GLOW_RADIUS_PX = 20;

/** Largest shift of the home content when the pointer is at a window edge. */
export const PARALLAX_MAX_OFFSET_PX: Point = { x: 10, y: 7 };
/** Duration of the return to the center when the pointer leaves the window. */
export const PARALLAX_RESET_DURATION_MS = 900;

/** Fraction of the distance between the pointer and a button's center that the button follows. */
export const MAGNET_STRENGTH = 0.4;
/** Transition while a magnetic button follows the pointer. */
export const MAGNET_FOLLOW_TRANSITION = `transform ${theme.durations[100]} ${theme.timingFunctions.standard}`;

/** Easing of the slow returns to rest (parallax and magnetic buttons). */
export const RELEASE_EASING = theme.timingFunctions.out;
/** Transition of a magnetic button returning to its place. */
export const MAGNET_RELEASE_TRANSITION = `transform ${theme.durations[700]} ${RELEASE_EASING}`;
