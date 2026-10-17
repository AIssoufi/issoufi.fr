import { computeDuration } from './duration';

describe('computeDuration', () => {
  describe('French month names', () => {
    it('computes full years and months', () => {
      expect(computeDuration('juin 2021', 'mars 2023')).toBe('1 an 9 mois');
    });

    it('computes exact years', () => {
      expect(computeDuration('juin 2021', 'juin 2023')).toBe('2 ans');
    });

    it('computes months only', () => {
      expect(computeDuration('juin 2021', 'sept. 2021')).toBe('3 mois');
    });

    it('handles abbreviated months', () => {
      expect(computeDuration('janv 2020', 'mars 2020')).toBe('2 mois');
    });

    it('returns < 1 mois for same month', () => {
      expect(computeDuration('juin 2021', 'juin 2021')).toBe('< 1 mois');
    });
  });

  describe('English month names', () => {
    it('computes duration with English months', () => {
      expect(computeDuration('june 2021', 'march 2023')).toBe('1 an 9 mois');
    });

    it('handles abbreviated English months', () => {
      expect(computeDuration('jan 2020', 'mar 2020')).toBe('2 mois');
    });
  });

  describe('today keywords', () => {
    it("handles Aujourd'hui as end date", () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration(`juin ${startYear}`, "Aujourd'hui");
      expect(result).toMatch(/an|mois/);
    });

    it('handles present as end date', () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration(`june ${startYear}`, 'present');
      expect(result).toMatch(/an|mois/);
    });

    it('handles today as end date', () => {
      const now = new Date();
      const startYear = now.getFullYear() - 1;
      const result = computeDuration(`june ${startYear}`, 'today');
      expect(result).toMatch(/an|mois/);
    });
  });

  describe('singular vs plural', () => {
    it('uses "an" for 1 year', () => {
      expect(computeDuration('juin 2021', 'juin 2022')).toBe('1 an');
    });

    it('uses "ans" for 2+ years', () => {
      expect(computeDuration('juin 2020', 'juin 2022')).toBe('2 ans');
    });
  });
});
