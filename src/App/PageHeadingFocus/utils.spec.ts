import { isLanguageSwitch } from './utils';

describe('isLanguageSwitch', () => {
  it.each([
    ['/projects', '/en/projects'],
    ['/en/projects', '/projects'],
    ['/', '/en/'],
    ['/en', '/'],
    ['/page-inconnue', '/en/page-inconnue'],
  ])('sees a language switch from %j to %j', (from, to) => {
    expect(isLanguageSwitch({ from, to })).toBe(true);
  });

  it.each([
    ['/', '/projects'],
    ['/projects', '/en/experiences'],
    ['/projects', '/projects'],
    ['/en/projects', '/en/projects'],
    ['/en/', '/en'],
  ])('sees no language switch from %j to %j', (from, to) => {
    expect(isLanguageSwitch({ from, to })).toBe(false);
  });

  it.each([undefined, null, '', 42])(
    'counts the path %j as the home page of the default language',
    path => {
      expect(isLanguageSwitch({ from: path, to: '/en/' })).toBe(true);
      expect(isLanguageSwitch({ from: path, to: '/' })).toBe(false);
    },
  );

  it('sees no language switch without any parameter', () => {
    expect(isLanguageSwitch()).toBe(false);
  });
});
