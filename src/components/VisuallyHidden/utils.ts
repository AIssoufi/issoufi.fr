import { VISUALLY_HIDDEN_ELEMENTS } from './constants.ts';
import type { VisuallyHiddenElement } from './types.ts';

/**
 * Tells whether a value is one of the {@link VISUALLY_HIDDEN_ELEMENTS}, written exactly, such as
 * `h2`.
 *
 * @param value - Element to check, which may come from anywhere at runtime.
 * @returns `false` for any other value, such as `div`, `H2` or `undefined`.
 *
 * @example
 * isVisuallyHiddenElement('h2'); // true
 * isVisuallyHiddenElement('div'); // false
 */
export const isVisuallyHiddenElement = (value: unknown): value is VisuallyHiddenElement =>
  VISUALLY_HIDDEN_ELEMENTS.some(element => element === value);
