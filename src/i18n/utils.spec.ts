import {
  getLanguagePrefix,
  getPathLanguage,
  getStartPath,
  isLanguage,
  localizePath,
  removeLanguagePrefix,
} from './utils';

/** Values that are not a path, for which the helpers fall back to the root path. */
const NOT_PATHS = [undefined, null, '', 0, 42, NaN, true, {}, ['/en/']];

describe('isLanguage', () => {
  it.each(['fr', 'en'])('accepts the language of the site %j', value => {
    expect(isLanguage(value)).toBe(true);
  });

  it.each(['de', 'EN', 'Fr', 'en-US', ' en', 'en ', '', '"en"', 'null', 'undefined'])(
    'rejects the string %j',
    value => {
      expect(isLanguage(value)).toBe(false);
    },
  );

  it.each([null, undefined, 0, 42, NaN, true, {}, ['en'], { en: 'en' }])(
    'rejects the value %j, which is not a string',
    value => {
      expect(isLanguage(value)).toBe(false);
    },
  );
});

describe('getLanguagePrefix', () => {
  it('gives the default language no prefix', () => {
    expect(getLanguagePrefix('fr')).toBe('');
  });

  it('prefixes the other languages with their code', () => {
    expect(getLanguagePrefix('en')).toBe('/en');
  });

  it.each(['de', 'EN', '', null, undefined, 42, {}])(
    'gives no prefix to %j, which is not a language of the site',
    value => {
      expect(getLanguagePrefix(value)).toBe('');
    },
  );
});

describe('getPathLanguage', () => {
  it.each(['/en', '/en/', '/en/projects', '/en/projects/', '/en/page/inconnue'])(
    'reads English in %j',
    pathname => {
      expect(getPathLanguage(pathname)).toBe('en');
    },
  );

  it.each(['/EN/projects', '/En/'])(
    'reads English in %j, whatever the case, as the router does',
    pathname => {
      expect(getPathLanguage(pathname)).toBe('en');
    },
  );

  it.each(['/', '/projects', '/english', '/enx/projects', '/fr/projects', '/projects/en', 'en/'])(
    'reads the default language in %j, which has no language prefix',
    pathname => {
      expect(getPathLanguage(pathname)).toBe('fr');
    },
  );

  it.each(NOT_PATHS)('reads the default language for %j, which is not a path', value => {
    expect(getPathLanguage(value)).toBe('fr');
  });
});

describe('removeLanguagePrefix', () => {
  it.each([
    ['/en/projects', '/projects'],
    ['/en/projects/', '/projects/'],
    ['/EN/experiences', '/experiences'],
    ['/en/page/inconnue', '/page/inconnue'],
  ])('turns %j into %j', (pathname, pagePath) => {
    expect(removeLanguagePrefix(pathname)).toBe(pagePath);
  });

  it.each(['/en', '/en/'])('turns the English home page %j into the root', pathname => {
    expect(removeLanguagePrefix(pathname)).toBe('/');
  });

  it.each(['/', '/projects', '/english', '/fr/projects'])(
    'returns %j as it is, without a language prefix',
    pathname => {
      expect(removeLanguagePrefix(pathname)).toBe(pathname);
    },
  );

  it.each(NOT_PATHS)('returns the root for %j, which is not a path', value => {
    expect(removeLanguagePrefix(value)).toBe('/');
  });
});

describe('localizePath', () => {
  it.each([
    ['/', 'en', '/en/'],
    ['/projects', 'en', '/en/projects'],
    ['/experiences', 'en', '/en/experiences'],
    ['/page-inconnue', 'en', '/en/page-inconnue'],
  ])('gives %j in %j at %j', (path, language, localizedPath) => {
    expect(localizePath({ path, language })).toBe(localizedPath);
  });

  it.each([
    ['/en/', '/'],
    ['/en', '/'],
    ['/en/projects', '/projects'],
    ['/projects', '/projects'],
  ])('gives %j in the default language at %j', (path, localizedPath) => {
    expect(localizePath({ path, language: 'fr' })).toBe(localizedPath);
  });

  it('keeps an English path in English, the home page with its slash', () => {
    expect(localizePath({ path: '/en/projects', language: 'en' })).toBe('/en/projects');
    expect(localizePath({ path: '/en', language: 'en' })).toBe('/en/');
  });

  it.each(['de', 'EN', '', null, undefined])(
    'gives the path in the default language for the language %j',
    language => {
      expect(localizePath({ path: '/en/projects', language })).toBe('/projects');
    },
  );

  it.each(NOT_PATHS)('gives the home page for the path %j', path => {
    expect(localizePath({ path, language: 'en' })).toBe('/en/');
  });

  it('gives the home page of the default language without any parameter', () => {
    expect(localizePath()).toBe('/');
  });
});

describe('getStartPath', () => {
  it('opens the root at the home page of the stored language', () => {
    expect(getStartPath({ pathname: '/', storedLanguage: 'en' })).toBe('/en/');
  });

  it('keeps the root when the stored language is the default one', () => {
    expect(getStartPath({ pathname: '/', storedLanguage: 'fr' })).toBe('/');
  });

  it.each(['/projects', '/en/', '/en/projects', '/page-inconnue'])(
    'opens %j as it is, whatever the stored language',
    pathname => {
      expect(getStartPath({ pathname, storedLanguage: 'en' })).toBe(pathname);
      expect(getStartPath({ pathname, storedLanguage: 'fr' })).toBe(pathname);
    },
  );

  it.each([undefined, null, '', 'de', 'EN', 42])(
    'keeps the root when the stored language is %j',
    storedLanguage => {
      expect(getStartPath({ pathname: '/', storedLanguage })).toBe('/');
    },
  );

  it.each(NOT_PATHS)('opens the root for the path %j', pathname => {
    expect(getStartPath({ pathname })).toBe('/');
  });

  it('opens the root without any parameter', () => {
    expect(getStartPath()).toBe('/');
  });
});
