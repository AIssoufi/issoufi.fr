import { toLinkText, toLinkUrl } from './links.mjs';

describe('toLinkUrl', () => {
  it.each([
    'https://issoufi.fr/en/',
    'http://localhost:4173',
    'mailto:adam@example.com',
    'tel:+33600000000',
  ])('keeps %s', url => {
    expect(toLinkUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://issoufi.fr',
    'issoufi.fr',
    '',
    '   ',
    undefined,
    null,
    42,
  ])('gives no link for %j', url => {
    expect(toLinkUrl(url)).toBe('');
  });
});

describe('toLinkText', () => {
  it.each([
    ['https://www.linkedin.com/in/issoufiadam', 'linkedin.com/in/issoufiadam'],
    ['https://www.linkedin.com/in/issoufiadam/', 'linkedin.com/in/issoufiadam'],
    ['https://github.com/AIssoufi', 'github.com/AIssoufi'],
    ['https://issoufi.fr/', 'issoufi.fr'],
    ['http://localhost:4173/en//', 'localhost:4173/en'],
  ])('writes %s as %s', (url, text) => {
    expect(toLinkText(url)).toBe(text);
  });

  it.each(['mailto:adam@example.com', 'tel:+33600000000', 'github.com', '', undefined, 42])(
    'gives no text for %j, which is not a web address',
    url => {
      expect(toLinkText(url)).toBe('');
    },
  );
});
