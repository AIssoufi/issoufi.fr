// @vitest-environment node
import { HASHED_ASSET_MAX_AGE_SECONDS } from '../../constants.ts';
import type { HeaderRule } from '../../types.ts';
import { getCacheControl } from './headers.ts';

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
