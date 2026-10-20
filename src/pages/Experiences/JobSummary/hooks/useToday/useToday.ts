import { useIsHydrated } from '../../../../../hooks/useIsHydrated/index.ts';
import { BUILD_MONTH_START } from './constants.ts';

/**
 * Returns the date that the durations up to "today" count to: the month of the build in the page
 * that it renders, and while the browser hydrates that page, so that it shows the same durations,
 * then the current date of the visitor (see {@link useIsHydrated}).
 *
 * @returns The first day of the month of the build at build time and during the hydration, the
 * current date otherwise.
 *
 * @example
 * const today = useToday();
 * computeDuration({ startDate: 'juin 2021', endDate: 'Present', today });
 */
export function useToday(): Date {
  const isHydrated = useIsHydrated();
  return isHydrated ? new Date() : BUILD_MONTH_START;
}
