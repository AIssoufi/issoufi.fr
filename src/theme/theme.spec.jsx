import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { th, ThemeProvider } from '@xstyled/styled-components';
import styled from 'styled-components';

import { theme } from './theme';

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

const listStyleFiles = directory =>
  readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return listStyleFiles(path);
    return /\.styled\.ts$|GlobalStyle\.ts$/.test(entry) ? [path] : [];
  });

/** Every `th.helper(key)` and `th('path')` call found in the style files, with its location. */
const tokenUsages = listStyleFiles('src').flatMap(file =>
  [...readFileSync(file, 'utf8').matchAll(/th(?:\.(\w+))?\(\s*'?([\w.-]+)'?\s*\)/g)].map(
    ([call, helper, key]) => ({ file, call, helper, key }),
  ),
);

const resolve = ({ helper, key }) => {
  if (!helper) return key.split('.').reduce((node, step) => node?.[step], theme);
  const namespace = NAMESPACE_BY_HELPER[helper];
  return namespace ? theme[namespace]?.[key] : undefined;
};

const leaves = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' ? leaves(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );

describe('theme', () => {
  it('finds token usages in the style files', () => {
    expect(tokenUsages.length).toBeGreaterThan(100);
  });

  it('defines every token used in the style files', () => {
    const missing = tokenUsages.filter(usage => resolve(usage) === undefined);
    expect(missing.map(({ file, call }) => `${file}: ${call}`)).toEqual([]);
  });

  it('only uses th helpers that map to a theme namespace', () => {
    const unknownHelpers = tokenUsages.filter(
      ({ helper }) => helper && !(helper in NAMESPACE_BY_HELPER),
    );
    expect(unknownHelpers.map(({ call }) => call)).toEqual([]);
  });

  it('has no empty token', () => {
    const empty = leaves(theme).filter(([, value]) => value === '' || value === undefined);
    expect(empty).toEqual([]);
  });

  it('renders tokens through the xstyled th helpers', () => {
    const Card = styled.div`
      color: ${th.color('accent')};
      background-color: ${th.color('foreground-a10')};
      padding: ${th.space(16)};
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
    expect(style.fontSize).toBe('14px');
    expect(style.lineHeight).toBe('1.5');
    expect(style.borderRadius).toBe('12px');
    expect(style.zIndex).toBe('1');
    expect(style.transitionDuration).toBe('0.25s');
  });
});
