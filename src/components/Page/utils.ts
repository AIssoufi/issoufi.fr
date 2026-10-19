import type { BackgroundPhoto } from '../../utils/pages';
import { isNonBlankString } from '../../utils/strings';
import {
  CSS_ESCAPE_RADIX,
  CSS_STRING_LINE_BREAKS,
  CSS_STRING_SPECIAL_CHARACTERS,
  NO_BACKGROUND_IMAGE,
} from './constants';

/** Writes the escape of a character in a CSS string: its code point in hexadecimal and a space. */
const escapeCssCodePoint = (character: string) =>
  `\\${character.charCodeAt(0).toString(CSS_ESCAPE_RADIX)} `;

/**
 * Writes the `background-image` that shows an image: its URL in a CSS string, so that a space or a
 * parenthesis keeps it whole, with the quotes, backslashes and line breaks that would end the
 * string escaped.
 *
 * @param url - URL of the image, e.g. `/home.webp`.
 * @returns `url("…")`, or {@link NO_BACKGROUND_IMAGE} for a missing, blank or non-string URL.
 *
 * @example
 * toBackgroundImage('/home.webp'); // 'url("/home.webp")'
 * toBackgroundImage(''); // 'none'
 */
export const toBackgroundImage = (url?: unknown): string => {
  if (!isNonBlankString(url)) return NO_BACKGROUND_IMAGE;

  const cssString = url
    .trim()
    .replace(CSS_STRING_SPECIAL_CHARACTERS, '\\$&')
    .replace(CSS_STRING_LINE_BREAKS, escapeCssCodePoint);
  return `url("${cssString}")`;
};

/** Joins the background layers that show an image, the first one on top, or `none` without any. */
const joinBackgroundLayers = (layers: string[]) => {
  const imageLayers = layers.filter(layer => layer !== NO_BACKGROUND_IMAGE);
  return imageLayers.length > 0 ? imageLayers.join(', ') : NO_BACKGROUND_IMAGE;
};

/**
 * `background-image` of each version of a background photo, as {@link getBackgroundImages} writes
 * them.
 */
export interface BackgroundImages {
  /** Layers of the whole photo, shown on every screen but narrow portrait ones. */
  image: string;
  /** Layers of its portrait version, shown on narrow portrait screens. */
  portraitImage: string;
}

/**
 * Writes the `background-image` of each version of a background photo (see
 * {@link toBackgroundImage}): the photo over its placeholder, which shows until the photo is
 * downloaded. A version without a URL shows the other one, so a photo given with a single URL
 * still covers every screen, and a photo without a placeholder has a single layer.
 *
 * @param photo - Background photo of a page. Missing, or without any URL, both images are
 * {@link NO_BACKGROUND_IMAGE}.
 *
 * @example
 * getBackgroundImages({ url: '/a.webp', portraitUrl: '/a-p.webp', placeholderUrl: 'data:…' });
 * // {
 * //   image: 'url("/a.webp"), url("data:…")',
 * //   portraitImage: 'url("/a-p.webp"), url("data:…")',
 * // }
 * getBackgroundImages({ url: '/home.webp' });
 * // { image: 'url("/home.webp")', portraitImage: 'url("/home.webp")' }
 */
export const getBackgroundImages = (photo?: Partial<BackgroundPhoto> | null): BackgroundImages => {
  const image = toBackgroundImage(photo?.url);
  const portraitImage = toBackgroundImage(photo?.portraitUrl);
  const placeholder = toBackgroundImage(photo?.placeholderUrl);
  const hasImage = image !== NO_BACKGROUND_IMAGE;
  const hasPortraitImage = portraitImage !== NO_BACKGROUND_IMAGE;

  return {
    image: joinBackgroundLayers([hasImage ? image : portraitImage, placeholder]),
    portraitImage: joinBackgroundLayers([hasPortraitImage ? portraitImage : image, placeholder]),
  };
};
