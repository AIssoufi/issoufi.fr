import { isNonBlankString } from './strings';

describe('isNonBlankString', () => {
  it.each(['/home.webp', 'a', ' padded ', '\tx\n'])('is true for %j', value => {
    expect(isNonBlankString(value)).toBe(true);
  });

  it.each(['', ' ', ' \t\n\r'])('is false for the blank string %j', value => {
    expect(isNonBlankString(value)).toBe(false);
  });

  it.each([undefined, null, 0, 42, NaN, true, {}, ['/home.webp'], () => 'a'])(
    'is false for %j, which is not a string',
    value => {
      expect(isNonBlankString(value)).toBe(false);
    },
  );
});
