import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { FONT_MEDIA_TYPE } from '../../../src/theme/constants.ts';
import {
  DATA_URL_SCHEME,
  FONT_DESTINATION_PATTERN,
  LINK_TAG_PATTERN,
  OPTIONAL_ESCAPE_PATTERN,
  PRELOAD_RELATION_PATTERN,
  QUOTE_PATTERN,
} from '../constants.ts';
import { escapeRegExp } from '../../utils/strings.ts';
import { isFileName } from './strings.ts';

/** A font file of the site and its content, which the standalone build writes in its place. */
export interface EmbeddedFont {
  /** URL of the file in the site, e.g. `/fonts/montserrat-latin.woff2`. */
  url: string;
  /** Content of the file as a data URL, e.g. `data:font/woff2;base64,d09GMgABAAAA…`. */
  dataUrl: string;
}

/** Parameters of {@link readFontDataUrl}. */
interface ReadFontDataUrlParams {
  /** Absolute path of `public/`, Vite's `publicDir`. Missing or blank, no file is read. */
  publicDir?: unknown;
  /**
   * URL of the font file in the site, e.g. `/fonts/montserrat-latin.woff2`, the path of the file
   * in `public/`. Missing or blank, no file is read.
   */
  url?: unknown;
}

/**
 * Reads a `woff2` file of `public/` as a data URL, so that the standalone build can embed it in
 * the page instead of loading it from the disk.
 *
 * @returns The data URL, or `''` when a parameter is missing, when the URL leads out of `public/`
 * (`/../secret.woff2`), and when it names no file.
 *
 * @example
 * readFontDataUrl({ publicDir: '/app/public', url: '/fonts/montserrat-latin.woff2' });
 * // 'data:font/woff2;base64,d09GMgABAAAA…'
 */
export const readFontDataUrl = ({ publicDir, url }: ReadFontDataUrlParams = {}): string => {
  const canRead = isFileName(publicDir) && isFileName(url);
  if (!canRead) return '';

  const file = join(publicDir, url);
  const pathFromPublicDir = relative(publicDir, file);
  // join() resolves `..`, which could lead out of public/
  const isInPublicDir = pathFromPublicDir !== '' && !pathFromPublicDir.startsWith('..');
  const isFile = isInPublicDir && existsSync(file) && statSync(file).isFile();
  if (!isFile) return '';

  return `${DATA_URL_SCHEME}${FONT_MEDIA_TYPE};base64,${readFileSync(file).toString('base64')}`;
};

/** Tells whether a value is an embedded font: a filled URL and a data URL. */
const isEmbeddedFont = (value: unknown): value is EmbeddedFont => {
  const font = value as Partial<EmbeddedFont> | null | undefined;
  const hasDataUrl = typeof font?.dataUrl === 'string' && font.dataUrl.startsWith(DATA_URL_SCHEME);
  return isFileName(font?.url) && hasDataUrl;
};

/** Tells whether a value is a font file with a URL that could not be read: no data URL. */
const isUnreadFont = (value: unknown): value is Partial<EmbeddedFont> & { url: string } => {
  const font = value as Partial<EmbeddedFont> | null | undefined;
  return isFileName(font?.url) && !isEmbeddedFont(font);
};

/**
 * Lists the font files that could not be read, so that the standalone build fails rather than
 * ship a page without its fonts.
 *
 * @param fonts - Font files and their data URLs, from {@link readFontDataUrl}, whose data URL is
 * empty when the file is missing. Any value that is not an array counts as none.
 * @returns The URL of each font whose data URL is missing or does not start with `data:`, in
 * order; entries without a URL are skipped.
 *
 * @example
 * findMissingFontUrls([{ url: '/fonts/a.woff2', dataUrl: '' }]); // ['/fonts/a.woff2']
 */
export const findMissingFontUrls = (fonts?: readonly Partial<EmbeddedFont>[] | null): string[] => {
  const fontList: readonly unknown[] = Array.isArray(fonts) ? fonts : [];
  return fontList.filter(isUnreadFont).map(({ url }) => url);
};

/** Parameters of {@link toFontDataUrls}. */
interface ToFontDataUrlsParams {
  /**
   * HTML of a page, or code, that names the font files. Missing or not a string, it counts as
   * empty.
   */
  source?: string;
  /**
   * Font files and their data URLs, from {@link readFontDataUrl}. Entries without a URL or whose
   * data URL does not start with `data:` are ignored.
   */
  fonts?: readonly EmbeddedFont[];
}

/**
 * Writes the data URL of each font file in place of its URL, such as
 * `url('/fonts/montserrat-latin.woff2')` in the `@font-face` rules of `index.html`, so that the
 * standalone build holds its fonts: the page renders in them offline, whatever the browser allows
 * from `file://`. Only a whole string naming a font file changes, between single, double or back
 * quotes, escaped or not: `'/fonts/montserrat-latin.woff2.bak'` stays as it is.
 *
 * @returns The source with the data URLs, or the source unchanged when it names none of the
 * files.
 *
 * @example
 * toFontDataUrls({
 *   source: "src: url('/fonts/a.woff2') format('woff2');",
 *   fonts: [{ url: '/fonts/a.woff2', dataUrl: 'data:font/woff2;base64,d09G' }],
 * }); // "src: url('data:font/woff2;base64,d09G') format('woff2');"
 */
export const toFontDataUrls = ({ source, fonts }: ToFontDataUrlsParams = {}): string => {
  const text = typeof source === 'string' ? source : '';
  const embeddedFonts = Array.isArray(fonts) ? fonts.filter(isEmbeddedFont) : [];
  const canNameAFont = text !== '' && embeddedFonts.length > 0;
  if (!canNameAFont) return text;

  return embeddedFonts.reduce((embeddedText, { url, dataUrl }) => {
    const urlPattern = new RegExp(
      `(?<=${QUOTE_PATTERN})${escapeRegExp(url)}(?=${OPTIONAL_ESCAPE_PATTERN}${QUOTE_PATTERN})`,
      'g',
    );
    // A function, so that no `$` of a data URL is read as a reference to a group
    return embeddedText.replace(urlPattern, () => dataUrl);
  }, text);
};

/** Tells whether a link tag preloads a font file. */
const isFontPreload = (tag: string) =>
  PRELOAD_RELATION_PATTERN.test(tag) && FONT_DESTINATION_PATTERN.test(tag);

/**
 * Removes the links that preload a font file from an HTML page, such as those of `index.html`:
 * the standalone build embeds its fonts in the page (see {@link toFontDataUrls}), so a preload
 * would only fetch the copy of the file from the disk.
 *
 * @param html - HTML of the page. A value that is not a string counts as an empty page.
 * @returns The page without those links and the spaces before them; other links stay.
 *
 * @example
 * removeFontPreloads('<head>\n  <link rel="preload" href="/a.woff2" as="font" />\n</head>');
 * // '<head>\n</head>'
 */
export const removeFontPreloads = (html?: unknown): string => {
  const page = typeof html === 'string' ? html : '';
  return page.replace(LINK_TAG_PATTERN, tag => (isFontPreload(tag) ? '' : tag));
};
