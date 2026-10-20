import type { VISUALLY_HIDDEN_ELEMENTS } from './constants.ts';

/** Element that a `VisuallyHidden` text can be, one of {@link VISUALLY_HIDDEN_ELEMENTS}. */
export type VisuallyHiddenElement = (typeof VISUALLY_HIDDEN_ELEMENTS)[number];
