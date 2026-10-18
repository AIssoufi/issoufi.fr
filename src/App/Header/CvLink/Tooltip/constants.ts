/**
 * Sides of its trigger on which a tooltip can show, centered on it: `left` for a trigger that
 * stands against the right edge of the screen, `top` for one with something under it.
 */
export const TOOLTIP_PLACEMENTS = ['left', 'top'] as const;

/** Side of its trigger on which a tooltip shows when none is given, or an unknown one. */
export const DEFAULT_TOOLTIP_PLACEMENT = 'top';
