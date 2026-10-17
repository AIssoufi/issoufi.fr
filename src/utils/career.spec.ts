import { CAREER_START_DATE, getFullYearsSince, getYearsOfExperience } from './career';

describe('getFullYearsSince', () => {
  const start = new Date(2018, 5, 1);

  it('does not count the current year before the anniversary', () => {
    expect(getFullYearsSince(start, new Date(2026, 4, 31))).toBe(7);
  });

  it('counts the current year on the anniversary day', () => {
    expect(getFullYearsSince(start, new Date(2026, 5, 1))).toBe(8);
  });

  it('counts the current year after the anniversary', () => {
    expect(getFullYearsSince(start, new Date(2026, 5, 2))).toBe(8);
    expect(getFullYearsSince(start, new Date(2026, 9, 17))).toBe(8);
  });

  it('switches exactly at midnight on the anniversary', () => {
    expect(getFullYearsSince(start, new Date(2026, 4, 31, 23, 59, 59))).toBe(7);
    expect(getFullYearsSince(start, new Date(2026, 5, 1, 0, 0, 0))).toBe(8);
  });

  it('handles the turn of the year', () => {
    expect(getFullYearsSince(start, new Date(2025, 11, 31))).toBe(7);
    expect(getFullYearsSince(start, new Date(2026, 0, 1))).toBe(7);
  });

  it('returns 0 on the start date and during the first year', () => {
    expect(getFullYearsSince(start, new Date(2018, 5, 1))).toBe(0);
    expect(getFullYearsSince(start, new Date(2019, 4, 31))).toBe(0);
    expect(getFullYearsSince(start, new Date(2019, 5, 1))).toBe(1);
  });

  it('returns 0 when the date is before the start date', () => {
    expect(getFullYearsSince(start, new Date(2017, 0, 1))).toBe(0);
  });

  it('treats a 29 February start as reached on 1 March in non-leap years', () => {
    const leapStart = new Date(2020, 1, 29);
    expect(getFullYearsSince(leapStart, new Date(2021, 1, 28))).toBe(0);
    expect(getFullYearsSince(leapStart, new Date(2021, 2, 1))).toBe(1);
    expect(getFullYearsSince(leapStart, new Date(2024, 1, 29))).toBe(4);
  });
});

describe('getYearsOfExperience', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on 1 June 2018', () => {
    expect(CAREER_START_DATE).toEqual(new Date(2018, 5, 1));
  });

  it('computes the years from the career start date', () => {
    expect(getYearsOfExperience(new Date(2026, 4, 31))).toBe(7);
    expect(getYearsOfExperience(new Date(2026, 5, 1))).toBe(8);
  });

  it('defaults to the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 5, 1));
    expect(getYearsOfExperience()).toBe(12);
  });
});
