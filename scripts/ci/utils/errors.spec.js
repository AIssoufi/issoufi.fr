import { getErrorMessage } from './errors.mjs';

describe('getErrorMessage', () => {
  it('reads the message of an error', () => {
    expect(getErrorMessage(new Error('The GitHub API answered 500'))).toBe(
      'The GitHub API answered 500',
    );
  });

  it('reads the empty message of an error as it is', () => {
    expect(getErrorMessage(new Error(''))).toBe('');
  });

  it.each([
    ['a text', 'offline', 'offline'],
    ['undefined', undefined, 'undefined'],
    ['null', null, 'null'],
    ['an object', { code: 1 }, '[object Object]'],
  ])('writes %s that is not an error as text', (_case, error, expected) => {
    expect(getErrorMessage(error)).toBe(expected);
  });
});
