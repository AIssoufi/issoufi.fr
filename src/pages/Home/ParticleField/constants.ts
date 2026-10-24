import { theme } from '../../../theme/index.ts';

/**
 * Largest number of canvas pixels per CSS pixel: a screen of a higher device pixel ratio, such as
 * the 3 of a phone, draws at this one, so the dots stay sharp while the canvas holds 4 times the
 * pixels of the window rather than 9.
 */
export const MAX_PIXEL_RATIO = 2;

/** Window area per particle: one dot for every 11,000 px², so density stays constant. */
export const PARTICLE_AREA_PX2 = 11000;
/** Range of the initial speed on each axis, centered on 0, in pixels per frame. */
export const INITIAL_SPEED_RANGE_PX = 0.55;
/** Smallest dot radius. */
export const MIN_PARTICLE_RADIUS_PX = 0.4;
/** Spread of dot radii above the minimum. */
export const PARTICLE_RADIUS_RANGE_PX = 1.4;

/** Distance under which the mouse pushes a dot away. */
export const REPEL_DISTANCE_PX = 160;
/** Push added to the velocity of a dot right under the mouse, fading to 0 at the edge. */
export const REPEL_STRENGTH = 0.32;
/** Share of the velocity kept from one frame to the next. */
export const FRICTION = 0.96;

/** Distance under which two dots are linked by a line. */
export const LINK_DISTANCE_PX = 130;
/** Distance under which a dot is linked to the mouse. */
export const CURSOR_LINK_DISTANCE_PX = REPEL_DISTANCE_PX * 1.4;

/** Opacity of a link between two touching dots, fading with distance. */
export const LINK_MAX_OPACITY = 0.4;
/** Width of a link between two touching dots, thinning with distance. */
export const LINK_MAX_WIDTH_PX = 0.8;
/** Opacity of a link between the mouse and a dot right under it. */
export const CURSOR_LINK_MAX_OPACITY = 0.85;
/** Width of a link between the mouse and a dot right under it. */
export const CURSOR_LINK_MAX_WIDTH_PX = 1.5;

/** RGB channels of the link color (the accent plum), to build `rgba()` with a varying opacity. */
export const LINK_RGB = theme.colorChannels.accent;
/** Fill color of the dots. */
export const PARTICLE_COLOR = theme.colors['foreground-a65'];
