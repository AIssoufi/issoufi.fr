/**
 * A font file that the site serves itself, declared with `@font-face` by `renderFontFaces`
 * (`utils.ts`).
 */
export interface FontFaceDeclaration {
  /** Name of the family, the first font of a stack of `fontFamilies` (`tokens.ts`). */
  family: string;
  /**
   * URL of the `woff2` file in the site, e.g. `/fonts/montserrat-latin.woff2` for
   * `public/fonts/montserrat-latin.woff2`. Written as one whole string: the standalone build
   * replaces it with a data URL.
   */
  url: string;
  /** Weight that the file draws, or the range of weights of a variable font, e.g. `100 900`. */
  weight: string;
  /** Style that the file draws: `normal` or `italic`. */
  style: string;
  /**
   * Characters that the file holds, e.g. `U+0000-00FF, U+0131`. The browser draws the others in
   * the next font of the stack.
   */
  unicodeRange: string;
}
