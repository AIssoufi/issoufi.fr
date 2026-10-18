import { PERIOD_VARIANTS } from './constants';
import type { PeriodVariant } from './types';

/**
 * Tells whether a value is one of the {@link PERIOD_VARIANTS}, written exactly, such as `role`.
 *
 * @param value - Look to check, which may come from anywhere at runtime.
 * @returns `false` for any other value, such as `Role`, `toString` or `undefined`.
 *
 * @example
 * isPeriodVariant('inline'); // true
 * isPeriodVariant('column'); // false
 */
export const isPeriodVariant = (value: unknown): value is PeriodVariant =>
  PERIOD_VARIANTS.some(variant => variant === value);
