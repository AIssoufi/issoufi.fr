import { fr } from './fr.ts';
import { getEntries } from './testUtils.ts';

/**
 * A colon, semicolon, question or exclamation mark with neither a no-break space nor another mark
 * (as in "?!") before it.
 */
const PUNCTUATION_WITHOUT_NO_BREAK_SPACE = /(^|[^\u00a0\u202f:;?!])[:;?!]/;
/** A colon after a narrow no-break space, instead of the full-width one French puts there. */
const NARROW_SPACE_BEFORE_COLON = /\u202f:/;
/** A semicolon, question or exclamation mark after a full-width no-break space, not a narrow. */
const FULL_SPACE_BEFORE_SHORT_PUNCTUATION = /\u00a0[;?!]/;
/** A straight apostrophe, instead of the typographic one (’). */
const STRAIGHT_APOSTROPHE = /'/;

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

describe('PUNCTUATION_WITHOUT_NO_BREAK_SPACE', () => {
  it.each([
    'Vraiment\u202f?!',
    'Quoi\u202f!?',
    'transverse\u00a0: store',
    'Cette page n’existe pas.',
  ])('accepts %j', text => {
    expect(text).not.toMatch(PUNCTUATION_WITHOUT_NO_BREAK_SPACE);
  });

  it.each([':début', 'transverse: store', 'transverse : store', 'Vraiment?!', 'Vraiment ?!'])(
    'catches %j',
    text => {
      expect(text).toMatch(PUNCTUATION_WITHOUT_NO_BREAK_SPACE);
    },
  );
});
