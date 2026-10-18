// @vitest-environment node
import { CV_SOURCES } from '../testUtils';
import { getCvFingerprint } from './fingerprint.mjs';
import { buildCvContents } from './languages.mjs';

const [FRENCH_CV, ENGLISH_CV] = await buildCvContents(CV_SOURCES);

describe('getCvFingerprint', () => {
  it('gives a SHA-256 hash, in hexadecimal', () => {
    expect(getCvFingerprint(FRENCH_CV)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gives the same fingerprint to the same content', async () => {
    const [frenchAgain] = await buildCvContents(CV_SOURCES);

    expect(getCvFingerprint(frenchAgain)).toBe(getCvFingerprint(FRENCH_CV));
  });

  it('gives each language its own fingerprint', () => {
    expect(getCvFingerprint(ENGLISH_CV)).not.toBe(getCvFingerprint(FRENCH_CV));
  });

  it('changes when a text is shortened, which a search of the text of the PDF would miss', () => {
    const shortened = { ...FRENCH_CV, subtitle: FRENCH_CV.subtitle.slice(0, -1) };

    expect(getCvFingerprint(shortened)).not.toBe(getCvFingerprint(FRENCH_CV));
  });

  it('changes when two texts swap places', () => {
    const [first, second, ...others] = FRENCH_CV.contacts;
    const swapped = { ...FRENCH_CV, contacts: [second, first, ...others] };

    expect(getCvFingerprint(swapped)).not.toBe(getCvFingerprint(FRENCH_CV));
  });
});
