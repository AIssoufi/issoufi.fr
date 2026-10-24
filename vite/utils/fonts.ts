import type { HtmlTagDescriptor } from 'vite';

import { FONT_FACES, FONT_MEDIA_TYPE } from '../../src/theme/constants.ts';
import type { FontFaceDeclaration } from '../../src/theme/types.ts';
import { isDeclarableFontFace, renderFontFaces } from '../../src/theme/utils.ts';

/** Keeps the URL of a font file as it is: the default of {@link GetFontFaceTagsParams.getUrl}. */
const keepUrl = (url: string) => url;

/** Parameters of {@link getFontFaceTags}. */
interface GetFontFaceTagsParams {
  /**
   * Fonts to preload and declare. Defaults to {@link FONT_FACES}. Any value that is not an array
   * counts as none, and an entry without a family or a URL is left out.
   */
  fontFaces?: readonly FontFaceDeclaration[];
  /**
   * Gives the URL that the pages load a font file from, from its URL in the site, such as the URL
   * of its copy under a hash of its content in the build. Defaults to the URL itself. A face whose
   * URL it does not turn into a filled string is left out, its preload link with its rule.
   */
  getUrl?: (url: string) => string;
}

/**
 * Lists the tags that the `font-faces` plugin of `vite.config.ts` adds to the head of every page
 * for the web fonts: a link that preloads each font file, since every page shows text in each
 * font, then a `<style>` of their `@font-face` rules (see `renderFontFaces`). The rules sit in a
 * style sheet of their own, which nothing changes: in the style sheet of styled-components, which
 * grows with each component that mounts, Chrome would load the fonts again each time, showing the
 * fallback font meanwhile.
 *
 * @returns The preload links, in the order of the fonts, then the style; none when there is no
 * font to declare.
 *
 * @example
 * getFontFaceTags();
 * // [{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/montserrat-latin.woff2', … } }, …,
 * //  { tag: 'style', children: "@font-face {\n  font-family: 'Montserrat';…", injectTo: 'head' }]
 * getFontFaceTags({ getUrl: url => '/assets/montserrat-latin-1a2b3c.woff2' });
 * // [{ tag: 'link', attrs: { …, href: '/assets/montserrat-latin-1a2b3c.woff2', … } }, …]
 */
export const getFontFaceTags = ({
  fontFaces = FONT_FACES,
  getUrl = keepUrl,
}: GetFontFaceTagsParams = {}): HtmlTagDescriptor[] => {
  const toPageUrl = typeof getUrl === 'function' ? getUrl : keepUrl;
  const declarableFaces = Array.isArray(fontFaces) ? fontFaces.filter(isDeclarableFontFace) : [];
  const faces = declarableFaces
    .map(face => ({ ...face, url: toPageUrl(face.url) }))
    .filter(isDeclarableFontFace);
  if (faces.length === 0) return [];

  const preloadLinks = faces.map(({ url }): HtmlTagDescriptor => ({
    tag: 'link',
    attrs: { rel: 'preload', href: url, as: 'font', type: FONT_MEDIA_TYPE, crossorigin: true },
    injectTo: 'head',
  }));
  const style: HtmlTagDescriptor = {
    tag: 'style',
    children: renderFontFaces({ fontFaces: faces }),
    injectTo: 'head',
  };
  return [...preloadLinks, style];
};
