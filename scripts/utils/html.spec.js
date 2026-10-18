import { readFileSync } from 'node:fs';

import { escapeHtml, findFontStylesheetUrl, hasUnresolvedValue } from './html.mjs';

describe('escapeHtml', () => {
  it.each([
    ['R&D', 'R&amp;D'],
    ['<script>', '&lt;script&gt;'],
    ['say "hi"', 'say &quot;hi&quot;'],
    ["l'UX", 'l&#39;UX'],
    ['&amp;', '&amp;amp;'],
  ])('escapes %j', (value, expected) => {
    expect(escapeHtml(value)).toBe(expected);
  });

  it.each(['Développeur full-stack', 'passionné par l’', 'Expériences — 2026 🚀', ''])(
    'keeps %j as is',
    value => {
      expect(escapeHtml(value)).toBe(value);
    },
  );

  it.each([undefined, null, 42, {}, ['a']])('gives an empty text for %j', value => {
    expect(escapeHtml(value)).toBe('');
  });
});

describe('hasUnresolvedValue', () => {
  it.each([
    'box-shadow: undefined;',
    'stroke="rgba(139, 49, 104, NaN)"',
    'font-weight: null;',
    '<svg>undefined</svg>',
  ])('finds an unresolved value in %j', markup => {
    expect(hasUnresolvedValue(markup)).toBe(true);
  });

  it.each([
    'color: #ffffff; box-shadow: 0 0 28px rgba(139, 49, 104, 0.65);',
    '.nullable { color: red; }',
    'font-family: Undefined Sans;',
    '',
  ])('finds none in %j', markup => {
    expect(hasUnresolvedValue(markup)).toBe(false);
  });

  it.each([undefined, null, 42, {}])('counts %j, which is not markup, as unresolved', markup => {
    expect(hasUnresolvedValue(markup)).toBe(true);
  });
});

describe('findFontStylesheetUrl', () => {
  it('finds the Google Fonts style sheet of index.html', () => {
    const url = findFontStylesheetUrl(readFileSync('index.html', 'utf-8'));

    expect(url).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=Montserrat/);
    expect(url).toContain('&family=Saira+Stencil+One');
  });

  it('decodes the ampersands escaped in the attribute', () => {
    const html = '<link href="https://fonts.googleapis.com/css2?family=A&amp;display=swap" />';

    expect(findFontStylesheetUrl(html)).toBe(
      'https://fonts.googleapis.com/css2?family=A&display=swap',
    );
  });

  it.each([
    ['a page without a style sheet', '<html><head></head></html>'],
    ['another style sheet', '<link href="/style.css" rel="stylesheet" />'],
    ['the preconnect link to the font files', '<link href="https://fonts.gstatic.com" />'],
    ['an empty page', ''],
  ])('finds none in %s', (_, html) => {
    expect(findFontStylesheetUrl(html)).toBe('');
  });

  it.each([undefined, null, 42, {}])('finds none in %j', html => {
    expect(findFontStylesheetUrl(html)).toBe('');
  });
});
