// @vitest-environment node
import { escapeRegExp } from './strings.ts';

describe('escapeRegExp', () => {
  it.each([
    ['home.webp', String.raw`home\.webp`],
    ['logo (1)+[v2].png', String.raw`logo \(1\)\+\[v2\]\.png`],
    ['a*b?c^d$e{f}g|h', String.raw`a\*b\?c\^d\$e\{f\}g\|h`],
    [String.raw`back\slash`, String.raw`back\\slash`],
  ])('escapes %j', (text, expected) => {
    expect(escapeRegExp(text)).toBe(expected);
  });

  it('builds a regular expression that matches the text itself, and only it', () => {
    const pattern = new RegExp(`^${escapeRegExp('CV - Adam (2026).pdf')}$`);

    expect(pattern.test('CV - Adam (2026).pdf')).toBe(true);
    expect(pattern.test('CV - Adam 2026Xpdf')).toBe(false);
  });

  describe('edge cases', () => {
    it.each(['', 'home', 'CV - Adam Issoufi', '/assets/home-1a2b'])(
      'leaves %j, which has no special character, as it is',
      text => {
        expect(escapeRegExp(text)).toBe(text);
      },
    );
  });
});
