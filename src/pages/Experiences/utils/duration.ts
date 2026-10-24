import type { TFunction } from 'i18next';

import { MONTH_NAMES, MONTHS_PER_YEAR, TODAY_KEYWORDS, YEAR_PATTERN } from '../constants.ts';

/**
 * Tells whether a date of the experience data is a word for "until now", such as "Aujourd'hui" or
 * "Present", ignoring case and extra spaces.
 */
const isTodayKeyword = (value: string) => TODAY_KEYWORDS.has(value.trim().toLowerCase());

/**
 * Parses a month-year date such as "juin 2021", "Sept. 2019" or "June 2021", ignoring case and
 * extra spaces, or a "today" keyword such as "Aujourd'hui" or "Present".
 *
 * @param value - The date as written in the experience data.
 * @returns The first day of that month, the current date for a today keyword, or `null` when the
 * value is missing or cannot be parsed (unknown month, missing or malformed year, extra words).
 *
 * @example
 * parseMonthYear('Sept. 2019'); // 1 September 2019
 * parseMonthYear('foo 2021'); // null
 */
export function parseMonthYear(value: string | undefined): Date | null {
  if (typeof value !== 'string') return null;

  if (isTodayKeyword(value)) return new Date();

  const normalized = value.trim().toLowerCase();
  const [rawMonth = '', rawYear = '', ...extraWords] = normalized.split(/\s+/);
  const month = MONTH_NAMES[rawMonth.replace('.', '')];
  const isKnownMonth = month !== undefined;
  const isFourDigitYear = YEAR_PATTERN.test(rawYear);
  const hasOnlyMonthAndYear = extraWords.length === 0;

  if (!isKnownMonth || !isFourDigitYear || !hasOnlyMonthAndYear) return null;
  return new Date(Number(rawYear), month, 1);
}

/** Time between two month-year dates, in whole years and remaining months. */
export interface Duration {
  /** Whole years, `0` or more. */
  years: number;
  /** Months left after the whole years, from `0` to `11`. */
  months: number;
}

/** Parameters of {@link computeDuration}. */
interface ComputeDurationParams {
  /** Start as a French or English month and a year, e.g. "juin 2021" or "June 2021". */
  startDate?: string;
  /** End in the same format, or a "today" keyword such as "Aujourd'hui" or "Present". */
  endDate?: string;
  /**
   * Date that a "today" keyword stands for, such as the month of the build in the page that it
   * renders (see `useToday`).
   * @default new Date()
   */
  today?: Date;
}

/**
 * Computes the time between two month-year dates in whole years and remaining months, from the
 * first day of the start month to the last day of the end month, as LinkedIn counts it: both
 * months count, so two dates in the same month give `{ years: 0, months: 1 }`. Days are ignored,
 * and a "today" keyword counts the month of `today` as a whole.
 *
 * @returns The duration, or `null` when a date is missing or invalid, a "today" keyword included
 * when `today` is an invalid date, or when the end month is before the start month, so that
 * callers can simply render nothing.
 *
 * @example
 * computeDuration({ startDate: 'juin 2021', endDate: 'mars 2023' }); // { years: 1, months: 10 }
 * computeDuration({ startDate: 'foo 2021', endDate: 'mars 2023' }); // null
 * computeDuration({ startDate: 'juin 2021', endDate: 'Present', today: new Date(2023, 2, 15) });
 * // { years: 1, months: 10 }
 */
export function computeDuration({
  startDate,
  endDate,
  today = new Date(),
}: ComputeDurationParams): Duration | null {
  // An invalid date of today would give a duration of `NaN` years
  const isValidToday = today instanceof Date && !Number.isNaN(today.getTime());
  /** Parses a date, a "today" keyword standing for `today`, and for no date when it is invalid. */
  const toDate = (value?: string) => {
    const isToday = typeof value === 'string' && isTodayKeyword(value);
    if (!isToday) return parseMonthYear(value);
    return isValidToday ? today : null;
  };
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (start === null || end === null) return null;

  const monthsBetweenFirstDays =
    (end.getFullYear() - start.getFullYear()) * MONTHS_PER_YEAR + end.getMonth() - start.getMonth();
  const isEndBeforeStart = monthsBetweenFirstDays < 0;
  if (isEndBeforeStart) return null;

  // The end month counts as a whole, up to its last day
  const totalMonths = monthsBetweenFirstDays + 1;
  return {
    years: Math.floor(totalMonths / MONTHS_PER_YEAR),
    months: totalMonths % MONTHS_PER_YEAR,
  };
}

/** Parameters of {@link formatDuration}. */
interface FormatDurationParams {
  /** The duration to format, as returned by {@link computeDuration}. Nothing when missing. */
  duration?: Duration | null;
  /** Translation function of the active language, from `useTranslation`. */
  t: TFunction;
}

/**
 * Formats a duration in the active language with the `exp.duration` plurals,
 * e.g. "1 an 9 mois" in French or "1 year 9 months" in English. Parts that are not positive
 * numbers are left out.
 *
 * @returns The formatted duration, or an empty string when there is no duration or no part is a
 * positive number (a zero, negative or invalid duration), so that callers render nothing.
 *
 * @example
 * formatDuration({ duration: { years: 1, months: 9 }, t }); // '1 year 9 months' in English
 * formatDuration({ duration: null, t }); // ''
 */
export function formatDuration({ duration, t }: FormatDurationParams): string {
  if (!duration) return '';

  const { years, months } = duration;
  const parts: string[] = [];
  if (years > 0) parts.push(t('exp.duration.years', { count: years }));
  if (months > 0) parts.push(t('exp.duration.months', { count: months }));
  return parts.join(' ');
}
