import { formatVersion } from './utils';

describe('formatVersion', () => {
  it('writes the version after a v', () => {
    expect(formatVersion('1.0.0')).toBe('v1.0.0');
  });

  it.each([
    ['v1.0.0', 'v1.0.0'],
    ['V1.0.0', 'v1.0.0'],
    ['  1.0.0  ', 'v1.0.0'],
    [' v 1.0.0', 'v1.0.0'],
    ['2.0.0-beta.1', 'v2.0.0-beta.1'],
    ['10.20.30', 'v10.20.30'],
  ])('writes the version %j with a single v', (version, expected) => {
    expect(formatVersion(version)).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([undefined, null, '', '   ', 'v', ' V ', 1, Number.NaN, {}, ['1.0.0']])(
      'returns an empty text for the version %j',
      version => {
        expect(formatVersion(version as never)).toBe('');
      },
    );

    it('returns an empty text without a version', () => {
      expect(formatVersion()).toBe('');
    });
  });
});
