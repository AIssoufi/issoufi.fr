import { theme } from '../../../src/theme/theme';
import { hasUnresolvedValue } from '../../utils/html.mjs';
import { renderCvStyles } from './styles.mjs';

const styles = renderCvStyles(theme);

describe('renderCvStyles', () => {
  it('resolves every design token of the theme', () => {
    expect(hasUnresolvedValue(styles)).toBe(false);
  });

  it('writes in the font and the colors of the site, dark ink on white paper', () => {
    expect(styles).toContain(`font-family: ${theme.fonts.body};`);
    expect(styles).toContain(`background-color: ${theme.colors.foreground};`);
    expect(styles).toContain(`color: ${theme.colors.background};`);
    expect(styles).toContain(`color: ${theme.colors.accent};`);
  });

  it('marks the bullet points with the "›" of the Experiences page, inside the page', () => {
    expect(styles).toMatch(/\.bullets \{\s*list-style: none;/);
    expect(styles).toMatch(
      /\.bullets li::before \{\s*content: '›';\s*position: absolute;\s*left: 0;/,
    );
  });

  it('prints on A4 paper', () => {
    expect(styles).toMatch(/@page \{\s*size: A4;/);
  });

  it('turns off ligatures, so that a search for "fi" finds the text in every reader', () => {
    expect(styles).toContain('font-variant-ligatures: none;');
  });

  it.each([
    ['a missing color', { colors: { ...theme.colors, 'shade-a80': undefined } }],
    ['missing line heights', { lineHeights: {} }],
    ['missing font weights', { fontWeights: {} }],
  ])('shows %s as an unresolved value', (_case, overrides) => {
    expect(hasUnresolvedValue(renderCvStyles({ ...theme, ...overrides }))).toBe(true);
  });
});
