import { formatSiteVersion } from './utils';

describe('formatSiteVersion', () => {
  it('writes the name of the site, then its version after a v', () => {
    expect(formatSiteVersion({ siteName: 'issoufi.fr', version: '1.0.0' })).toBe(
      'issoufi.fr v1.0.0',
    );
  });

  it.each([
    ['v1.0.0', 'issoufi.fr v1.0.0'],
    ['V1.0.0', 'issoufi.fr v1.0.0'],
    ['  1.0.0  ', 'issoufi.fr v1.0.0'],
    [' v 1.0.0', 'issoufi.fr v1.0.0'],
    ['2.0.0-beta.1', 'issoufi.fr v2.0.0-beta.1'],
    ['10.20.30', 'issoufi.fr v10.20.30'],
  ])('writes the version %j with a single v', (version, expected) => {
    expect(formatSiteVersion({ siteName: 'issoufi.fr', version })).toBe(expected);
  });

  it('trims the name of the site', () => {
    expect(formatSiteVersion({ siteName: '  issoufi.fr ', version: '1.0.0' })).toBe(
      'issoufi.fr v1.0.0',
    );
  });

  describe('edge cases', () => {
    it.each([undefined, null, '', '   ', 'v', ' V ', 1, Number.NaN, {}, ['1.0.0']])(
      'writes the name of the site alone when the version is %j',
      version => {
        expect(formatSiteVersion({ siteName: 'issoufi.fr', version: version as never })).toBe(
          'issoufi.fr',
        );
      },
    );

    it.each([undefined, null, '', '  ', 42])(
      'writes the version alone when the name of the site is %j',
      siteName => {
        expect(formatSiteVersion({ siteName: siteName as never, version: '1.0.0' })).toBe('v1.0.0');
      },
    );

    it('returns an empty text when both are missing', () => {
      expect(formatSiteVersion({})).toBe('');
      expect(formatSiteVersion()).toBe('');
    });
  });
});
