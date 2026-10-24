import {
  HASHED_ASSET_MAX_AGE_SECONDS,
  HSTS_MAX_AGE_SECONDS,
  NO_INDEX_HEADERS,
  PAGES_PROJECT_HOST,
  SECURITY_HEADERS,
} from '../constants.ts';
import type { HeaderRule } from '../types.ts';
import { renderHeaderRules } from './headers.ts';

describe('renderHeaderRules', () => {
  const cacheRule: HeaderRule = {
    path: '/assets/*',
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  };

  /** Writes rules that may hold anything, as from a malformed config. */
  const render = (rules: unknown) => renderHeaderRules({ rules: rules as HeaderRule[] });

  it('gives every file the security headers by default', () => {
    const securityLines = Object.entries(SECURITY_HEADERS).map(
      ([name, value]) => `  ${name}: ${value}`,
    );
    const [firstRule] = renderHeaderRules().split('\n\n');

    expect(securityLines).toHaveLength(5);
    expect(firstRule).toBe(['/*', ...securityLines].join('\n'));
  });

  it('asks browsers for HTTPS only for a year, on this host alone, by default', () => {
    expect(HSTS_MAX_AGE_SECONDS).toBe(365 * 24 * 60 * 60);
    expect(renderHeaderRules()).toContain('  Strict-Transport-Security: max-age=31536000\n');
  });

  it('caches the hashed files of assets/ for a year by default, as immutable', () => {
    expect(HASHED_ASSET_MAX_AGE_SECONDS).toBe(365 * 24 * 60 * 60);
    expect(renderHeaderRules()).toMatch(
      /\n\n\/assets\/\*\n {2}Cache-Control: public, max-age=31536000, immutable\n$/,
    );
  });

  it('writes each header of a rule indented on its own line, under its path', () => {
    const rule = {
      path: '/fonts/*',
      headers: { 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'none' },
    };

    expect(render([rule])).toBe('/fonts/*\n  Cache-Control: no-cache\n  X-Robots-Tag: none\n');
  });

  it('parts the rules with a blank line, in their order', () => {
    const htmlRule = { path: '/*.html', headers: { 'Cache-Control': 'no-cache' } };

    expect(render([cacheRule, htmlRule])).toBe(
      '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n' +
        '/*.html\n  Cache-Control: no-cache\n',
    );
  });

  it('keeps search engines off the pages.dev host of the project by default, only there', () => {
    expect(PAGES_PROJECT_HOST).toBe('issoufi-fr.pages.dev');
    expect(renderHeaderRules().split('\n\n')).toContain(
      'https://issoufi-fr.pages.dev/*\n  X-Robots-Tag: noindex',
    );
    expect(renderHeaderRules().match(/X-Robots-Tag/g)).toHaveLength(1);
  });

  it.each([
    'https://issoufi-fr.pages.dev/*',
    'https://develop.issoufi-fr.pages.dev/en/*',
    'https://a/',
  ])('writes a rule limited to the host of the absolute URL %s', path => {
    expect(render([{ path, headers: NO_INDEX_HEADERS }])).toBe(
      `${path}\n  X-Robots-Tag: noindex\n`,
    );
  });

  it('trims the spaces around a value', () => {
    expect(render([{ path: '/', headers: { 'Cache-Control': '  no-cache \t' } }])).toBe(
      '/\n  Cache-Control: no-cache\n',
    );
  });

  describe('edge cases', () => {
    it('writes the default rules when the rules are undefined', () => {
      expect(render(undefined)).toBe(renderHeaderRules());
    });

    it.each([[[]], [null], ['/assets/*'], [42], [{}]])('writes nothing for the rules %j', rules => {
      expect(render(rules)).toBe('');
    });

    it.each([
      ['a null rule', null],
      ['a rule that is not an object', '/assets/*'],
      ['no path', { headers: cacheRule.headers }],
      ['an empty path', { ...cacheRule, path: '' }],
      ['a path without a leading slash', { ...cacheRule, path: 'assets/*' }],
      ['a path with a space', { ...cacheRule, path: '/assets /*' }],
      ['a path with a line break', { ...cacheRule, path: '/assets/*\n/x' }],
      ['a path that is not a string', { ...cacheRule, path: 42 }],
      ['an absolute URL in http', { ...cacheRule, path: 'http://issoufi-fr.pages.dev/*' }],
      ['an absolute URL with a port', { ...cacheRule, path: 'https://issoufi-fr.pages.dev:443/*' }],
      ['an absolute URL without a path', { ...cacheRule, path: 'https://issoufi-fr.pages.dev' }],
      ['an absolute URL without a host', { ...cacheRule, path: 'https:///*' }],
      ['a host with a space', { ...cacheRule, path: 'https://issoufi fr.pages.dev/*' }],
      ['a host with an underscore', { ...cacheRule, path: 'https://issoufi_fr.pages.dev/*' }],
      ['a host in capitals', { ...cacheRule, path: 'https://Issoufi-Fr.pages.dev/*' }],
      ['a protocol in capitals', { ...cacheRule, path: 'HTTPS://issoufi-fr.pages.dev/*' }],
      ['a placeholder in the host', { ...cacheRule, path: 'https://:project.pages.dev/*' }],
      ['a host of dots only', { ...cacheRule, path: 'https://.../*' }],
      ['an empty label in the host', { ...cacheRule, path: 'https://issoufi-fr..dev/*' }],
      ['a label that starts with a hyphen', { ...cacheRule, path: 'https://-issoufi.dev/*' }],
      ['a label that ends with a hyphen', { ...cacheRule, path: 'https://issoufi-.dev/*' }],
      ['no headers', { path: '/fonts/*' }],
      ['null headers', { path: '/fonts/*', headers: null }],
      ['headers in an array', { path: '/fonts/*', headers: ['Cache-Control: no-cache'] }],
      ['no header', { path: '/fonts/*', headers: {} }],
      ['no header to write', { path: '/fonts/*', headers: { 'Cache-Control': '' } }],
    ])('leaves out a rule with %s, and keeps the others', (_, rule) => {
      expect(render([rule, cacheRule])).toBe(render([cacheRule]));
    });

    it.each([
      ['an empty name', { '': 'no-cache' }],
      ['a name with a space', { 'Cache Control': 'no-cache' }],
      ['a name with a colon', { 'Cache:Control': 'no-cache' }],
      ['an empty value', { 'X-Robots-Tag': '' }],
      ['a blank value', { 'X-Robots-Tag': '   ' }],
      ['a value with a line break', { 'X-Robots-Tag': 'none\n/admin/*' }],
      ['a value with a carriage return', { 'X-Robots-Tag': 'none\r' }],
      ['a value that is not a string', { 'X-Robots-Tag': 42 }],
      ['a null value', { 'X-Robots-Tag': null }],
    ])('leaves out a header with %s, and keeps the others', (_, header) => {
      const rule = { path: '/', headers: { ...header, 'Cache-Control': 'no-cache' } };

      expect(render([rule])).toBe('/\n  Cache-Control: no-cache\n');
    });
  });
});
