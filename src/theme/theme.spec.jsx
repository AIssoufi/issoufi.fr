import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import styled, { th, ThemeProvider } from '@xstyled/styled-components';

import { declaredStyle, getContrastRatio, MIN_TEXT_CONTRAST_RATIO } from '../styleTestUtils.js';
import { MIN_FONT_SIZE_PX } from './constants.ts';
import {
  findRawThemeValues,
  findRawValues,
  findUnguardedHovers,
  getSmallestFontSizePx,
} from './testUtils.js';
import { theme } from './theme.ts';

/** Source of the semantic tokens, which may only read the primitives of tokens.ts. */
const THEME_FILE = join('src', 'theme', 'theme.ts');

/** Namespace of the theme read by each xstyled `th.*` helper. */
const NAMESPACE_BY_HELPER = {
  color: 'colors',
  space: 'space',
  size: 'sizes',
  font: 'fonts',
  fontSize: 'fontSizes',
  fontWeight: 'fontWeights',
  lineHeight: 'lineHeights',
  letterSpacing: 'letterSpacings',
  radius: 'radii',
  border: 'borders',
  borderWidth: 'borderWidths',
  shadow: 'shadows',
  zIndex: 'zIndices',
  duration: 'durations',
  timingFunction: 'timingFunctions',
};

const listFiles = ({ directory, pattern }) =>
  readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return listFiles({ directory: path, pattern });
    return pattern.test(entry) ? [path] : [];
  });

const listStyleFiles = directory =>
  listFiles({ directory, pattern: /\.styled\.ts$|GlobalStyle\.ts$/ });

/** Every `th.helper(key)` and `th('path')` call found in the style files, with its location. */
const tokenUsages = listStyleFiles('src').flatMap(file =>
  [...readFileSync(file, 'utf8').matchAll(/th(?:\.(\w+))?\(\s*'?([\w.-]+)'?\s*\)/g)].map(
    ([call, helper, key]) => ({ file, call, helper, key }),
  ),
);

/**
 * Fewest style files that hold a `:hover`, half as many as today, so that the guard of the hover
 * styles proves that it reads them, and still passes when a file stops styling a hover.
 */
const MIN_STYLE_FILES_WITH_HOVER = 5;

/** Helpers whose token xstyled negates when its key starts with a minus sign: `th.space(-8)`. */
const NEGATABLE_HELPERS = ['space'];

const resolve = ({ helper, key }) => {
  if (!helper) return key.split('.').reduce((node, step) => node?.[step], theme);
  const namespace = NAMESPACE_BY_HELPER[helper];
  const isNegated = NEGATABLE_HELPERS.includes(helper) && key.startsWith('-');
  const tokenKey = isNegated ? key.slice(1) : key;
  return namespace ? theme[namespace]?.[tokenKey] : undefined;
};

const leaves = ({ node, prefix = '' }) =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object'
      ? leaves({ node: value, prefix: `${prefix}${key}.` })
      : [[`${prefix}${key}`, value]],
  );

describe('theme', () => {
  it('finds token usages in the style files', () => {
    expect(tokenUsages.length).toBeGreaterThan(100);
  });

  it('defines every token used in the style files', () => {
    const missing = tokenUsages.filter(usage => resolve(usage) === undefined);
    expect(missing.map(({ file, call }) => `${file}: ${call}`)).toEqual([]);
  });

  // Zero, percentages, viewport units, angles and unitless numbers may stay raw: see findRawValues
  it('writes no length, duration, color, easing or scaled value by hand in the style files', () => {
    const rawValues = listStyleFiles('src').flatMap(file =>
      findRawValues(readFileSync(file, 'utf8')).map(
        ({ line, kind, value }) => `${file}:${line}: ${kind} ${value}`,
      ),
    );
    expect(rawValues).toEqual([]);
  });

  it('styles :hover only for the pointers that hover, which a tap on a touch screen would leave on', () => {
    const sources = listStyleFiles('src').map(file => ({
      file,
      source: readFileSync(file, 'utf8'),
    }));
    const unguardedHovers = sources.flatMap(({ file, source }) =>
      findUnguardedHovers(source).map(line => `${file}:${line}`),
    );

    expect(sources.filter(({ source }) => source.includes(':hover')).length).toBeGreaterThanOrEqual(
      MIN_STYLE_FILES_WITH_HOVER,
    );
    expect(unguardedHovers).toEqual([]);
  });

  it('points every semantic token of theme.ts to a primitive of tokens.ts', () => {
    const rawValues = findRawThemeValues(readFileSync(THEME_FILE, 'utf8')).map(
      ({ line, kind, value }) => `${THEME_FILE}:${line}: ${kind} ${value}`,
    );
    expect(rawValues).toEqual([]);
  });

  it('only uses th helpers that map to a theme namespace', () => {
    const unknownHelpers = tokenUsages.filter(
      ({ helper }) => helper && !(helper in NAMESPACE_BY_HELPER),
    );
    expect(unknownHelpers.map(({ call }) => call)).toEqual([]);
  });

  it('imports styled-components only through @xstyled/styled-components', () => {
    const sourceFiles = listFiles({ directory: 'src', pattern: /\.(ts|tsx|js|jsx)$/ }).filter(
      // Type-only augmentation of the styled-components module is allowed
      file => !file.endsWith('styled.d.ts'),
    );
    // Built from parts so that this test file does not match its own pattern
    const directImport = new RegExp("from '" + 'styled-components' + "'");
    const directImports = sourceFiles.filter(file => directImport.test(readFileSync(file, 'utf8')));
    expect(directImports).toEqual([]);
  });

  it(`keeps every font size at ${MIN_FONT_SIZE_PX} px or more, so that every text stays readable`, () => {
    // A fluid size never gets under the smallest value of its clamp()
    const isReadable = size => getSmallestFontSizePx(size) >= MIN_FONT_SIZE_PX;
    const smallSizes = Object.entries(theme.fontSizes).filter(([, size]) => !isReadable(size));

    expect(smallSizes).toEqual([]);
  });

  it('gives the accent of the texts 4.5:1 on the background, which the plum of backgrounds lacks', () => {
    const contrastOnBackground = color =>
      getContrastRatio({ foreground: theme.colors[color], background: theme.colors.background });

    expect(contrastOnBackground('accent-foreground')).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST_RATIO,
    );
    expect(contrastOnBackground('accent')).toBeLessThan(MIN_TEXT_CONTRAST_RATIO);
  });

  it('has no empty token', () => {
    const empty = leaves({ node: theme }).filter(
      ([, value]) => value === '' || value === undefined,
    );
    expect(empty).toEqual([]);
  });

  it('renders tokens through the xstyled th helpers', () => {
    const Card = styled.div`
      color: ${th.color('accent')};
      background-color: ${th.color('foreground-a10')};
      padding: ${th.space(16)};
      margin-top: ${th.space(-8)};
      width: ${th.size(1)};
      max-width: ${th.size('message')};
      font-size: ${th.fontSize(14)};
      line-height: ${th.lineHeight(150)};
      border-radius: ${th.radius('md')};
      z-index: ${th.zIndex('raised')};
      transition-duration: ${th.duration('base')};
    `;
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Card />
      </ThemeProvider>,
    );
    const style = getComputedStyle(container.firstChild);

    expect(style.color).toBe('rgb(139, 49, 104)');
    expect(style.backgroundColor).toBe('rgba(255, 255, 255, 0.1)');
    expect(style.padding).toBe('16px');
    expect(style.marginTop).toBe('-8px');
    // Without the theme, xstyled would turn a size of 1 into 100%
    expect(style.width).toBe('1px');
    // jsdom 30 turns the computed ch into pixels with its own font metrics: read the declared value
    expect(declaredStyle({ element: container.firstChild, property: 'max-width' })).toBe('40ch');
    expect(style.fontSize).toBe('14px');
    expect(style.lineHeight).toBe('1.5');
    expect(style.borderRadius).toBe('12px');
    expect(style.zIndex).toBe('1');
    expect(style.transitionDuration).toBe('0.25s');
  });
});
