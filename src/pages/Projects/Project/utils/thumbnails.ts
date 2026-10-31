import { isNonBlankString } from '../../../../utils/strings.ts';

/** One file of the screenshot of a project: the same image as the other files, at one width. */
export interface ThumbnailFile {
  /**
   * Absolute URL of the file in `public/`, e.g. `/chess-480.webp`, written whole: the standalone
   * build rewrites it into a relative URL.
   */
  url: string;
  /** Width of the file in pixels, its `w` descriptor in `srcset`. */
  width: number;
  /** Height of the file in pixels. */
  height: number;
}

/** Attributes of the `img` of a thumbnail, built by `getThumbnailSources` from its files. */
interface ThumbnailSources {
  /** Widest file, for the browsers that ignore `srcset`. */
  src: string;
  /** Every file with its width (`/chess-480.webp 480w, …`), among which the browser picks. */
  srcSet: string;
  /** Width of the widest file, which gives the `img` the ratio of the screenshot. */
  width: number;
  /** Height of the widest file. */
  height: number;
}

/** Any white space character, which would split a URL of a `srcset` in two. */
const WHITE_SPACE_PATTERN = /\s/;

/** Whether a value is a whole number of pixels above zero, as the width or height of a file. */
const isPixelCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/** Whether an item of the JSON data is a file of a thumbnail that a `srcset` can name. */
const isThumbnailFile = (file: unknown): file is ThumbnailFile => {
  const isObject = typeof file === 'object' && file !== null;
  if (!isObject) return false;

  const { url, width, height } = file as Partial<ThumbnailFile>;
  const isSrcSetUrl = isNonBlankString(url) && !WHITE_SPACE_PATTERN.test(url);
  return isSrcSetUrl && isPixelCount(width) && isPixelCount(height);
};

/** Orders thumbnail files from the narrowest to the widest. */
const byWidth = (first: ThumbnailFile, second: ThumbnailFile) => first.width - second.width;

/**
 * Builds the attributes of the `img` of a thumbnail from its files: a `srcset` that names each
 * file with its width, from the narrowest, and the widest file as its `src`, whose width and
 * height give the `img` the ratio of the screenshot.
 *
 * @param files - `thumbnails` of a project, which may come from JSON with missing or wrong fields.
 * @returns `undefined` without a valid file. A file without a URL, with a URL holding white space,
 * or without a whole number of pixels above zero as its width and height is left out, and so is a
 * file of the same width as an earlier one, which a `srcset` cannot hold twice.
 *
 * @example
 * getThumbnailSources([
 *   { url: '/chess-480.webp', width: 480, height: 300 },
 *   { url: '/chess-960.webp', width: 960, height: 600 },
 * ]);
 * // { src: '/chess-960.webp', srcSet: '/chess-480.webp 480w, /chess-960.webp 960w',
 * //   width: 960, height: 600 }
 */
export function getThumbnailSources(files?: unknown): ThumbnailSources | undefined {
  if (!Array.isArray(files)) return undefined;

  const filesByWidth = new Map<number, ThumbnailFile>();
  files.filter(isThumbnailFile).forEach(file => {
    if (!filesByWidth.has(file.width)) filesByWidth.set(file.width, file);
  });
  const sortedFiles = [...filesByWidth.values()].sort(byWidth);
  const widestFile = sortedFiles[sortedFiles.length - 1];
  if (!widestFile) return undefined;

  return {
    src: widestFile.url,
    srcSet: sortedFiles.map(({ url, width }) => `${url} ${width}w`).join(', '),
    width: widestFile.width,
    height: widestFile.height,
  };
}
