// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { HASHED_ASSET_MAX_AGE_SECONDS } from '../constants.ts';
import type { HeaderRule } from '../types.ts';
import {
  findExactFile,
  getCacheControl,
  getNotFoundPageFiles,
  getRequestPathname,
  getServedFiles,
  isExactFile,
} from './utils.ts';

/** Files of the fake build, from its root. */
const BUILD_FILES = [
  'index.html',
  'projects.html',
  '404.html',
  'en/index.html',
  'en/404.html',
  'assets/index-a1b2.js',
];

describe('getRequestPathname', () => {
  it('reads the path of a URL', () => {
    expect(getRequestPathname('/en/projects')).toBe('/en/projects');
    expect(getRequestPathname('/')).toBe('/');
  });

  it('drops the query and the fragment', () => {
    expect(getRequestPathname('/projects?a=1&b=2')).toBe('/projects');
    expect(getRequestPathname('/projects#top')).toBe('/projects');
    expect(getRequestPathname('/projects?a=1#top')).toBe('/projects');
    expect(getRequestPathname('/?')).toBe('/');
  });

  it('decodes the path', () => {
    expect(getRequestPathname('/projets/un%20lien?a=1')).toBe('/projets/un lien');
    expect(getRequestPathname('/%C3%A9t%C3%A9')).toBe('/été');
  });

  it('ignores a path that does not decode', () => {
    expect(getRequestPathname('/%E0%A4%A')).toBeUndefined();
    expect(getRequestPathname('/%')).toBeUndefined();
  });

  it('ignores a URL that does not start with a slash', () => {
    expect(getRequestPathname('*')).toBeUndefined();
    expect(getRequestPathname('http://localhost/projects')).toBeUndefined();
    expect(getRequestPathname('')).toBeUndefined();
  });

  it('ignores a value that is not a string', () => {
    expect(getRequestPathname(undefined)).toBeUndefined();
    expect(getRequestPathname(null)).toBeUndefined();
    expect(getRequestPathname(404)).toBeUndefined();
    expect(getRequestPathname(['/projects'])).toBeUndefined();
  });
});

describe('getServedFiles', () => {
  it('lists the file, the page and the folder index of a path', () => {
    expect(getServedFiles('/projects')).toEqual([
      'projects',
      'projects.html',
      'projects/index.html',
    ]);
    expect(getServedFiles('/en/404.html')).toEqual([
      'en/404.html',
      'en/404.html.html',
      'en/404.html/index.html',
    ]);
  });

  it('lists the folder index and the page of a path with a trailing slash', () => {
    expect(getServedFiles('/en/')).toEqual(['en/index.html', 'en.html']);
    expect(getServedFiles('/en/projects/')).toEqual(['en/projects/index.html', 'en/projects.html']);
  });

  it('lists the index of the root alone', () => {
    expect(getServedFiles('/')).toEqual(['index.html']);
  });

  it('keeps the empty segments of a path', () => {
    expect(getServedFiles('//')).toEqual(['/index.html', '.html']);
  });
});

describe('getNotFoundPageFiles', () => {
  it('lists the not found page of the root for a path at the root', () => {
    expect(getNotFoundPageFiles('/nope')).toEqual(['404.html']);
    expect(getNotFoundPageFiles('/')).toEqual(['404.html']);
  });

  it('lists the not found page of each folder, the closest first', () => {
    expect(getNotFoundPageFiles('/en/nope')).toEqual(['en/404.html', '404.html']);
    expect(getNotFoundPageFiles('/en/a/b')).toEqual(['en/a/404.html', 'en/404.html', '404.html']);
  });

  it('counts the folder of a trailing slash', () => {
    expect(getNotFoundPageFiles('/en/')).toEqual(['en/404.html', '404.html']);
  });
});

describe('getCacheControl', () => {
  /** Cache policy of the hashed files of the build, as the rules of `_headers` give it. */
  const HASHED_ASSET_CACHE_CONTROL = `public, max-age=${HASHED_ASSET_MAX_AGE_SECONDS}, immutable`;

  /** Reads the cache policy of a path under rules that may hold anything. */
  const getCacheControlOf = ({ pathname, rules }: { pathname: string; rules: unknown }) =>
    getCacheControl({ pathname, rules: rules as readonly HeaderRule[] });

  it('reads the cache policy of the hashed files of the build', () => {
    expect(getCacheControl({ pathname: '/assets/montserrat-latin-a1b2.woff2' })).toBe(
      HASHED_ASSET_CACHE_CONTROL,
    );
    expect(getCacheControl({ pathname: '/assets/index-a1b2.js' })).toBe(HASHED_ASSET_CACHE_CONTROL);
  });

  it('reads none for the files that keep the default policy of Cloudflare Pages', () => {
    expect(getCacheControl({ pathname: '/experiences' })).toBeUndefined();
    expect(getCacheControl({ pathname: '/' })).toBeUndefined();
    expect(getCacheControl({ pathname: '/fonts/montserrat-latin.woff2' })).toBeUndefined();
    expect(getCacheControl({ pathname: '/sitemap.xml' })).toBeUndefined();
  });

  it('matches any part of a path with a star, slashes included', () => {
    const rules: HeaderRule[] = [{ path: '/a/*.js', headers: { 'Cache-Control': 'no-store' } }];

    expect(getCacheControl({ pathname: '/a/b.js', rules })).toBe('no-store');
    expect(getCacheControl({ pathname: '/a/b/c.js', rules })).toBe('no-store');
    expect(getCacheControl({ pathname: '/a/.js', rules })).toBe('no-store');
    expect(getCacheControl({ pathname: '/a/b.css', rules })).toBeUndefined();
    expect(getCacheControl({ pathname: '/a/b.js/c', rules })).toBeUndefined();
    expect(getCacheControl({ pathname: '/x/a/b.js', rules })).toBeUndefined();
  });

  it('matches the whole path, case included', () => {
    const rules: HeaderRule[] = [{ path: '/assets/*', headers: { 'Cache-Control': 'no-store' } }];

    expect(getCacheControl({ pathname: '/assets', rules })).toBeUndefined();
    expect(getCacheControl({ pathname: '/assets/', rules })).toBe('no-store');
    expect(getCacheControl({ pathname: '/Assets/a.js', rules })).toBeUndefined();
  });

  it('reads the other characters of a path pattern as they are', () => {
    const rules: HeaderRule[] = [
      { path: '/a.b/(c)+?[d]$', headers: { 'Cache-Control': 'no-store' } },
    ];

    expect(getCacheControl({ pathname: '/a.b/(c)+?[d]$', rules })).toBe('no-store');
    expect(getCacheControl({ pathname: '/axb/(c)+?[d]$', rules })).toBeUndefined();
    expect(getCacheControl({ pathname: '/a.b/cc', rules })).toBeUndefined();
  });

  it('reads the header name without case', () => {
    const rules: HeaderRule[] = [{ path: '/*', headers: { 'cache-CONTROL': 'no-store' } }];

    expect(getCacheControl({ pathname: '/a', rules })).toBe('no-store');
  });

  it('joins the policies of every matching rule, in their order', () => {
    const rules: HeaderRule[] = [
      { path: '/*', headers: { 'Cache-Control': 'public' } },
      { path: '/b/*', headers: { 'Cache-Control': 'no-transform' } },
      { path: '/a/*', headers: { 'Cache-Control': 'max-age=60', 'cache-control': 'immutable' } },
    ];

    expect(getCacheControl({ pathname: '/a/b', rules })).toBe('public, max-age=60, immutable');
    expect(getCacheControl({ pathname: '/c', rules })).toBe('public');
  });

  it('leaves out the rules that name a host and the other headers', () => {
    const rules: HeaderRule[] = [
      { path: 'https://issoufi-fr.pages.dev/*', headers: { 'Cache-Control': 'no-store' } },
      { path: '/*', headers: { 'X-Robots-Tag': 'noindex', 'Cache-Controls': 'no-store' } },
    ];

    expect(getCacheControl({ pathname: '/a', rules })).toBeUndefined();
  });

  it('trims a value, and leaves out a value that _headers would not write', () => {
    const rules = [
      { path: '/*', headers: { 'Cache-Control': '  no-store  ' } },
      { path: '/*', headers: { 'Cache-Control': '   ' } },
      { path: '/*', headers: { 'Cache-Control': 'public\nX-Evil: 1' } },
      { path: '/*', headers: { 'Cache-Control': 60 } },
      { path: '/*', headers: { 'Cache-Control': null } },
    ];

    expect(getCacheControlOf({ pathname: '/a', rules })).toBe('no-store');
  });

  it.each([
    null,
    'Cache-Control',
    {},
    { path: 1, headers: { 'Cache-Control': 'no-store' } },
    { path: 'a/*', headers: { 'Cache-Control': 'no-store' } },
    { path: '*', headers: { 'Cache-Control': 'no-store' } },
    { path: '*/a', headers: { 'Cache-Control': 'no-store' } },
    { path: '/*' },
    { path: '/*', headers: null },
    { path: '/*', headers: 'Cache-Control: no-store' },
    { path: '/*', headers: ['no-store'] },
  ])('leaves out the rule %j', rule => {
    const valid = { path: '/*', headers: { 'Cache-Control': 'public' } };

    expect(getCacheControlOf({ pathname: '/a', rules: [rule, valid] })).toBe('public');
  });

  it('leaves out a rule whose path holds a space, which the build does not write to _headers', () => {
    const rules = [{ path: '/a b', headers: { 'Cache-Control': 'no-store' } }];

    expect(getCacheControlOf({ pathname: '/a b', rules })).toBeUndefined();
  });

  it.each([null, {}, 'rules', 1])('reads no rule from %j', rules => {
    expect(getCacheControlOf({ pathname: '/assets/a.js', rules })).toBeUndefined();
  });

  it('reads none from an empty list', () => {
    expect(getCacheControl({ pathname: '/assets/a.js', rules: [] })).toBeUndefined();
  });
});

describe('with a build', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'preview-not-found-'));
    BUILD_FILES.forEach(file => {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), file);
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe('isExactFile', () => {
    it('finds a file of the build', () => {
      expect(isExactFile({ root, file: 'index.html' })).toBe(true);
      expect(isExactFile({ root, file: 'en/404.html' })).toBe(true);
      expect(isExactFile({ root, file: 'assets/index-a1b2.js' })).toBe(true);
    });

    it('refuses a path that differs in case', () => {
      expect(isExactFile({ root, file: 'Projects.html' })).toBe(false);
      expect(isExactFile({ root, file: 'PROJECTS.html' })).toBe(false);
      expect(isExactFile({ root, file: 'EN/index.html' })).toBe(false);
      expect(isExactFile({ root, file: 'Assets/index-a1b2.js' })).toBe(false);
    });

    it('refuses a folder', () => {
      expect(isExactFile({ root, file: 'en' })).toBe(false);
      expect(isExactFile({ root, file: 'assets' })).toBe(false);
    });

    it('refuses a file read as a folder', () => {
      expect(isExactFile({ root, file: 'projects.html/index.html' })).toBe(false);
    });

    it('refuses a missing path', () => {
      expect(isExactFile({ root, file: 'nope.html' })).toBe(false);
      expect(isExactFile({ root, file: 'en/nope/404.html' })).toBe(false);
      expect(isExactFile({ root, file: '' })).toBe(false);
    });

    it('refuses the parent folder and the empty segments', () => {
      expect(isExactFile({ root, file: 'en/../404.html' })).toBe(false);
      expect(isExactFile({ root, file: '../index.html' })).toBe(false);
      expect(isExactFile({ root, file: '/index.html' })).toBe(false);
      expect(isExactFile({ root, file: 'en//404.html' })).toBe(false);
    });

    it('refuses every path of a missing root', () => {
      expect(isExactFile({ root: join(root, 'missing'), file: 'index.html' })).toBe(false);
    });
  });

  describe('findExactFile', () => {
    it('finds the first file of the build, case included', () => {
      expect(findExactFile({ root, files: getServedFiles('/projects') })).toBe('projects.html');
      expect(findExactFile({ root, files: getServedFiles('/en') })).toBe('en/index.html');
      expect(findExactFile({ root, files: getServedFiles('/en/') })).toBe('en/index.html');
      expect(findExactFile({ root, files: getNotFoundPageFiles('/en/a/b') })).toBe('en/404.html');
      expect(findExactFile({ root, files: getNotFoundPageFiles('/nope') })).toBe('404.html');
    });

    it('finds none for a path that differs in case or names no file', () => {
      expect(findExactFile({ root, files: getServedFiles('/Projects') })).toBeUndefined();
      expect(findExactFile({ root, files: getServedFiles('/EN/') })).toBeUndefined();
      expect(findExactFile({ root, files: getServedFiles('/nope') })).toBeUndefined();
    });

    it('finds none in an empty list', () => {
      expect(findExactFile({ root, files: [] })).toBeUndefined();
    });
  });
});
