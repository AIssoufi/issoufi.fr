// @vitest-environment node
import { isFileName } from './strings.ts';

describe('isFileName', () => {
  it.each(['home.webp', 'CV - Adam Issoufi.pdf', 'a', ' padded.png '])('is true for %j', value => {
    expect(isFileName(value)).toBe(true);
  });

  describe('edge cases', () => {
    it.each(['', '   ', '\t\n'])('is false for the empty or blank name %j', value => {
      expect(isFileName(value)).toBe(false);
    });

    it.each([undefined, null, 42, {}, ['home.webp']])('is false for %j', value => {
      expect(isFileName(value)).toBe(false);
    });
  });
});
