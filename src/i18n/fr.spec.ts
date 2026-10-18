import { fr } from './fr';

/** A colon, semicolon, question or exclamation mark without a no-break space before it. */
const PUNCTUATION_WITHOUT_NO_BREAK_SPACE = /(^|[^\u00a0\u202f])[:;?!]/;
/** A colon after a narrow no-break space, instead of the full-width one French puts there. */
const NARROW_SPACE_BEFORE_COLON = /\u202f:/;
/** A semicolon, question or exclamation mark after a full-width no-break space, not a narrow one. */
const FULL_SPACE_BEFORE_SHORT_PUNCTUATION = /\u00a0[;?!]/;
/** A straight apostrophe, instead of the typographic one (’). */
const STRAIGHT_APOSTROPHE = /'/;

/** Parameters of {@link getEntries}. */
interface GetEntriesParams {
  /** A translation, or an object of nested translations. */
  value: unknown;
  /** Dotted key of `value`, empty at the root. */
  key?: string;
}

/** Lists every translation of a nested translations object, as `[dotted key, text]` pairs. */
const getEntries = ({ value, key = '' }: GetEntriesParams): [string, string][] => {
  if (typeof value === 'string') return [[key, value]];
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([childKey, child]) =>
    getEntries({ value: child, key: key ? `${key}.${childKey}` : childKey }),
  );
};

/** Keys of the French translations whose text matches a pattern. */
const getKeysMatching = (pattern: RegExp) =>
  getEntries({ value: fr })
    .filter(([, text]) => pattern.test(text))
    .map(([key]) => key);

describe('fr', () => {
  it('finds every nested translation', () => {
    expect(getEntries({ value: fr })).toContainEqual(['home.title2Pre', 'passionné par l’']);
  });

  it('uses typographic apostrophes only', () => {
    expect(getKeysMatching(STRAIGHT_APOSTROPHE)).toEqual([]);
    expect(fr.errors.backHome).toBe('Retour à l’accueil');
  });

  it('keeps colons, semicolons, question and exclamation marks on the line of their word', () => {
    expect(getKeysMatching(PUNCTUATION_WITHOUT_NO_BREAK_SPACE)).toEqual([]);
  });

  it('puts a full no-break space before a colon', () => {
    expect(getKeysMatching(NARROW_SPACE_BEFORE_COLON)).toEqual([]);
    expect(fr.exp.sewanLead.b3).toBe(
      'Accompagnement transverse\u00a0: onboarding, code review, debug et formation des équipes consommatrices',
    );
  });

  it('puts a narrow no-break space before a semicolon, a question or an exclamation mark', () => {
    expect(getKeysMatching(FULL_SPACE_BEFORE_SHORT_PUNCTUATION)).toEqual([]);
    expect(fr.exp.sewanLead.proj1B3).toBe(
      'npm + Lerna v4 → pnpm + Lerna v8\u202f; passage à TypeScript strict',
    );
  });
});

describe('getEntries', () => {
  it.each([
    ['a missing value', undefined],
    ['null', null],
    ['a number', 42],
    ['an empty object', {}],
  ])('finds no translation in %s', (_, value) => {
    expect(getEntries({ value })).toEqual([]);
  });

  it('uses the key of a translation at the root', () => {
    expect(getEntries({ value: 'Accueil', key: 'nav.home' })).toEqual([['nav.home', 'Accueil']]);
  });
});
