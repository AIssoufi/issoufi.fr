/**
 * Looks of a `Period`: `job` for the period column of a job, `role` for the smaller and dimmer one
 * of several roles at the same company, and `inline` for the header of a card, on one line.
 */
export const PERIOD_VARIANTS = ['job', 'role', 'inline'] as const;

/** Look of a `Period` when none, or one it does not have, is given. */
export const DEFAULT_PERIOD_VARIANT = 'job';

/** Mark that the screen shows between the dates of a period column, its dates stacked. */
export const COLUMN_PERIOD_MARK = '↓';

/** Mark that the screen shows between the dates of a period written on one line. */
export const INLINE_PERIOD_MARK = '–';
