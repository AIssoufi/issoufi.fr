// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { REDIRECTS_FILE_NAME } from '../constants.ts';
import {
  findRedirectRule,
  getCanonicalPath,
  getRedirectLocation,
  getRuleLocation,
  getUrlQuery,
  isCloudflareConfigFile,
  readRedirectRules,
} from './redirects.ts';

/** A redirect of the build, as `parseRedirectRules` reads it. */
const CODE_RULE = { source: '/code', target: 'https://example.com/code', status: 302 };

/** A second redirect, of a source that holds a mark of a pattern. */
const SPLAT_RULE = { source: '/blog/*', target: '/en/', status: 301 };

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

describe('getUrlQuery', () => {
  it('reads the query of a URL', () => {
    expect(getUrlQuery('/en?a=1')).toBe('?a=1');
    expect(getUrlQuery('/en?a=1&b=2')).toBe('?a=1&b=2');
  });

  it('drops the fragment', () => {
    expect(getUrlQuery('/en?a=1#top')).toBe('?a=1');
    expect(getUrlQuery('/en#top?a=1')).toBe('');
  });

  it('reads no query from a URL without one', () => {
    expect(getUrlQuery('/en')).toBe('');
    expect(getUrlQuery('/en?')).toBe('');
    expect(getUrlQuery('/')).toBe('');
    expect(getUrlQuery('')).toBe('');
  });

  it.each([undefined, null, 1, {}, []])('reads no query from %j, which is no URL', url => {
    expect(getUrlQuery(url)).toBe('');
  });

  it('reads no query from a URL that does not parse', () => {
    expect(getUrlQuery('http://[::1?a=1')).toBe('');
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

describe('readRedirectRules', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'preview-redirects-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reads the redirects of the file, in its order', () => {
    writeFileSync(
      join(root, REDIRECTS_FILE_NAME),
      '# Short links\n/code https://example.com/code 302\n/blog/* /en/ 301\n',
    );

    expect(readRedirectRules(root)).toEqual([CODE_RULE, SPLAT_RULE]);
  });

  it('reads none from an empty file', () => {
    writeFileSync(join(root, REDIRECTS_FILE_NAME), '');

    expect(readRedirectRules(root)).toEqual([]);
  });

  it('reads none from a file of comments and of lines that are no redirect', () => {
    writeFileSync(join(root, REDIRECTS_FILE_NAME), '# Comment\n\n/a /b 200\nnope\n');

    expect(readRedirectRules(root)).toEqual([]);
  });

  it('reads none from a build without the file', () => {
    expect(readRedirectRules(root)).toEqual([]);
  });

  it('reads none from a missing build', () => {
    expect(readRedirectRules(join(root, 'missing'))).toEqual([]);
  });

  it('reads none from a folder of that name', () => {
    mkdirSync(join(root, REDIRECTS_FILE_NAME));

    expect(readRedirectRules(root)).toEqual([]);
  });

  it('reads none from a file that differs in case', () => {
    writeFileSync(join(root, '_Redirects'), '/code https://example.com/code 302\n');

    expect(readRedirectRules(root)).toEqual([]);
  });
});

describe('findRedirectRule', () => {
  const rules = [CODE_RULE, SPLAT_RULE];

  it.each(['/code', '/code?a=1', '/code#top', '/code?a=1#top', '/code?'])(
    'finds the redirect of the URL %s',
    url => {
      expect(findRedirectRule({ rules, url })).toBe(CODE_RULE);
    },
  );

  it('finds a source with a splat at its own path', () => {
    expect(findRedirectRule({ rules, url: '/blog/*' })).toBe(SPLAT_RULE);
  });

  it('finds the first redirect of a source that two give', () => {
    const later = { ...CODE_RULE, target: '/later' };

    expect(findRedirectRule({ rules: [CODE_RULE, later], url: '/code' })).toBe(CODE_RULE);
  });

  it.each([
    '/',
    '',
    '/code/',
    '/Code',
    '/CODE',
    '/code.html',
    '/code/a',
    '/en/code',
    '//code',
    '/c%6Fde',
    'code',
    '/nope',
    '/blog/a',
    '?/code',
  ])('finds none for the URL %j', url => {
    expect(findRedirectRule({ rules, url })).toBeUndefined();
  });

  it('finds none in a list without redirects', () => {
    expect(findRedirectRule({ rules: [], url: '/code' })).toBeUndefined();
  });

  it.each([undefined, null, 404, {}, []])('finds none for %j, which is no URL', url => {
    expect(findRedirectRule({ rules, url })).toBeUndefined();
  });
});

describe('getRuleLocation', () => {
  it.each([
    ['https://example.com/a', '/code', 'https://example.com/a'],
    ['https://example.com/a', '/code?', 'https://example.com/a'],
    ['https://example.com/a', '/code?b=1&c=2', 'https://example.com/a?b=1&c=2'],
    ['https://example.com/a', '/code?b=1#top', 'https://example.com/a?b=1'],
    ['https://example.com/a#b', '/code?c=1', 'https://example.com/a?c=1#b'],
    ['/en/', '/code?a=1', '/en/?a=1'],
    ['/en/#a', '/code?b=1', '/en/?b=1#a'],
    ['https://example.com/a', '/code?b=$&', 'https://example.com/a?b=$&'],
  ])('reads the target %s for the URL %s: %s', (target, url, location) => {
    expect(getRuleLocation({ target, url })).toBe(location);
  });

  it.each([
    ['https://example.com/a?b=1', '/code?c=2'],
    ['/en/?b=1', '/code?c=2'],
    ['/en/?b=1#a', '/code?c=2'],
  ])('keeps the query of the target %s for the URL %s', (target, url) => {
    expect(getRuleLocation({ target, url })).toBe(target);
  });

  it.each([undefined, null, 404, {}])('keeps the target for %j, which is no URL', url => {
    expect(getRuleLocation({ target: '/en/', url })).toBe('/en/');
  });

  it('adds the query of the URL to a target that does not parse', () => {
    expect(getRuleLocation({ target: 'http://[::1', url: '/code?a=1' })).toBe('http://[::1?a=1');
  });

  it('keeps a target that does not parse for a URL without a query', () => {
    expect(getRuleLocation({ target: 'http://[::1', url: '/code' })).toBe('http://[::1');
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
