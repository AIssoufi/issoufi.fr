import type { PERIOD_VARIANTS } from './constants.ts';

/** Look of a `Period`, one of {@link PERIOD_VARIANTS}. */
export type PeriodVariant = (typeof PERIOD_VARIANTS)[number];
