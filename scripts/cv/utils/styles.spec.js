import { theme } from '../../../src/theme/theme.ts';
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

  it('draws the mark of the bullet points, which adds no character to the text of the PDF', () => {
    expect(styles).toMatch(/\.bullets \{\s*list-style: none;/);
    expect(styles).toMatch(/\.bullets li::before \{\s*content: '';/);
  });

  it('positions no element, which Chromium would paint, so read, after the rest of its page', () => {
    expect(styles).not.toMatch(/position:/);
  });

  it('keeps a role on one page, so that its bullet points never leave its title', () => {
    expect(styles).toMatch(/\.role \{[^}]*break-inside: avoid;/);
  });

  it('keeps the last word of a paragraph off a line of its own', () => {
    expect(styles).toContain('text-wrap: pretty;');
  });

  it('justifies the paragraphs, the bullet points and the skills', () => {
    expect(styles).toMatch(
      /\.summary,\s*\.text,\s*\.bullets li,\s*\.skills li \{[^}]*text-align: justify;/,
    );
  });

  it('breaks a line of projects between two names, never inside one', () => {
    expect(styles).toMatch(/\.entry \{[^}]*white-space: nowrap;/);
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
