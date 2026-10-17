import { computeDuration, parseMonthYear } from './duration';

describe('computeDuration', () => {
  describe('French month names', () => {
    it('computes full years and months', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'mars 2023' })).toBe('1 an 9 mois');
    });

    it('computes exact years', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'juin 2023' })).toBe('2 ans');
    });

    it('computes months only', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'sept. 2021' })).toBe('3 mois');
    });

    it('handles abbreviated months', () => {
      expect(computeDuration({ startDate: 'janv 2020', endDate: 'mars 2020' })).toBe('2 mois');
    });

    it('returns < 1 mois for same month', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'juin 2021' })).toBe('< 1 mois');
    });
  });

  describe('English month names', () => {
    it('computes duration with English months', () => {
      expect(computeDuration({ startDate: 'june 2021', endDate: 'march 2023' })).toBe(
        '1 an 9 mois',
      );
    });

    it('handles abbreviated English months', () => {
      expect(computeDuration({ startDate: 'jan 2020', endDate: 'mar 2020' })).toBe('2 mois');
    });
  });

  describe('today keywords', () => {
    it("handles Aujourd'hui as end date", () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration({ startDate: `juin ${startYear}`, endDate: "Aujourd'hui" });
      expect(result).toMatch(/an|mois/);
    });

    it('handles present as end date', () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration({ startDate: `june ${startYear}`, endDate: 'present' });
      expect(result).toMatch(/an|mois/);
    });

    it('handles today as end date', () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration({ startDate: `june ${startYear}`, endDate: 'today' });
      expect(result).toMatch(/an|mois/);
    });
  });

  describe('singular vs plural', () => {
    it('uses "an" for 1 year', () => {
      expect(computeDuration({ startDate: 'juin 2021', endDate: 'juin 2022' })).toBe('1 an');
    });

    it('uses "ans" for 2+ years', () => {
      expect(computeDuration({ startDate: 'juin 2020', endDate: 'juin 2022' })).toBe('2 ans');
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
  ])('returns an empty string for %s', (_, params) => {
    expect(computeDuration(params)).toBe('');
  });

  it('counts October and November in English', () => {
    expect(computeDuration({ startDate: 'October 2020', endDate: 'November 2020' })).toBe('1 mois');
  });

  it('ignores case and extra spaces', () => {
    expect(computeDuration({ startDate: '  JUIN   2021 ', endDate: 'Juin 2022' })).toBe('1 an');
  });

  it('spans several years and months across a year boundary', () => {
    expect(computeDuration({ startDate: 'déc. 2019', endDate: 'janv. 2022' })).toBe('2 ans 1 mois');
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

  it.each([undefined, '', '   ', 'foo 2021', 'juin', '2021', 'juin 2021 bis', 'juin 20x1'])(
    'returns null for %j',
    value => {
      expect(parseMonthYear(value)).toBeNull();
    },
  );
});
