import { en } from './en';
import { fr } from './fr';
import { getMissingKeys } from './testUtils';

describe('en', () => {
  it('translates every key of the French translations', () => {
    const missingKeys = getMissingKeys({ translations: en, reference: fr });

    expect(missingKeys, 'keys of fr.ts missing from en.ts').toEqual([]);
  });

  it('has no key that the French translations lack', () => {
    const extraKeys = getMissingKeys({ translations: fr, reference: en });

    expect(extraKeys, 'keys of en.ts missing from fr.ts').toEqual([]);
  });
});
