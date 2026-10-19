import { CV_URLS } from './constants.ts';
import { getCvUrl } from './utils.ts';

describe('getCvUrl', () => {
  it.each([
    ['fr', '/CV - Adam Issoufi.pdf'],
    ['en', '/CV - Adam Issoufi (EN).pdf'],
  ])('gives the CV written in %s', (language, url) => {
    expect(getCvUrl(language)).toBe(url);
  });

  it.each([undefined, null, '', 'de', 'EN', 'en-US', 42, {}])(
    'gives the French CV, in the default language, for %j',
    language => {
      expect(getCvUrl(language)).toBe('/CV - Adam Issoufi.pdf');
    },
  );
});

describe('CV_URLS', () => {
  it('gives each language its own file', () => {
    const urls = Object.values(CV_URLS);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
