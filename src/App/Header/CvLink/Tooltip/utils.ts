import { TOOLTIP_PLACEMENTS } from './constants';
import type { TooltipPlacement } from './types';

/**
 * Tells whether a value is one of the {@link TOOLTIP_PLACEMENTS}, written exactly, such as `left`.
 *
 * @param value - Placement to check, which may come from anywhere at runtime.
 * @returns `false` for any other value, such as `right`, `LEFT` or `undefined`.
 *
 * @example
 * isTooltipPlacement('left'); // true
 * isTooltipPlacement('right'); // false
 */
export const isTooltipPlacement = (value: unknown): value is TooltipPlacement =>
  TOOLTIP_PLACEMENTS.some(placement => placement === value);
