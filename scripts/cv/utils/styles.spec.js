import { theme } from '../../../src/theme/theme.ts';
import { hasUnresolvedValue } from '../../utils/html.mjs';
import { CV_LAYOUT } from '../constants.mjs';
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

  it('spreads the contact details over the full width of the header', () => {
    expect(styles).toMatch(/\.contacts \{[^}]*justify-content: space-between;/);
  });

  it('draws no line under the header, since the title of the first section has its own', () => {
    const [headerRule] = styles.match(/\.header \{[^}]*\}/);

    expect(headerRule).not.toContain('border');
  });

  it('links the roles of a company on a timeline, with a drawn dot before each title', () => {
    const [roleRule] = styles.match(/\.role \{[^}]*\}/);
    const [nextRoleRule] = styles.match(/\.role \+ \.role \{[^}]*\}/);
    const [dotRule] = styles.match(/\.role-title::before \{[^}]*\}/);

    expect(roleRule).toContain(
      `border-left: ${CV_LAYOUT.roleLineWidth} solid ${theme.colors['accent-a30']};`,
    );
    expect(nextRoleRule).toContain('margin-top: 0;');
    expect(nextRoleRule).toContain(`padding-top: ${CV_LAYOUT.roleGap};`);
    expect(dotRule).toContain("content: '';");
    // Its size holds its ring, so that the title starts where the text of its role does
    expect(dotRule).toContain('box-sizing: border-box;');
  });

  it('opens each company with a tinted band, which a page break never leaves alone', () => {
    const [companyNameRule] = styles.match(/\.company-name \{[^}]*\}/);

    expect(companyNameRule).toContain(`background-color: ${theme.colors['accent-a10']};`);
    expect(styles).not.toMatch(/\.company \+ \.company \{[^}]*border/);
  });

  it('keeps the last word of a paragraph off a line of its own', () => {
    expect(styles).toContain('text-wrap: pretty;');
  });

  it('justifies the profile and the skills, and never hyphenates a word', () => {
    expect(styles).toMatch(
      /\.summary,\s*\.summary \+ \.text,\s*\.skills li \{[^}]*text-align: justify;/,
    );
    expect(styles).not.toContain('hyphens');
  });

  it('leaves the paragraphs and the bullet points of the experiences aligned on the left', () => {
    // The rule of the profile and the skills is the only one that justifies
    expect(styles.match(/text-align: justify;/g)).toHaveLength(1);
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
