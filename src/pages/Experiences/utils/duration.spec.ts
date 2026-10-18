import i18n from '../../../i18n';
import { fr } from '../../../i18n/fr';
import { computeDuration, formatDuration, parseMonthYear } from './duration';

describe('computeDuration', () => {
  describe('French month names', () => {
    it('computes full years and months', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'mars 2023' })).toEqual({
        years: 1,
        months: 9,
      });
    });

    it('computes exact years', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'juin 2023' })).toEqual({
        years: 2,
        months: 0,
      });
    });

    it('computes months only', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'sept. 2021' })).toEqual({
        years: 0,
        months: 3,
      });
    });

    it('handles abbreviated months', () => {
      expect(computeDuration({ startDate: 'janv 2020', endDate: 'mars 2020' })).toEqual({
        years: 0,
        months: 2,
      });
    });

    it('returns zero years and months for the same month', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'juin 2021' })).toEqual({
        years: 0,
        months: 0,
      });
    });
  });

  describe('English month names', () => {
    it('computes duration with English months', () => {
      expect(computeDuration({ startDate: 'june 2021', endDate: 'march 2023' })).toEqual({
        years: 1,
        months: 9,
      });
    });

    it('handles abbreviated English months', () => {
      expect(computeDuration({ startDate: 'jan 2020', endDate: 'mar 2020' })).toEqual({
        years: 0,
        months: 2,
      });
    });
  });

  describe('today keywords', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 17));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      "Aujourd'hui",
      'Aujourd’hui',
      'auj.',
      'auj',
      'Present',
      'pres.',
      'today',
      '  Present ',
    ])('counts up to now for %j', endDate => {
      expect(computeDuration({ startDate: 'juin 2025', endDate })).toEqual({
        years: 1,
        months: 4,
      });
    });
  });
});

describe('computeDuration edge cases', () => {
  it.each([
    ['a missing start', { endDate: 'juin 2022' }],
    ['a missing end', { startDate: 'juin 2021' }],
    ['no dates at all', {}],
    ['an empty start', { startDate: '', endDate: 'juin 2022' }],
    ['an unknown month', { startDate: 'foo 2021', endDate: 'juin 2022' }],
    ['a missing year', { startDate: 'juin', endDate: 'juin 2022' }],
    ['a two-digit year', { startDate: 'juin 21', endDate: 'juin 2022' }],
    ['extra words', { startDate: 'début juin 2021', endDate: 'juin 2022' }],
    ['an end before the start', { startDate: 'juin 2022', endDate: 'juin 2021' }],
  ])('returns null for %s', (_, params) => {
    expect(computeDuration(params)).toBeNull();
  });

  it('counts October and November in English', () => {
    expect(computeDuration({ startDate: 'October 2020', endDate: 'November 2020' })).toEqual({
      years: 0,
      months: 1,
    });
  });

  it('ignores case and extra spaces', () => {
    expect(computeDuration({ startDate: '  JUIN   2021 ', endDate: 'Juin 2022' })).toEqual({
      years: 1,
      months: 0,
    });
  });

  it('spans several years and months across a year boundary', () => {
    expect(computeDuration({ startDate: 'déc. 2019', endDate: 'janv. 2022' })).toEqual({
      years: 2,
      months: 1,
    });
  });
});

describe('formatDuration', () => {
  it.each([
    ['fr', { years: 1, months: 9 }, '1 an 9 mois'],
    ['fr', { years: 1, months: 0 }, '1 an'],
    ['fr', { years: 2, months: 0 }, '2 ans'],
    ['fr', { years: 0, months: 1 }, '1 mois'],
    ['fr', { years: 0, months: 3 }, '3 mois'],
    ['fr', { years: 2, months: 1 }, '2 ans 1 mois'],
    ['fr', { years: 0, months: 0 }, '< 1 mois'],
    ['en', { years: 1, months: 9 }, '1 year 9 months'],
    ['en', { years: 1, months: 0 }, '1 year'],
    ['en', { years: 2, months: 0 }, '2 years'],
    ['en', { years: 0, months: 1 }, '1 month'],
    ['en', { years: 0, months: 3 }, '3 months'],
    ['en', { years: 2, months: 1 }, '2 years 1 month'],
    ['en', { years: 0, months: 0 }, '< 1 month'],
  ])('formats in %s %j as %j', (language, duration, expected) => {
    expect(formatDuration({ duration, t: i18n.getFixedT(language) })).toBe(expected);
  });

  describe('edge cases', () => {
    const t = i18n.getFixedT('en');

    it.each([null, undefined])('returns an empty string for a %j duration', duration => {
      expect(formatDuration({ duration, t })).toBe('');
    });

    it('leaves out parts that are not positive numbers', () => {
      expect(formatDuration({ duration: { years: Number.NaN, months: 2 }, t })).toBe('2 months');
      expect(formatDuration({ duration: { years: 1, months: -3 }, t })).toBe('1 year');
    });

    it('formats a duration shorter than a month when no part is positive', () => {
      expect(formatDuration({ duration: { years: -1, months: Number.NaN }, t })).toBe('< 1 month');
    });
  });
});

describe('parseMonthYear', () => {
  it('parses French and English months, with or without a dot', () => {
    expect(parseMonthYear('sept. 2019')).toEqual(new Date(2019, 8, 1));
    expect(parseMonthYear('Sept 2019')).toEqual(new Date(2019, 8, 1));
    expect(parseMonthYear('août 2017')).toEqual(new Date(2017, 7, 1));
    expect(parseMonthYear('December 2020')).toEqual(new Date(2020, 11, 1));
  });

  it('returns the current date for a today keyword', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 17));

    expect(parseMonthYear("Aujourd'hui")).toEqual(new Date(2026, 9, 17));
    expect(parseMonthYear('Present')).toEqual(new Date(2026, 9, 17));

    vi.useRealTimers();
  });

  it('recognizes the end date of the current jobs in the French copy', () => {
    expect(parseMonthYear(fr.exp.sewanLead.end)).not.toBeNull();
    expect(parseMonthYear(fr.exp.sewanSenior.end)).not.toBeNull();
  });

  it.each([undefined, '', '   ', 'foo 2021', 'juin', '2021', 'juin 2021 bis', 'juin 20x1'])(
    'returns null for %j',
    value => {
      expect(parseMonthYear(value)).toBeNull();
    },
  );
});
