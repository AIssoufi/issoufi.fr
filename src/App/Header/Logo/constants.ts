import outline from './.data/outline.json';

/**
 * Logo of the header as `pnpm icons` writes it in `.data/outline.json`, from the display font of
 * the theme: the outline of its letters, in the box of the line of text that it replaces. The
 * script calls the same shape `HeaderLogo`.
 */
export interface HeaderLogo {
  /**
   * View box of the SVG, in font units, its baseline at y = 0: from the origin of the text and the
   * top of its line, over the advance of the text and the height of the line.
   */
  viewBox: string;
  /** Width of the SVG, the advance of the text, the spacing after each letter included, in ems. */
  widthEm: number;
  /** Height of the SVG, the height of a line of text in the font, in ems. */
  heightEm: number;
  /** Distance from the baseline down to the bottom of the SVG, in ems. */
  descentEm: number;
  /** Outline of the letters, in font units. */
  pathData: string;
}

/**
 * Outline of the letters of the logo, which `pnpm icons` writes from the display font of the
 * theme and the letter spacing of the logo: the header draws it in the place of their text, so
 * that no page loads that font for two letters. Run `pnpm icons` after a change of either.
 */
export const LOGO_OUTLINE: HeaderLogo = outline;

/** Text of the logo, the initials that it draws, which screen readers read as its name. */
export const LOGO_TEXT = 'AI';
