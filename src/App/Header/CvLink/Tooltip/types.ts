import type { TOOLTIP_PLACEMENTS } from './constants';

/** Side of its trigger on which a tooltip shows, one of {@link TOOLTIP_PLACEMENTS}. */
export type TooltipPlacement = (typeof TOOLTIP_PLACEMENTS)[number];
