/**
 * First day of the professional career: 1 June 2018, start of the Supralog apprenticeship,
 * followed by continuous employment. Single source for every years-of-experience figure.
 *
 * @remarks The month is zero-based: `5` is June.
 */
export const CAREER_START_DATE = new Date(2018, 5, 1);

/**
 * Counts the full years elapsed since a date, like an age.
 * The current year only counts once the anniversary day is reached, and a 29 February start
 * is reached on 1 March in non-leap years.
 *
 * @param start - First day of the period.
 * @param now - Date to measure up to. Defaults to the current date.
 * @returns Number of full years, never negative.
 *
 * @example
 * getFullYearsSince(new Date(2018, 5, 1), new Date(2026, 4, 31)); // 7
 * getFullYearsSince(new Date(2018, 5, 1), new Date(2026, 5, 1)); // 8
 */
export function getFullYearsSince(start: Date, now: Date = new Date()): number {
  const years = now.getFullYear() - start.getFullYear();
  const anniversaryReached =
    now.getMonth() > start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());

  return Math.max(0, anniversaryReached ? years : years - 1);
}

/**
 * Counts the full years of professional experience since {@link CAREER_START_DATE}.
 * Used at build time for the static meta tags and at runtime by `DocumentMeta`.
 *
 * @param now - Date to measure up to. Defaults to the current date.
 * @returns Number of full years of experience.
 *
 * @example
 * getYearsOfExperience(new Date(2026, 9, 17)); // 8
 */
export function getYearsOfExperience(now: Date = new Date()): number {
  return getFullYearsSince(CAREER_START_DATE, now);
}
