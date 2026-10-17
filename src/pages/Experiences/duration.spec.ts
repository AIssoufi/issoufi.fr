import { computeDuration } from './duration';

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
