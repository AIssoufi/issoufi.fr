// @vitest-environment node
import {
  getCanonicalPath,
  getRedirectLocation,
  getRequestQuery,
  isCloudflareConfigFile,
} from './redirects.ts';

describe('getCanonicalPath', () => {
  it.each([
    ['index.html', '/'],
    ['en/index.html', '/en/'],
    ['en/a/index.html', '/en/a/'],
  ])('reads the folder of the index %s, with a trailing slash: %s', (file, path) => {
    expect(getCanonicalPath(file)).toBe(path);
  });

  it.each([
    ['projects.html', '/projects'],
    ['en/projects.html', '/en/projects'],
    ['404.html', '/404'],
    ['en/404.html', '/en/404'],
    ['a.b.html', '/a.b'],
  ])('reads the page %s without its extension: %s', (file, path) => {
    expect(getCanonicalPath(file)).toBe(path);
  });

  it.each([
    ['favicon.svg', '/favicon.svg'],
    ['assets/index-a1b2.js', '/assets/index-a1b2.js'],
    ['en/manifest.webmanifest', '/en/manifest.webmanifest'],
    ['CV - Adam Issoufi.pdf', '/CV - Adam Issoufi.pdf'],
    ['projects.htm', '/projects.htm'],
    ['projects.HTML', '/projects.HTML'],
    ['myindex.html', '/myindex'],
    ['index.html.gz', '/index.html.gz'],
  ])('keeps the path of the other file %s: %s', (file, path) => {
    expect(getCanonicalPath(file)).toBe(path);
  });

  it.each([
    ['', '/'],
    ['.html', '/.html'],
    ['en/.html', '/en/.html'],
  ])('keeps the path of the file without a page name %j: %s', (file, path) => {
    expect(getCanonicalPath(file)).toBe(path);
  });
});

describe('getRequestQuery', () => {
  it('reads the query of a URL', () => {
    expect(getRequestQuery('/en?a=1')).toBe('?a=1');
    expect(getRequestQuery('/en?a=1&b=2')).toBe('?a=1&b=2');
  });

  it('drops the fragment', () => {
    expect(getRequestQuery('/en?a=1#top')).toBe('?a=1');
    expect(getRequestQuery('/en#top?a=1')).toBe('');
  });

  it('reads no query from a URL without one', () => {
    expect(getRequestQuery('/en')).toBe('');
    expect(getRequestQuery('/en?')).toBe('');
    expect(getRequestQuery('/')).toBe('');
    expect(getRequestQuery('')).toBe('');
  });

  it.each([undefined, null, 1, {}, []])('reads no query from %j, which is no URL', url => {
    expect(getRequestQuery(url)).toBe('');
  });

  it('reads no query from a URL that does not parse', () => {
    expect(getRequestQuery('http://[::1?a=1')).toBe('');
  });
});

describe('getRedirectLocation', () => {
  it.each([
    ['/en', 'en/index.html', '/en/'],
    ['/en/index', 'en/index.html', '/en/'],
    ['/en/index/', 'en/index.html', '/en/'],
    ['/en/index.html', 'en/index.html', '/en/'],
    ['/index', 'index.html', '/'],
    ['/index.html', 'index.html', '/'],
    ['/projects/', 'projects.html', '/projects'],
    ['/projects.html', 'projects.html', '/projects'],
    ['/en/projects/', 'en/projects.html', '/en/projects'],
    ['/en/projects.html', 'en/projects.html', '/en/projects'],
    ['/404.html', '404.html', '/404'],
  ])('redirects %s, which names %s, to %s', (pathname, file, location) => {
    expect(getRedirectLocation({ pathname, file, url: pathname })).toBe(location);
  });

  it('keeps the query of the request', () => {
    expect(getRedirectLocation({ pathname: '/en', file: 'en/index.html', url: '/en?a=1' })).toBe(
      '/en/?a=1',
    );
    expect(
      getRedirectLocation({
        pathname: '/projects/',
        file: 'projects.html',
        url: '/projects/?a=1&b=2#top',
      }),
    ).toBe('/projects?a=1&b=2');
  });

  it('redirects without a query when the URL gives none', () => {
    expect(getRedirectLocation({ pathname: '/en', file: 'en/index.html' })).toBe('/en/');
    expect(getRedirectLocation({ pathname: '/en', file: 'en/index.html', url: null })).toBe('/en/');
  });

  it('encodes the path of the redirect as a URL', () => {
    expect(
      getRedirectLocation({
        pathname: '/un lien.html',
        file: 'un lien.html',
        url: '/un%20lien.html',
      }),
    ).toBe('/un%20lien');
    expect(
      getRedirectLocation({ pathname: '/été/', file: 'été.html', url: '/%C3%A9t%C3%A9/' }),
    ).toBe('/%C3%A9t%C3%A9');
  });

  it.each([
    ['/', 'index.html'],
    ['/en/', 'en/index.html'],
    ['/projects', 'projects.html'],
    ['/en/projects', 'en/projects.html'],
    ['/404', '404.html'],
    ['/favicon.svg', 'favicon.svg'],
    ['/assets/index-a1b2.js', 'assets/index-a1b2.js'],
  ])('does not redirect %s, the canonical path of %s', (pathname, file) => {
    expect(getRedirectLocation({ pathname, file, url: `${pathname}?a=1` })).toBeUndefined();
  });
});

describe('isCloudflareConfigFile', () => {
  it.each(['/_headers', '/_redirects'])('tells that %s is a configuration file', pathname => {
    expect(isCloudflareConfigFile(pathname)).toBe(true);
  });

  it.each([
    '/',
    '/_headers/',
    '/en/_headers',
    '/_Headers',
    '/_REDIRECTS',
    '/_headers.txt',
    '/headers',
    '_headers',
    'a_headers',
    '//_headers',
    '',
  ])('tells that %j is none', pathname => {
    expect(isCloudflareConfigFile(pathname)).toBe(false);
  });
});
