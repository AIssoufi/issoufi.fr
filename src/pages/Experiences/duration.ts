import type { TFunction } from 'i18next';

/** Zero-based month index of each French and English month name or abbreviation, lowercase. */
const MONTH_NAMES: Record<string, number> = {
  // French
  janv: 0,
  janvier: 0,
  févr: 1,
  février: 1,
  mars: 2,
  avr: 3,
  avril: 3,
  mai: 4,
  juin: 5,
  juil: 6,
  juillet: 6,
  août: 7,
  sept: 8,
  septembre: 8,
  oct: 9,
  octobre: 9,
  nov: 10,
  novembre: 10,
  déc: 11,
  décembre: 11,
  // English (oct and nov are shared with French)
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  october: 9,
  november: 10,
  dec: 11,
  december: 11,
};

/** End-date words meaning "until now", lowercase, in French and English. */
const TODAY_KEYWORDS = new Set(["aujourd'hui", 'auj.', 'auj', 'present', 'pres.', 'today']);

const MONTHS_PER_YEAR = 12;
const YEAR_PATTERN = /^\d{4}$/;

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

  const normalized = value.trim().toLowerCase();
  if (TODAY_KEYWORDS.has(normalized)) return new Date();

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
}

/**
 * Computes the time between two month-year dates in whole years and remaining months.
 * Days are ignored, so two dates in the same month give `{ years: 0, months: 0 }`.
 *
 * @returns The duration, or `null` when a date is missing or invalid, or when the end is before
 * the start, so that callers can simply render nothing.
 *
 * @example
 * computeDuration({ startDate: 'juin 2021', endDate: 'mars 2023' }); // { years: 1, months: 9 }
 * computeDuration({ startDate: 'foo 2021', endDate: 'mars 2023' }); // null
 */
export function computeDuration({ startDate, endDate }: ComputeDurationParams): Duration | null {
  const start = parseMonthYear(startDate);
  const end = parseMonthYear(endDate);
  if (start === null || end === null) return null;

  const isEndBeforeStart = end < start;
  if (isEndBeforeStart) return null;

  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * MONTHS_PER_YEAR + end.getMonth() - start.getMonth();
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
 * numbers are left out, and a duration shorter than a month gives "< 1 mois" or "< 1 month".
 *
 * @returns The formatted duration, or an empty string when there is no duration.
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
  return parts.join(' ') || t('exp.duration.lessThanAMonth');
}
