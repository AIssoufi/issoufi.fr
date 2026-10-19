import { isNonBlankString } from '../utils/strings';
import { FONT_DISPLAY, FONT_FACES, FONT_FILE_FORMAT } from './constants';
import type { FontFaceDeclaration } from './types';

/** Characters that end or escape a CSS string between single quotes. */
const CSS_STRING_BREAKER_PATTERN = /['\\]/g;

/**
 * Tells whether a value is a font that can be declared: an object whose family and URL are
 * filled strings.
 *
 * @param value - Entry of a list of fonts, such as {@link FONT_FACES}, which may hold anything.
 * @returns `false` for a missing value, and for a font without a family or a URL.
 *
 * @example
 * isDeclarableFontFace({ family: 'Montserrat', url: '/fonts/montserrat-latin.woff2' }); // true
 * isDeclarableFontFace({ family: 'Montserrat', url: '' }); // false
 */
export const isDeclarableFontFace = (value: unknown): value is FontFaceDeclaration => {
  const face = value as Partial<FontFaceDeclaration> | null | undefined;
  return isNonBlankString(face?.family) && isNonBlankString(face?.url);
};

/** Keeps the URL of a font file as it is: the default of {@link RenderFontFacesParams.getUrl}. */
const keepUrl = (url: string) => url;

/**
 * Writes a text as a CSS string between single quotes, each quote or backslash of the text
 * escaped, so that a family name or a URL can never end it early.
 */
const toCssString = (text: string) => `'${text.replace(CSS_STRING_BREAKER_PATTERN, '\\$&')}'`;

/** Parameters of {@link renderFontFaces}. */
interface RenderFontFacesParams {
  /**
   * Fonts to declare. Defaults to {@link FONT_FACES}. Any value that is not an array counts as
   * none, and an entry without a family or a URL is left out.
   */
  fontFaces?: readonly FontFaceDeclaration[];
  /**
   * Gives the URL to write in the rule of a font file from its URL in the site, such as a data URL
   * for a page that the site does not serve. Defaults to the URL itself. A face whose URL it does
   * not turn into a filled string is left out.
   */
  getUrl?: (url: string) => string;
}

/**
 * Renders the `@font-face` rule of each web font, which the browser shows in the next font of
 * the stack until the file is loaded ({@link FONT_DISPLAY}). The `font-faces` plugin of
 * `vite.config.ts` declares the fonts of the site with it, and a script that renders a page in
 * those fonts, such as `pnpm og-image`, reads the same files with `getUrl`.
 *
 * @returns The rules, one after the other, or `''` when there is no font to declare. A missing
 * weight, style or range of characters leaves its descriptor out.
 *
 * @example
 * renderFontFaces({
 *   getUrl: url => toDataUrl({ content: readFileSync(join('public', url)), fileName: url }),
 * });
 * // "@font-face {\n  font-family: 'Montserrat';\n  …\n  src: url('data:font/woff2;base64,…') …"
 */
export const renderFontFaces = ({
  fontFaces = FONT_FACES,
  getUrl = keepUrl,
}: RenderFontFacesParams = {}): string => {
  const faces = Array.isArray(fontFaces) ? fontFaces : [];
  const toRuleUrl = typeof getUrl === 'function' ? getUrl : keepUrl;

  return faces
    .filter(isDeclarableFontFace)
    .flatMap(face => {
      const url = toRuleUrl(face.url);
      if (!isNonBlankString(url)) return [];

      const descriptors = [
        `font-family: ${toCssString(face.family)};`,
        isNonBlankString(face.style) && `font-style: ${face.style};`,
        isNonBlankString(face.weight) && `font-weight: ${face.weight};`,
        `font-display: ${FONT_DISPLAY};`,
        `src: url(${toCssString(url)}) format(${toCssString(FONT_FILE_FORMAT)});`,
        isNonBlankString(face.unicodeRange) && `unicode-range: ${face.unicodeRange};`,
      ].filter(isNonBlankString);

      return [`@font-face {\n${descriptors.map(descriptor => `  ${descriptor}`).join('\n')}\n}`];
    })
    .join('\n');
};
